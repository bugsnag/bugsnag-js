//
//  BugsnagClient.m
//
//  Created by Conrad Irwin on 2014-10-01.
//
//  Copyright (c) 2014 Bugsnag, Inc. All rights reserved.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall remain in place
// in this source code.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
//

#import "BugsnagClient+Private.h"

#import "BSGAppHangDetector.h"
#import "BSGConnectivity.h"
#import "BSGCrashSentry.h"
#import "BSGEventUploader.h"
#import "BSGFileLocations.h"
#import "BSGInternalErrorReporter.h"
#import "BSGJSONSerialization.h"
#import "BSGKeys.h"
#import "BSGNotificationBreadcrumbs.h"
#import "BSGRunContext.h"
#import "BSGSerialization.h"
#import "BSGUtils.h"
#import "BSG_KSCrashC.h"
#import "BSG_KSSystemInfo.h"
#import "Bugsnag.h"
#import "BugsnagApp+Private.h"
#import "BugsnagAppWithState+Private.h"
#import "BugsnagBreadcrumb+Private.h"
#import "BugsnagBreadcrumbs.h"
#import "BugsnagCollections.h"
#import "BugsnagConfiguration+Private.h"
#import "BugsnagDeviceWithState+Private.h"
#import "BugsnagError+Private.h"
#import "BugsnagErrorTypes.h"
#import "BugsnagEvent+Private.h"
#import "BugsnagFeatureFlag.h"
#import "BugsnagHandledState.h"
#import "BugsnagLastRunInfo+Private.h"
#import "BugsnagLogger.h"
#import "BugsnagMetadata+Private.h"
#import "BugsnagNotifier.h"
#import "BugsnagPlugin.h"
#import "BugsnagSession+Private.h"
#import "BugsnagSessionTracker.h"
#import "BugsnagStackframe+Private.h"
#import "BugsnagSystemState.h"
#import "BugsnagThread+Private.h"
#import "BugsnagUser+Private.h"

#if TARGET_OS_IOS || TARGET_OS_TV
#define BSG_OOM_AVAILABLE 1
#else
#define BSG_OOM_AVAILABLE 0
#endif

#if TARGET_OS_IOS
#import "BSGUIKit.h"
#elif TARGET_OS_OSX
#import "BSGAppKit.h"
#endif

static NSString *const BSTabCrash = @"crash";
static NSString *const BSAttributeDepth = @"depth";

static struct {
    // Contains the state of the event (handled/unhandled)
    char *handledState;
    // Contains the user-specified metadata, including the user tab from config.
    char *metadataJSON;
    // Contains the Bugsnag configuration, all under the "config" tab.
    char *configPath;
    // Contains notifier state under "deviceState", and crash-specific
    // information under "crash".
    char *stateJSON;
    // User onCrash handler
    void (*onCrash)(const BSG_KSCrashReportWriter *writer);
} bsg_g_bugsnag_data;

static char *watchdogSentinelPath = NULL;
static char *crashSentinelPath;

/**
 *  Handler executed when the application crashes. Writes information about the
 *  current application state using the crash report writer.
 *
 *  @param writer report writer which will receive updated metadata
 */
void BSSerializeDataCrashHandler(const BSG_KSCrashReportWriter *writer) {
    BOOL isCrash = YES;
    BSGSessionWriteCrashReport(writer);

    if (isCrash) {
        writer->addJSONFileElement(writer, "config", bsg_g_bugsnag_data.configPath);
        writer->addJSONElement(writer, "metaData", bsg_g_bugsnag_data.metadataJSON);
        writer->addJSONElement(writer, "state", bsg_g_bugsnag_data.stateJSON);

#if TARGET_OS_IOS
        if (bsg_runContext->batteryState != UIDeviceBatteryStateUnknown) {
            writer->addFloatingPointElement(writer, "batteryLevel", bsg_runContext->batteryLevel);
            writer->addBooleanElement(writer, "charging", bsg_runContext->batteryState >= UIDeviceBatteryStateCharging);
        }
        writer->addIntegerElement(writer, "orientation", bsg_runContext->lastKnownOrientation);
#endif
        writer->addBooleanElement(writer, "isLaunching", bsg_runContext->isLaunching);
        writer->addIntegerElement(writer, "thermalState", bsg_runContext->thermalState);

        BugsnagBreadcrumbsWriteCrashReport(writer);

        if (watchdogSentinelPath != NULL) {
            // Delete the file to indicate a handled termination
            unlink(watchdogSentinelPath);
        }
        // Create a file to indicate that the crash has been handled by
        // the library. This exists in case the subsequent `onCrash` handler
        // crashes or otherwise corrupts the crash report file.
        int fd = open(crashSentinelPath, O_RDWR | O_CREAT, 0644);
        if (fd > -1) {
            close(fd);
        }
    }

    if (bsg_g_bugsnag_data.onCrash) {
        bsg_g_bugsnag_data.onCrash(writer);
    }
}

// =============================================================================

// MARK: -

@interface BugsnagClient () <BSGAppHangDetectorDelegate, BSGBreadcrumbSink, BSGInternalErrorReporterDataSource>

@property (nonatomic) BSGNotificationBreadcrumbs *notificationBreadcrumbs;

@property (weak, nonatomic) NSTimer *appLaunchTimer;

@property (readonly, nonatomic) BSGFeatureFlagStore *featureFlagStore;

@property (readwrite, nullable, nonatomic) BugsnagLastRunInfo *lastRunInfo;

@end


// MARK: -

#if __clang_major__ >= 11 // Xcode 10 does not like the following attribute
__attribute__((annotate("oclint:suppress[long class]")))
__attribute__((annotate("oclint:suppress[too many methods]")))
#endif
@implementation BugsnagClient

@dynamic user; // This computed property should not have a backing ivar

- (instancetype)initWithConfiguration:(BugsnagConfiguration *)configuration {
    if ((self = [super init])) {
        // Take a shallow copy of the configuration
        _configuration = [configuration copy];
        
        if (!_configuration.user.id) { // populate with an autogenerated ID if no value set
            [_configuration setUser:[BSG_KSSystemInfo deviceAndAppHash] withEmail:_configuration.user.email andName:_configuration.user.name];
        }
        
        _featureFlagStore = [configuration.featureFlagStore mutableCopy];
        
        _state = [[BugsnagMetadata alloc] initWithDictionary:@{
            BSGKeyClient: @{
                BSGKeyContext: _configuration.context ?: [NSNull null],
                BSGKeyFeatureFlags: BSGFeatureFlagStoreToJSON(_featureFlagStore),
            },
            BSGKeyUser: [_configuration.user toJson] ?: @{}
        }];
        
        _notifier = _configuration.notifier ?: [[BugsnagNotifier alloc] init];

        BSGFileLocations *fileLocations = [BSGFileLocations current];
        
        NSString *crashPath = fileLocations.flagHandledCrash;
        crashSentinelPath = strdup(crashPath.fileSystemRepresentation);
        
        bsg_g_bugsnag_data.configPath = strdup(fileLocations.configuration.fileSystemRepresentation);
        
        self.stateEventBlocks = [NSMutableArray new];
        self.extraRuntimeInfo = [NSMutableDictionary new];

        _eventUploader = [[BSGEventUploader alloc] initWithConfiguration:_configuration notifier:_notifier];
        bsg_g_bugsnag_data.onCrash = (void (*)(const BSG_KSCrashReportWriter *))self.configuration.onCrashHandler;

        self.breadcrumbs = [[BugsnagBreadcrumbs alloc] initWithConfiguration:self.configuration];

        // Start with a copy of the configuration metadata
        self.metadata = [[_configuration metadata] deepCopy];
        // add metadata about app/device
        NSDictionary *systemInfo = [BSG_KSSystemInfo systemInfo];
        [self.metadata addMetadata:BSGParseAppMetadata(@{@"system": systemInfo}) toSection:BSGKeyApp];
        [self.metadata addMetadata:BSGParseDeviceMetadata(@{@"system": systemInfo}) toSection:BSGKeyDevice];

        BSGInternalErrorReporter.sharedInstance = [[BSGInternalErrorReporter alloc] initWithDataSource:self];
    }
    return self;
}

- (void)start {
    [self.configuration validate];

    BSGRunContextInit(BSGFileLocations.current.runContext.fileSystemRepresentation);
    BSGCrashSentryInstall(self.configuration, BSSerializeDataCrashHandler);
    self.systemState = [[BugsnagSystemState alloc] initWithConfiguration:self.configuration];

    [self computeDidCrashLastLaunch];

    // These files can only be overwritten once the previous contents have been read; see -generateEventForLastLaunchWithError:
    BSGJSONWriteToFileAtomically(self.configuration.dictionaryRepresentation, BSGFileLocations.current.configuration, nil);
    [self.metadata setStorageBuffer:&bsg_g_bugsnag_data.metadataJSON file:BSGFileLocations.current.metadata];
    [self.state setStorageBuffer:&bsg_g_bugsnag_data.stateJSON file:BSGFileLocations.current.state];
    [self.breadcrumbs removeAllBreadcrumbs];

    [self setupConnectivityListener];
    
    self.notificationBreadcrumbs = [[BSGNotificationBreadcrumbs alloc] initWithConfiguration:self.configuration breadcrumbSink:self];
    [self.notificationBreadcrumbs start];

    NSNotificationCenter *center = [NSNotificationCenter defaultCenter];

    [center addObserver:self
               selector:@selector(applicationWillTerminate:)
#if TARGET_OS_IOS || TARGET_OS_TV
                   name:UIApplicationWillTerminateNotification
#elif TARGET_OS_OSX
                   name:NSApplicationWillTerminateNotification
#endif
                 object:nil];

    self.started = YES;

    id<BugsnagPlugin> reactNativePlugin = [NSClassFromString(@"BugsnagReactNativePlugin") new];
    if (reactNativePlugin) {
        [self.configuration.plugins addObject:reactNativePlugin];
    }
    for (id<BugsnagPlugin> plugin in self.configuration.plugins) {
        @try {
            [plugin load:self];
        } @catch (NSException *exception) {
            bsg_log_err(@"Plugin %@ threw exception in -load: %@", plugin, exception);
        }
    }

    self.sessionTracker = [[BugsnagSessionTracker alloc] initWithConfig:self.configuration client:self];
    [self.sessionTracker startWithNotificationCenter:center isInForeground:bsg_runContext->isForeground];

    // Record a "Bugsnag Loaded" message
    [self addAutoBreadcrumbOfType:BSGBreadcrumbTypeState withMessage:@"Bugsnag loaded" andMetadata:nil];

    if (self.configuration.launchDurationMillis > 0) {
        self.appLaunchTimer = [NSTimer scheduledTimerWithTimeInterval:(double)self.configuration.launchDurationMillis / 1000.0
                                                               target:self selector:@selector(appLaunchTimerFired:)
                                                             userInfo:nil repeats:NO];
    }
    
    if (self.lastRunInfo.crashedDuringLaunch && self.configuration.sendLaunchCrashesSynchronously) {
        [self sendLaunchCrashSynchronously];
    }
    
    if (self.eventFromLastLaunch) {
        [self.eventUploader uploadEvent:(BugsnagEvent * _Nonnull)self.eventFromLastLaunch completionHandler:nil];
        self.eventFromLastLaunch = nil;
    }
    
    [self.eventUploader uploadStoredEvents];
    
    // App hang detector deliberately started after sendLaunchCrashSynchronously (which by design may itself trigger an app hang)
    // Note: BSGAppHangDetector itself checks configuration.enabledErrorTypes.appHangs
    [self startAppHangDetector];
}

- (void)appLaunchTimerFired:(__attribute__((unused)) NSTimer *)timer {
    [self markLaunchCompleted];
}

- (void)markLaunchCompleted {
    bsg_log_debug(@"App has finished launching");
    [self.appLaunchTimer invalidate];
    bsg_runContext->isLaunching = NO;
    BSGRunContextUpdateTimestamp();
}

- (void)sendLaunchCrashSynchronously {
    if (self.configuration.session.delegateQueue == NSOperationQueue.currentQueue) {
        bsg_log_warn(@"Cannot send launch crash synchronously because session.delegateQueue is set to the current queue.");
        return;
    }
    bsg_log_info(@"Sending launch crash synchronously.");
    dispatch_time_t deadline = dispatch_time(DISPATCH_TIME_NOW, 2 * NSEC_PER_SEC);
    dispatch_semaphore_t semaphore = dispatch_semaphore_create(0);
    dispatch_block_t completionHandler = ^{
        bsg_log_debug(@"Sent launch crash.");
        dispatch_semaphore_signal(semaphore);
    };
    if (self.eventFromLastLaunch) {
        [self.eventUploader uploadEvent:(BugsnagEvent * _Nonnull)self.eventFromLastLaunch completionHandler:completionHandler];
        self.eventFromLastLaunch = nil;
    } else {
        [self.eventUploader uploadLatestStoredEvent:completionHandler];
    }
    if (dispatch_semaphore_wait(semaphore, deadline)) {
        bsg_log_debug(@"Timed out waiting for launch crash to be sent.");
    }
}

- (void)computeDidCrashLastLaunch {
    BOOL didCrash = NO;
    
    // Did the app crash in a way that was detected by KSCrash?
    if (bsg_kscrashstate_currentState()->crashedLastLaunch || !access(crashSentinelPath, F_OK)) {
        bsg_log_info(@"Last run terminated due to a crash.");
        unlink(crashSentinelPath);
        didCrash = YES;
    }
    // Was the app terminated while the main thread was hung?
    else if ((self.eventFromLastLaunch = [self loadAppHangEvent]).unhandled) {
        bsg_log_info(@"Last run terminated during an app hang.");
        didCrash = YES;
    }
    else if (self.configuration.autoDetectErrors && BSGRunContextWasKilled()) {
        if (BSGRunContextWasCriticalThermalState()) {
            bsg_log_info(@"Last run terminated during a critical thermal state.");
            if (self.configuration.enabledErrorTypes.thermalKills) {
                self.eventFromLastLaunch = [self generateThermalKillEvent];
            }
#if BSG_OOM_AVAILABLE
        } else {
            bsg_log_info(@"Last run terminated unexpectedly; possible Out Of Memory.");
            if (self.configuration.enabledErrorTypes.ooms) {
                self.eventFromLastLaunch = [self generateOutOfMemoryEvent];
            }
#endif
        }
        didCrash = YES;
    }
    
    self.appDidCrashLastLaunch = didCrash;
    
    BOOL didCrashDuringLaunch = didCrash && BSGRunContextWasLaunching();
    if (didCrashDuringLaunch) {
        self.systemState.consecutiveLaunchCrashes++;
    } else {
        self.systemState.consecutiveLaunchCrashes = 0;
    }
    
    self.lastRunInfo = [[BugsnagLastRunInfo alloc] initWithConsecutiveLaunchCrashes:self.systemState.consecutiveLaunchCrashes
                                                                            crashed:didCrash
                                                                crashedDuringLaunch:didCrashDuringLaunch];
}

- (void)setCodeBundleId:(NSString *)codeBundleId {
    _codeBundleId = codeBundleId;
    [self.state addMetadata:codeBundleId withKey:BSGKeyCodeBundleId toSection:BSGKeyApp];
    [self.systemState setCodeBundleID:codeBundleId];
    self.sessionTracker.codeBundleId = codeBundleId;
}

/**
 * Removes observers and listeners to prevent allocations when the app is terminated
 */
- (void)applicationWillTerminate:(__unused NSNotification *)notification {
    [[NSNotificationCenter defaultCenter] removeObserver:self.sessionTracker];
    [[NSNotificationCenter defaultCenter] removeObserver:self];
    [BSGConnectivity stopMonitoring];

#if TARGET_OS_IOS
    [UIDEVICE currentDevice].batteryMonitoringEnabled = NO;
    [[UIDEVICE currentDevice] endGeneratingDeviceOrientationNotifications];
#endif
}

// =============================================================================
// MARK: - Session Tracking
// =============================================================================

- (void)startSession {
    [self.sessionTracker startNewSession];
}

- (void)pauseSession {
    [self.sessionTracker pauseSession];
}

- (BOOL)resumeSession {
    return [self.sessionTracker resumeSession];
}

// =============================================================================
// MARK: - Connectivity Listener
// =============================================================================

/**
 * Monitor the Bugsnag endpoint to detect changes in connectivity,
 * flush pending events when (re)connected and report connectivity
 * changes as breadcrumbs, if configured to do so.
 */
- (void)setupConnectivityListener {
    NSURL *url = self.configuration.notifyURL;

    // ARC Reference - 4.2 __weak Semantics
    // http://clang.llvm.org/docs/AutomaticReferenceCounting.html
    // Avoid potential strong reference cycle between the 'client' instance and
    // the BSGConnectivity static storage.
    __weak typeof(self) weakSelf = self;
    [BSGConnectivity monitorURL:url
                  usingCallback:^(BOOL connected, NSString *connectionType) {
        __strong typeof(weakSelf) strongSelf = weakSelf;
        if (connected) {
            [strongSelf.eventUploader uploadStoredEvents];
        }

        [strongSelf addAutoBreadcrumbOfType:BSGBreadcrumbTypeState
                                withMessage:@"Connectivity changed"
                                andMetadata:@{@"type": connectionType}];
    }];
}

// =============================================================================
// MARK: - Breadcrumbs
// =============================================================================

- (void)leaveBreadcrumbWithMessage:(NSString *_Nonnull)message {
    [self addBreadcrumbWithBlock:^(BugsnagBreadcrumb *breadcrumb) {
        breadcrumb.message = message;
    }];
}

- (void)leaveBreadcrumbForNotificationName:(NSString *_Nonnull)notificationName {
    [self.notificationBreadcrumbs startListeningForStateChangeNotification:notificationName];
}

- (void)leaveBreadcrumbWithMessage:(NSString *_Nonnull)message
                          metadata:(NSDictionary *_Nullable)metadata
                           andType:(BSGBreadcrumbType)type {
    NSDictionary *JSONMetadata = BSGJSONDictionary(metadata ?: @{});
    if (JSONMetadata != metadata && metadata) {
        bsg_log_warn("Breadcrumb metadata is not a valid JSON object: %@", metadata);
    }
    [self addBreadcrumbWithBlock:^(BugsnagBreadcrumb *_Nonnull crumbs) {
        crumbs.message = message;
        crumbs.metadata = JSONMetadata;
        crumbs.type = type;
    }];
}

// =============================================================================
// MARK: - User
// =============================================================================

- (BugsnagUser *_Nonnull)user
{
    return self.configuration.user;
}

- (void)setUser:(NSString *_Nullable)userId
      withEmail:(NSString *_Nullable)email
        andName:(NSString *_Nullable)name
{
    [self.configuration setUser:userId withEmail:email andName:name];
    NSDictionary *userJson = [self.user toJson];
    [self.state addMetadata:userJson toSection:BSGKeyUser];
    if (self.observer) {
        self.observer(BSGClientObserverUpdateUser, self.user);
    }
}

// =============================================================================
// MARK: - onSession
// =============================================================================

- (nonnull BugsnagOnSessionRef)addOnSessionBlock:(nonnull BugsnagOnSessionBlock)block {
    return [self.configuration addOnSessionBlock:block];
}

- (void)removeOnSession:(nonnull BugsnagOnSessionRef)callback {
    [self.configuration removeOnSession:callback];
}

- (void)removeOnSessionBlock:(BugsnagOnSessionBlock _Nonnull )block {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [self.configuration removeOnSessionBlock:block];
#pragma clang diagnostic pop
}

// =============================================================================
// MARK: - onBreadcrumb
// =============================================================================

- (nonnull BugsnagOnBreadcrumbRef)addOnBreadcrumbBlock:(nonnull BugsnagOnBreadcrumbBlock)block {
    return [self.configuration addOnBreadcrumbBlock:block];
}

- (void)removeOnBreadcrumb:(nonnull BugsnagOnBreadcrumbRef)callback {
    [self.configuration removeOnBreadcrumb:callback];
}

- (void)removeOnBreadcrumbBlock:(BugsnagOnBreadcrumbBlock _Nonnull)block {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [self.configuration removeOnBreadcrumbBlock:block];
#pragma clang diagnostic pop
}

// =============================================================================
// MARK: - Context
// =============================================================================

- (void)setContext:(nullable NSString *)context {
    self.configuration.context = context;
    [self.state addMetadata:context withKey:BSGKeyContext toSection:BSGKeyClient];
    if (self.observer) {
        self.observer(BSGClientObserverUpdateContext, context);
    }
}

- (NSString *)context {
    return self.configuration.context;
}

// MARK: - Notify

// note - some duplication between notifyError calls is required to ensure
// the same number of stackframes are used for each call.
// see notify:handledState:block for further info

- (void)notifyError:(NSError *_Nonnull)error {
    bsg_log_debug(@"Notify called with %@", error);
    BugsnagHandledState *state = [BugsnagHandledState handledStateWithSeverityReason:HandledError
                                                                            severity:BSGSeverityWarning
                                                                           attrValue:error.domain];
    [self notify:[self createNSErrorWrapper:error]
    handledState:state
           block:^BOOL(BugsnagEvent *_Nonnull event) {
               return [self appendNSErrorInfo:error block:nil event:event];
           }];
}

- (void)notifyError:(NSError *)error
              block:(BugsnagOnErrorBlock)block
{
    bsg_log_debug(@"Notify called with %@", error);
    BugsnagHandledState *state = [BugsnagHandledState handledStateWithSeverityReason:HandledError
                                                                            severity:BSGSeverityWarning
                                                                           attrValue:error.domain];
    [self notify:[self createNSErrorWrapper:error]
    handledState:state
           block:^BOOL(BugsnagEvent *_Nonnull event) {
               return [self appendNSErrorInfo:error block:block event:event];
           }];
}

- (NSException *)createNSErrorWrapper:(NSError *)error {
    return [NSException exceptionWithName:NSStringFromClass([error class])
                                   reason:error.localizedDescription
                                 userInfo:error.userInfo];
}

- (BOOL)appendNSErrorInfo:(NSError *)error
                    block:(BugsnagOnErrorBlock)block
                    event:(BugsnagEvent *)event {
    event.originalError = error;

    NSMutableDictionary *metadata = [NSMutableDictionary dictionary];
    metadata[@"code"] = @(error.code);
    metadata[@"domain"] = error.domain;
    metadata[BSGKeyReason] = error.localizedFailureReason;
    metadata[@"userInfo"] = BSGJSONDictionary(error.userInfo);
    [event addMetadata:metadata toSection:@"nserror"];

    if (event.context == nil) { // set context as error domain
         event.context = [NSString stringWithFormat:@"%@ (%ld)", error.domain, (long)error.code];
    }

    if (block) {
        return block(event);
    }
    return YES;
}

- (void)notify:(NSException *_Nonnull)exception {
    bsg_log_debug(@"Notify called with %@", exception);
    BugsnagHandledState *state =
            [BugsnagHandledState handledStateWithSeverityReason:HandledException];
    [self notify:exception handledState:state block:nil];
}

- (void)notify:(NSException *)exception
         block:(BugsnagOnErrorBlock)block
{
    bsg_log_debug(@"Notify called with %@", exception);
    BugsnagHandledState *state =
        [BugsnagHandledState handledStateWithSeverityReason:HandledException];
    [self notify:exception handledState:state block:block];
}

- (void)notify:(NSException *)exception
  handledState:(BugsnagHandledState *_Nonnull)handledState
         block:(BugsnagOnErrorBlock)block
{
    /**
     * Stack frames starting from this one are removed by setting the depth.
     * This helps remove bugsnag frames from showing in NSErrors as their
     * trace is synthesized.
     *
     * For example, for [Bugsnag notifyError:block:], bugsnag adds the following
     * frames which must be removed:
     *
     * 1. +[Bugsnag notifyError:block:]
     * 2. -[BugsnagClient notifyError:block:]
     * 3. -[BugsnagClient notify:handledState:block:]
     */
    NSUInteger depth = 3;

    NSArray<NSNumber *> *callStack = exception.callStackReturnAddresses;
    if (!callStack.count) {
        // If the NSException was not raised by the Objective-C runtime, it will be missing a call stack.
        // Use the current call stack instead.
        callStack = BSGArraySubarrayFromIndex(NSThread.callStackReturnAddresses, depth);
    }
    BOOL recordAllThreads = self.configuration.sendThreads == BSGThreadSendPolicyAlways;
    NSArray *threads = recordAllThreads ? [BugsnagThread allThreads:YES callStackReturnAddresses:callStack] : @[];
    
    NSArray<BugsnagStackframe *> *stacktrace = [BugsnagStackframe stackframesWithCallStackReturnAddresses:callStack];
    
    BugsnagError *error = [[BugsnagError alloc] initWithErrorClass:exception.name ?: NSStringFromClass([exception class])
                                                      errorMessage:exception.reason ?: @""
                                                         errorType:BSGErrorTypeCocoa
                                                        stacktrace:stacktrace];

    BugsnagMetadata *metadata = [self.metadata deepCopy];

    NSDictionary *systemInfo = [BSG_KSSystemInfo systemInfo];
    BugsnagEvent *event = [[BugsnagEvent alloc] initWithApp:[self generateAppWithState:systemInfo]
                                                     device:[self generateDeviceWithState:systemInfo]
                                               handledState:handledState
                                                       user:self.user
                                                   metadata:metadata
                                                breadcrumbs:self.breadcrumbs.breadcrumbs ?: @[]
                                                     errors:@[error]
                                                    threads:threads
                                                    session:nil /* the session's event counts have not yet been incremented! */];
    event.apiKey = self.configuration.apiKey;
    event.context = self.context;
    event.originalError = exception;

    [self notifyInternal:event block:block];
}

/**
 *  Notify Bugsnag of an exception. Used for user-reported (handled) errors, React Native, and Unity.
 *
 *  @param event    the event
 *  @param block     Configuration block for adding additional report information
 */
- (void)notifyInternal:(BugsnagEvent *_Nonnull)event
                 block:(BugsnagOnErrorBlock)block
{
    NSString *errorClass = event.errors.firstObject.errorClass;
    if ([self.configuration shouldDiscardErrorClass:errorClass]) {
        bsg_log_info(@"Discarding event because errorClass \"%@\" matched configuration.discardClasses", errorClass);
        return;
    }
    
    // Device information that isn't part of `event.device`
    NSMutableDictionary *deviceMetadata = [NSMutableDictionary dictionary];
#if TARGET_OS_IOS
    if (bsg_runContext->batteryState != UIDeviceBatteryStateUnknown) {
        deviceMetadata[BSGKeyBatteryLevel] = @(bsg_runContext->batteryLevel);
        // Our intepretation of "charging" really means "plugged in" 
        deviceMetadata[BSGKeyCharging] = bsg_runContext->batteryState >= UIDeviceBatteryStateCharging ? @YES : @NO;
    }
#endif
    if (@available(iOS 11.0, tvOS 11.0, *)) {
        deviceMetadata[BSGKeyThermalState] = BSGStringFromThermalState(bsg_runContext->thermalState);
    }
    [event.metadata addMetadata:deviceMetadata toSection:BSGKeyDevice];

    // App hang events will already contain feature flags
    if (!event.featureFlagStore.count) {
        @synchronized (self.featureFlagStore) {
            event.featureFlagStore = [self.featureFlagStore mutableCopy];
        }
    }

    BOOL originalUnhandledValue = event.unhandled;
    @try {
        if (block != nil && !block(event)) { // skip notifying if callback false
            return;
        }
    } @catch (NSException *exception) {
        bsg_log_err(@"Error from onError callback: %@", exception);
    }
    if (event.unhandled != originalUnhandledValue) {
        [event notifyUnhandledOverridden];
    }

    [self.sessionTracker incrementEventCountUnhandled:event.handledState.unhandled];
    event.session = self.sessionTracker.runningSession;

    if (event.unhandled) {
        // Unhandled Javscript exceptions from React Native result in the app being terminated shortly after the
        // call to notifyInternal, so the event needs to be persisted to disk for sending in the next session.
        // The fatal "RCTFatalException" / "Unhandled JS Exception" is explicitly ignored by
        // BugsnagReactNativePlugin's OnSendErrorBlock.
        [self.eventUploader storeEvent:event];
        // Replicate previous delivery mechanism's behaviour of waiting 1 second before delivering the event.
        // This should prevent potential duplicate uploads of unhandled errors where the app subsequently terminates.
        [self.eventUploader uploadStoredEventsAfterDelay:1];
    } else {
        [self.eventUploader uploadEvent:event completionHandler:nil];
    }

    [self addAutoBreadcrumbForEvent:event];
}

// MARK: - Breadcrumbs

- (void)addAutoBreadcrumbForEvent:(BugsnagEvent *)event {
    // A basic set of event metadata
    NSMutableDictionary *metadata = [NSMutableDictionary dictionary];
    metadata[BSGKeyErrorClass] = event.errors[0].errorClass;
    metadata[BSGKeyUnhandled] = @(event.handledState.unhandled);
    metadata[BSGKeySeverity] = BSGFormatSeverity(event.severity);

    // Only include the eventMessage if it contains something
    NSString *eventMessage = event.errors[0].errorMessage;
    if (eventMessage.length) {
        [metadata setValue:eventMessage forKey:BSGKeyName];
    }

    [self addAutoBreadcrumbOfType:BSGBreadcrumbTypeError
                      withMessage:event.errors[0].errorClass ?: @""
                      andMetadata:metadata];
}

- (void)addBreadcrumbWithBlock:(void (^)(BugsnagBreadcrumb *))block {
    [self.breadcrumbs addBreadcrumbWithBlock:block];
    BSGRunContextUpdateTimestamp();
}

/**
 * A convenience safe-wrapper for conditionally recording automatic breadcrumbs
 * based on the configuration.
 *
 * @param breadcrumbType The type of breadcrumb
 * @param message The breadcrumb message
 * @param metadata The breadcrumb metadata.  If nil this is substituted by an empty dictionary.
 */
- (void)addAutoBreadcrumbOfType:(BSGBreadcrumbType)breadcrumbType
                    withMessage:(NSString * _Nonnull)message
                    andMetadata:(NSDictionary *)metadata
{
    if ([[self configuration] shouldRecordBreadcrumbType:breadcrumbType]) {
        [self addBreadcrumbWithBlock:^(BugsnagBreadcrumb *_Nonnull breadcrumb) {
            breadcrumb.metadata = metadata ?: @{};
            breadcrumb.type = breadcrumbType;
            breadcrumb.message = message;
        }];
    }
}

- (void)dealloc {
    [[NSNotificationCenter defaultCenter] removeObserver:self];
}

// MARK: - <BugsnagFeatureFlagStore>

- (void)addFeatureFlagWithName:(NSString *)name variant:(nullable NSString *)variant {
    @synchronized (self.featureFlagStore) {
        BSGFeatureFlagStoreAddFeatureFlag(self.featureFlagStore, name, variant);
        [self.state addMetadata:BSGFeatureFlagStoreToJSON(self.featureFlagStore) withKey:BSGKeyFeatureFlags toSection:BSGKeyClient];
    }
    if (self.observer) {
        self.observer(BSGClientObserverAddFeatureFlag, [BugsnagFeatureFlag flagWithName:name variant:variant]);
    }
}

- (void)addFeatureFlagWithName:(NSString *)name {
    @synchronized (self.featureFlagStore) {
        BSGFeatureFlagStoreAddFeatureFlag(self.featureFlagStore, name, nil);
        [self.state addMetadata:BSGFeatureFlagStoreToJSON(self.featureFlagStore) withKey:BSGKeyFeatureFlags toSection:BSGKeyClient];
    }
    if (self.observer) {
        self.observer(BSGClientObserverAddFeatureFlag, [BugsnagFeatureFlag flagWithName:name]);
    }
}

- (void)addFeatureFlags:(NSArray<BugsnagFeatureFlag *> *)featureFlags {
    @synchronized (self.featureFlagStore) {
        BSGFeatureFlagStoreAddFeatureFlags(self.featureFlagStore, featureFlags);
        [self.state addMetadata:BSGFeatureFlagStoreToJSON(self.featureFlagStore) withKey:BSGKeyFeatureFlags toSection:BSGKeyClient];
    }
    if (self.observer) {
        for (BugsnagFeatureFlag *featureFlag in featureFlags) {
            self.observer(BSGClientObserverAddFeatureFlag, featureFlag);
        }
    }
}

- (void)clearFeatureFlagWithName:(NSString *)name {
    @synchronized (self.featureFlagStore) {
        BSGFeatureFlagStoreClear(self.featureFlagStore, name);
        [self.state addMetadata:BSGFeatureFlagStoreToJSON(self.featureFlagStore) withKey:BSGKeyFeatureFlags toSection:BSGKeyClient];
    }
    if (self.observer) {
        self.observer(BSGClientObserverClearFeatureFlag, name);
    }
}

- (void)clearFeatureFlags {
    @synchronized (self.featureFlagStore) {
        BSGFeatureFlagStoreClear(self.featureFlagStore, nil);
        [self.state addMetadata:BSGFeatureFlagStoreToJSON(self.featureFlagStore) withKey:BSGKeyFeatureFlags toSection:BSGKeyClient];
    }
    if (self.observer) {
        self.observer(BSGClientObserverClearFeatureFlag, nil);
    }
}

// MARK: - <BugsnagMetadataStore>

- (void)addMetadata:(NSDictionary *_Nonnull)metadata
          toSection:(NSString *_Nonnull)sectionName
{
    [self.metadata addMetadata:metadata toSection:sectionName];
}

- (void)addMetadata:(id _Nullable)metadata
            withKey:(NSString *_Nonnull)key
          toSection:(NSString *_Nonnull)sectionName
{
    [self.metadata addMetadata:metadata withKey:key toSection:sectionName];
}

- (id _Nullable)getMetadataFromSection:(NSString *_Nonnull)sectionName
                               withKey:(NSString *_Nonnull)key
{
    return [self.metadata getMetadataFromSection:sectionName withKey:key];
}

- (NSMutableDictionary *_Nullable)getMetadataFromSection:(NSString *_Nonnull)sectionName
{
    return [self.metadata getMetadataFromSection:sectionName];
}

- (void)clearMetadataFromSection:(NSString *_Nonnull)sectionName
{
    [self.metadata clearMetadataFromSection:sectionName];
}

- (void)clearMetadataFromSection:(NSString *_Nonnull)sectionName
                       withKey:(NSString *_Nonnull)key
{
    [self.metadata clearMetadataFromSection:sectionName withKey:key];
}

// MARK: - event data population

- (BugsnagAppWithState *)generateAppWithState:(NSDictionary *)systemInfo {
    BugsnagAppWithState *app = [BugsnagAppWithState appWithDictionary:@{BSGKeySystem: systemInfo}
                                                               config:self.configuration codeBundleId:self.codeBundleId];
    app.isLaunching = bsg_runContext->isLaunching;
    return app;
}

- (BugsnagDeviceWithState *)generateDeviceWithState:(NSDictionary *)systemInfo {
    BugsnagDeviceWithState *device = [BugsnagDeviceWithState deviceWithKSCrashReport:@{BSGKeySystem: systemInfo}];
    device.time = [NSDate date]; // default to current time for handled errors
    [device appendRuntimeInfo:self.extraRuntimeInfo];
#if TARGET_OS_IOS
    device.orientation = BSGStringFromDeviceOrientation(bsg_runContext->lastKnownOrientation);
#endif
    return device;
}

// MARK: - methods used by React Native

- (NSDictionary *)collectAppWithState {
    return [[self generateAppWithState:[BSG_KSSystemInfo systemInfo]] toDict];
}

- (NSDictionary *)collectDeviceWithState {
    NSDictionary *systemInfo = [BSG_KSSystemInfo systemInfo];
    BugsnagDeviceWithState *device = [self generateDeviceWithState:systemInfo];
    return [device toDictionary];
}

- (NSArray *)collectBreadcrumbs {
    NSMutableArray *data = [NSMutableArray new];

    for (BugsnagBreadcrumb *crumb in self.breadcrumbs.breadcrumbs) {
        NSMutableDictionary *crumbData = [[crumb objectValue] mutableCopy];
        if (!crumbData) {
            continue;
        }
        // JSON is serialized as 'name', we want as 'message' when passing to RN
        crumbData[@"message"] = crumbData[@"name"];
        crumbData[@"name"] = nil;
        crumbData[@"metadata"] = crumbData[@"metaData"];
        crumbData[@"metaData"] = nil;
        [data addObject: crumbData];
    }
    return data;
}

- (NSArray *)collectThreads:(BOOL)unhandled {
    // discard the following
    // 1. [BugsnagReactNative getPayloadInfo:resolve:reject:]
    // 2. [BugsnagClient collectThreads:]
    NSUInteger depth = 2;
    NSArray<NSNumber *> *callStack = BSGArraySubarrayFromIndex(NSThread.callStackReturnAddresses, depth);
    BSGThreadSendPolicy sendThreads = self.configuration.sendThreads;
    BOOL recordAllThreads = sendThreads == BSGThreadSendPolicyAlways
            || (unhandled && sendThreads == BSGThreadSendPolicyUnhandledOnly);
    NSArray<BugsnagThread *> *threads = [BugsnagThread allThreads:recordAllThreads callStackReturnAddresses:callStack];
    return [BugsnagThread serializeThreads:threads];
}

- (void)addRuntimeVersionInfo:(NSString *)info
                      withKey:(NSString *)key {
    [self.sessionTracker addRuntimeVersionInfo:info
                                       withKey:key];
    if (info != nil && key != nil) {
        self.extraRuntimeInfo[key] = info;
    }
    [self.state addMetadata:self.extraRuntimeInfo withKey:BSGKeyExtraRuntimeInfo toSection:BSGKeyDevice];
}

- (void)setObserver:(BSGClientObserver)observer {
    _observer = observer;
    if (observer) {
        observer(BSGClientObserverUpdateContext, self.context);
        observer(BSGClientObserverUpdateUser, self.user);
        
        observer(BSGClientObserverUpdateMetadata, self.metadata);
        self.metadata.observer = ^(BugsnagMetadata *metadata) {
            observer(BSGClientObserverUpdateMetadata, metadata);
        };
        
        @synchronized (self.featureFlagStore) {
            for (NSString *name in self.featureFlagStore) {
                observer(BSGClientObserverAddFeatureFlag, [BugsnagFeatureFlag flagWithName:name variant:self.featureFlagStore[name]]);
            }
        }
    } else {
        self.metadata.observer = nil;
    }
}

// MARK: - App Hangs

- (void)startAppHangDetector {
    [NSFileManager.defaultManager removeItemAtPath:BSGFileLocations.current.appHangEvent error:nil];

    self.appHangDetector = [[BSGAppHangDetector alloc] init];
    [self.appHangDetector startWithDelegate:self];
}

- (void)appHangDetectedAtDate:(NSDate *)date withThreads:(NSArray<BugsnagThread *> *)threads systemInfo:(NSDictionary *)systemInfo {
    NSString *message = [NSString stringWithFormat:@"The app's main thread failed to respond to an event within %d milliseconds",
                         (int)self.configuration.appHangThresholdMillis];

    BugsnagError *error =
    [[BugsnagError alloc] initWithErrorClass:@"App Hang"
                                errorMessage:message
                                   errorType:BSGErrorTypeCocoa
                                  stacktrace:threads.firstObject.stacktrace];

    BugsnagHandledState *handledState =
    [[BugsnagHandledState alloc] initWithSeverityReason:AppHang
                                               severity:BSGSeverityWarning
                                              unhandled:NO
                                    unhandledOverridden:NO
                                              attrValue:nil];

    BugsnagAppWithState *app = [self generateAppWithState:systemInfo];

    BugsnagDeviceWithState *device = [self generateDeviceWithState:systemInfo];
    device.time = date;

    NSArray<BugsnagBreadcrumb *> *breadcrumbs = [self.breadcrumbs breadcrumbsBeforeDate:date];

    self.appHangEvent =
    [[BugsnagEvent alloc] initWithApp:app
                               device:device
                         handledState:handledState
                                 user:self.configuration.user
                             metadata:[self.metadata deepCopy]
                          breadcrumbs:breadcrumbs
                               errors:@[error]
                              threads:threads
                              session:self.sessionTracker.runningSession];

    self.appHangEvent.context = self.context;

    @synchronized (self.featureFlagStore) {
        self.appHangEvent.featureFlagStore = [self.featureFlagStore mutableCopy];
    }
    
    [self.appHangEvent symbolicateIfNeeded];
    
    NSError *writeError = nil;
    NSDictionary *json = [self.appHangEvent toJsonWithRedactedKeys:self.configuration.redactedKeys];
    if (!BSGJSONWriteToFileAtomically(json, BSGFileLocations.current.appHangEvent, &writeError)) {
        bsg_log_err(@"Could not write app_hang.json: %@", writeError);
    }
}

- (void)appHangEnded {
    NSError *error = nil;
    if (![NSFileManager.defaultManager removeItemAtPath:BSGFileLocations.current.appHangEvent error:&error]) {
        bsg_log_err(@"Could not delete app_hang.json: %@", error);
    }

    const BOOL fatalOnly = self.configuration.appHangThresholdMillis == BugsnagAppHangThresholdFatalOnly;
    if (!fatalOnly && self.appHangEvent) {
        [self notifyInternal:(BugsnagEvent * _Nonnull)self.appHangEvent block:nil];
    }
    self.appHangEvent = nil;
}

- (nullable BugsnagEvent *)loadAppHangEvent {
    NSError *error = nil;
    NSDictionary *json = BSGJSONDictionaryFromFile(BSGFileLocations.current.appHangEvent, 0, &error);
    if (!json) {
        if (!(error.domain == NSCocoaErrorDomain && error.code == NSFileReadNoSuchFileError)) {
            bsg_log_err(@"Could not read app_hang.json: %@", error);
        }
        return nil;
    }

    BugsnagEvent *event = [[BugsnagEvent alloc] initWithJson:json];
    if (!event) {
        bsg_log_err(@"Could not parse app_hang.json");
        return nil;
    }

    // Receipt of the willTerminateNotification indicates that an app hang was not the cause of the termination, so treat as non-fatal.
    if (BSGRunContextWasTerminating()) {
        if (self.configuration.appHangThresholdMillis == BugsnagAppHangThresholdFatalOnly) {
            return nil;
        }
        event.session.handledCount++;
        return event;
    }

    // Update event to reflect that the app hang was fatal.
    event.errors.firstObject.errorMessage = @"The app was terminated while unresponsive";
    // Cannot set event.severity directly because that sets severityReason.type to "userCallbackSetSeverity"
    event.handledState = [[BugsnagHandledState alloc] initWithSeverityReason:AppHang
                                                                    severity:BSGSeverityError
                                                                   unhandled:YES
                                                         unhandledOverridden:NO
                                                                   attrValue:nil];
    event.session.unhandledCount++;

    return event;
}

// MARK: - Event generation

- (nullable BugsnagEvent *)generateOutOfMemoryEvent {
    return [self generateEventForLastLaunchWithError:
            [[BugsnagError alloc] initWithErrorClass:@"Out Of Memory"
                                        errorMessage:@"The app was likely terminated by the operating system while in the foreground"
                                           errorType:BSGErrorTypeCocoa
                                          stacktrace:nil]
                                        handledState:[BugsnagHandledState handledStateWithSeverityReason:LikelyOutOfMemory]];
}

- (nullable BugsnagEvent *)generateThermalKillEvent {
    return [self generateEventForLastLaunchWithError:
            [[BugsnagError alloc] initWithErrorClass:@"Thermal Kill"
                                        errorMessage:@"The app was terminated by the operating system due to a critical thermal state"
                                           errorType:BSGErrorTypeCocoa
                                          stacktrace:nil]
                                        handledState:[BugsnagHandledState handledStateWithSeverityReason:ThermalKill]];
}

- (nullable BugsnagEvent *)generateEventForLastLaunchWithError:(BugsnagError *)error handledState:(BugsnagHandledState *)handledState {
    if (!bsg_lastRunContext) {
        return nil;
    }
    
    NSDictionary *stateDict = BSGJSONDictionaryFromFile(BSGFileLocations.current.state, 0, nil);

    NSDictionary *appDict = self.systemState.lastLaunchState[SYSTEMSTATE_KEY_APP];
    BugsnagAppWithState *app = [BugsnagAppWithState appFromJson:appDict];
    app.dsymUuid = appDict[BSGKeyMachoUUID];
    app.inForeground = bsg_lastRunContext->isForeground;
    app.isLaunching = bsg_lastRunContext->isLaunching;

    NSDictionary *configDict = BSGJSONDictionaryFromFile(BSGFileLocations.current.configuration, 0, nil);
    if (configDict) {
        [app setValuesFromConfiguration:[[BugsnagConfiguration alloc] initWithDictionaryRepresentation:configDict]];
    }

    NSDictionary *deviceDict = self.systemState.lastLaunchState[SYSTEMSTATE_KEY_DEVICE];
    BugsnagDeviceWithState *device = [BugsnagDeviceWithState deviceFromJson:deviceDict];
    device.manufacturer = @"Apple";
#if TARGET_OS_IOS
    device.orientation = BSGStringFromDeviceOrientation(bsg_lastRunContext->lastKnownOrientation);
#endif
    if (bsg_lastRunContext->timestamp > 0) {
        device.time = [NSDate dateWithTimeIntervalSinceReferenceDate:bsg_lastRunContext->timestamp];
    }
    if (bsg_lastRunContext->availableMemory) {
        device.freeMemory = @(bsg_lastRunContext->availableMemory);
    }

    NSDictionary *metadataDict = BSGJSONDictionaryFromFile(BSGFileLocations.current.metadata, 0, nil);
    BugsnagMetadata *metadata = [[BugsnagMetadata alloc] initWithDictionary:metadataDict ?: @{}];
    
    // Device information that isn't part of `event.device`
    NSMutableDictionary *deviceMetadata = [NSMutableDictionary dictionary];
#if TARGET_OS_IOS
    if (bsg_lastRunContext->batteryState != UIDeviceBatteryStateUnknown) {
        deviceMetadata[BSGKeyBatteryLevel] = @(bsg_lastRunContext->batteryLevel);
        // Our intepretation of "charging" really means "plugged in" 
        deviceMetadata[BSGKeyCharging] = bsg_lastRunContext->batteryState >= UIDeviceBatteryStateCharging ? @YES : @NO;
    }
    // Don't set to @NO because server may interpret any non-nil value as meaning true
    deviceMetadata[BSGKeyLowMemoryWarning] = BSGRunContextWasMemoryWarning() ? @YES : nil;
#endif
    if (@available(iOS 11.0, tvOS 11.0, *)) {
        deviceMetadata[BSGKeyThermalState] = BSGStringFromThermalState(bsg_lastRunContext->thermalState);
    }
    [metadata addMetadata:deviceMetadata toSection:BSGKeyDevice];

    NSDictionary *userDict = stateDict[BSGKeyUser];
    BugsnagUser *user = [[BugsnagUser alloc] initWithDictionary:userDict];

    BugsnagSession *session = BSGSessionFromLastRunContext(app, device, user);
    session.unhandledCount += 1;

    BugsnagEvent *event =
    [[BugsnagEvent alloc] initWithApp:app
                               device:device
                         handledState:handledState
                                 user:user
                             metadata:metadata
                          breadcrumbs:[self.breadcrumbs cachedBreadcrumbs] ?: @[]
                               errors:@[error]
                              threads:@[]
                              session:session];

    event.context = stateDict[BSGKeyClient][BSGKeyContext];

    id featureFlags = stateDict[BSGKeyClient][BSGKeyFeatureFlags];
    event.featureFlagStore = BSGFeatureFlagStoreFromJSON(featureFlags);

    return event;
}

@end
