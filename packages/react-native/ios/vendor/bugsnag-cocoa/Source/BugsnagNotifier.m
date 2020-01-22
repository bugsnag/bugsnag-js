//
//  BugsnagNotifier.m
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

#import "BugsnagNotifier.h"
#import "BSGConnectivity.h"
#import "Bugsnag.h"
#import "Private.h"
#import "BugsnagCrashSentry.h"
#import "BugsnagHandledState.h"
#import "BugsnagLogger.h"
#import "BugsnagKeys.h"
#import "BugsnagSessionTracker.h"
#import "BSGOutOfMemoryWatchdog.h"
#import "BSG_RFC3339DateTool.h"
#import "BSG_KSCrashC.h"
#import "BSG_KSCrashType.h"
#import "BSG_KSCrashState.h"
#import "BSG_KSSystemInfo.h"
#import "BSG_KSMach.h"

#if TARGET_IPHONE_SIMULATOR || TARGET_OS_IPHONE
#import <UIKit/UIKit.h>
#elif TARGET_OS_MAC
#import <AppKit/AppKit.h>
#endif

NSString *const NOTIFIER_VERSION = @"5.23.0";
NSString *const NOTIFIER_URL = @"https://github.com/bugsnag/bugsnag-cocoa";
NSString *const BSTabCrash = @"crash";
NSString *const BSAttributeDepth = @"depth";
NSString *const BSEventLowMemoryWarning = @"lowMemoryWarning";

static NSInteger const BSGNotifierStackFrameCount = 5;

struct bugsnag_data_t {
    // Contains the state of the event (handled/unhandled)
    char *handledState;
    // Contains the user-specified metaData, including the user tab from config.
    char *metaDataJSON;
    // Contains the Bugsnag configuration, all under the "config" tab.
    char *configJSON;
    // Contains notifier state, under "deviceState" and crash-specific
    // information under "crash".
    char *stateJSON;
    // Contains properties in the Bugsnag payload overridden by the user before
    // it was sent
    char *userOverridesJSON;
    // User onCrash handler
    void (*onCrash)(const BSG_KSCrashReportWriter *writer);
};

static struct bugsnag_data_t bsg_g_bugsnag_data;

static NSDictionary *notificationNameMap;

static char *sessionId[128];
static char *sessionStartDate[128];
static char *watchdogSentinelPath = NULL;
static char *crashSentinelPath = NULL;
static NSUInteger handledCount;
static NSUInteger unhandledCount;
static bool hasRecordedSessions;

/**
 *  Handler executed when the application crashes. Writes information about the
 *  current application state using the crash report writer.
 *
 *  @param writer report writer which will receive updated metadata
 */
void BSSerializeDataCrashHandler(const BSG_KSCrashReportWriter *writer, int type) {
    BOOL isCrash = BSG_KSCrashTypeUserReported != type;
    if (hasRecordedSessions) { // a session is available
        // persist session info
        writer->addStringElement(writer, "id", (const char *) sessionId);
        writer->addStringElement(writer, "startedAt", (const char *) sessionStartDate);
        writer->addUIntegerElement(writer, "handledCount", handledCount);
        NSUInteger unhandledEvents = unhandledCount + (isCrash ? 1 : 0);
        writer->addUIntegerElement(writer, "unhandledCount", unhandledEvents);
    }
    if (isCrash) {
        if (bsg_g_bugsnag_data.configJSON) {
            writer->addJSONElement(writer, "config", bsg_g_bugsnag_data.configJSON);
        }
        if (bsg_g_bugsnag_data.stateJSON) {
            writer->addJSONElement(writer, "state", bsg_g_bugsnag_data.stateJSON);
        }
        if (bsg_g_bugsnag_data.metaDataJSON) {
            writer->addJSONElement(writer, "metaData", bsg_g_bugsnag_data.metaDataJSON);
        }
        if (watchdogSentinelPath != NULL) {
            // Delete the file to indicate a handled termination
            unlink(watchdogSentinelPath);
        }
        if (crashSentinelPath != NULL) {
            // Create a file to indicate that the crash has been handled by
            // the library. This exists in case the subsequent `onCrash` handler
            // crashes or otherwise corrupts the crash report file.
            int fd = open(crashSentinelPath, O_RDWR | O_CREAT, 0644);
            if (fd > -1) {
                close(fd);
            }
        }
    }

    if (bsg_g_bugsnag_data.onCrash) {
        bsg_g_bugsnag_data.onCrash(writer);
    }
}

NSString *BSGBreadcrumbNameForNotificationName(NSString *name) {
    NSString *readableName = notificationNameMap[name];

    if (readableName) {
        return readableName;
    } else {
        return [name stringByReplacingOccurrencesOfString:@"Notification"
                                               withString:@""];
    }
}

/**
 *  Writes a dictionary to a destination using the BSG_KSCrash JSON encoding
 *
 *  @param dictionary  data to encode
 *  @param destination target location of the data
 */
void BSSerializeJSONDictionary(NSDictionary *dictionary, char **destination) {
    if (![NSJSONSerialization isValidJSONObject:dictionary]) {
        bsg_log_err(@"could not serialize metadata: is not valid JSON object");
        return;
    }
    @try {
        NSError *error;
        NSData *json = [NSJSONSerialization dataWithJSONObject:dictionary
                                                       options:0
                                                         error:&error];

        if (!json) {
            bsg_log_err(@"could not serialize metaData: %@", error);
            return;
        }
        *destination = reallocf(*destination, [json length] + 1);
        if (*destination) {
            memcpy(*destination, [json bytes], [json length]);
            (*destination)[[json length]] = '\0';
        }
    } @catch (NSException *exception) {
        bsg_log_err(@"could not serialize metaData: %@", exception);
    }
}

/**
 Save info about the current session to crash data. Ensures that session
 data is written to unhandled error reports.

 @param session The current session
 */
void BSGWriteSessionCrashData(BugsnagSession *session) {
    if (session == nil) {
        hasRecordedSessions = false;
        return;
    }
    // copy session id
    const char *newSessionId = [session.sessionId UTF8String];
    size_t idSize = strlen(newSessionId);
    strncpy((char *)sessionId, newSessionId, idSize);
    sessionId[idSize - 1] = NULL;

    const char *newSessionDate = [[BSG_RFC3339DateTool stringFromDate:session.startedAt] UTF8String];
    size_t dateSize = strlen(newSessionDate);
    strncpy((char *)sessionStartDate, newSessionDate, dateSize);
    sessionStartDate[dateSize - 1] = NULL;

    // record info for C JSON serialiser
    handledCount = session.handledCount;
    unhandledCount = session.unhandledCount;
    hasRecordedSessions = true;
}

@interface BugsnagNotifier ()
@property(nonatomic, strong) BugsnagCrashSentry *crashSentry;
@property(nonatomic, strong) BugsnagErrorReportApiClient *errorReportApiClient;
@property(nonatomic, strong, readwrite) BugsnagSessionTracker *sessionTracker;
@property (nonatomic, strong) BSGOutOfMemoryWatchdog *oomWatchdog;
@property (nonatomic) BOOL appCrashedLastLaunch;
@end

@implementation BugsnagNotifier

@synthesize configuration;

- (id)initWithConfiguration:(BugsnagConfiguration *)initConfiguration {
    static NSString *const BSGWatchdogSentinelFileName = @"bugsnag_oom_watchdog.json";
    static NSString *const BSGCrashSentinelFileName = @"bugsnag_handled_crash.txt";
    if ((self = [super init])) {
        self.configuration = initConfiguration;
        self.state = [[BugsnagMetaData alloc] init];
        NSString *notifierName =
#if TARGET_OS_TV
            @"tvOS Bugsnag Notifier";
#elif TARGET_IPHONE_SIMULATOR || TARGET_OS_IPHONE
            @"iOS Bugsnag Notifier";
#elif TARGET_OS_MAC
            @"OSX Bugsnag Notifier";
#else
            @"Bugsnag Objective-C";
#endif
        self.details = [@{
            BSGKeyName : notifierName,
            BSGKeyVersion : NOTIFIER_VERSION,
            BSGKeyUrl : NOTIFIER_URL
        } mutableCopy];


        NSString *cacheDir = [NSSearchPathForDirectoriesInDomains(
                                NSCachesDirectory, NSUserDomainMask, YES) firstObject];
        if (cacheDir) {
            NSString *sentinelPath = [cacheDir stringByAppendingPathComponent:BSGWatchdogSentinelFileName];
            NSString *crashPath = [cacheDir stringByAppendingPathComponent:BSGCrashSentinelFileName];
            watchdogSentinelPath = strdup([sentinelPath UTF8String]);
            crashSentinelPath = strdup([crashPath UTF8String]);
            self.oomWatchdog = [[BSGOutOfMemoryWatchdog alloc] initWithSentinelPath:sentinelPath
                                                                      configuration:configuration];
        }

        self.metaDataLock = [[NSLock alloc] init];
        self.configuration.metaData.delegate = self;
        self.configuration.config.delegate = self;
        self.state.delegate = self;
        self.crashSentry = [BugsnagCrashSentry new];
        self.errorReportApiClient = [[BugsnagErrorReportApiClient alloc] initWithConfig:configuration
                                                                              queueName:@"Error API queue"];
        bsg_g_bugsnag_data.onCrash = (void (*)(const BSG_KSCrashReportWriter *))self.configuration.onCrashHandler;

        static dispatch_once_t once_t;
        dispatch_once(&once_t, ^{
            [self initializeNotificationNameMap];
        });

        self.sessionTracker = [[BugsnagSessionTracker alloc] initWithConfig:initConfiguration
                                                         postRecordCallback:^(BugsnagSession *session) {
                                                             BSGWriteSessionCrashData(session);
                                                         }];

        [self metaDataChanged:self.configuration.metaData];
        [self metaDataChanged:self.configuration.config];
        [self metaDataChanged:self.state];
    }
    return self;
}

NSString *const kWindowVisible = @"Window Became Visible";
NSString *const kWindowHidden = @"Window Became Hidden";
NSString *const kBeganTextEdit = @"Began Editing Text";
NSString *const kStoppedTextEdit = @"Stopped Editing Text";
NSString *const kUndoOperation = @"Undo Operation";
NSString *const kRedoOperation = @"Redo Operation";
NSString *const kTableViewSelectionChange = @"TableView Select Change";
NSString *const kAppWillTerminate = @"App Will Terminate";

- (void)initializeNotificationNameMap {
    notificationNameMap = @{
#if TARGET_OS_TV
        NSUndoManagerDidUndoChangeNotification : kUndoOperation,
        NSUndoManagerDidRedoChangeNotification : kRedoOperation,
        UIWindowDidBecomeVisibleNotification : kWindowVisible,
        UIWindowDidBecomeHiddenNotification : kWindowHidden,
        UIWindowDidBecomeKeyNotification : @"Window Became Key",
        UIWindowDidResignKeyNotification : @"Window Resigned Key",
        UIScreenBrightnessDidChangeNotification : @"Screen Brightness Changed",
        UITableViewSelectionDidChangeNotification : kTableViewSelectionChange,

#elif TARGET_IPHONE_SIMULATOR || TARGET_OS_IPHONE
        UIWindowDidBecomeVisibleNotification : kWindowVisible,
        UIWindowDidBecomeHiddenNotification : kWindowHidden,
        UIApplicationWillTerminateNotification : kAppWillTerminate,
        UIApplicationWillEnterForegroundNotification :
            @"App Will Enter Foreground",
        UIApplicationDidEnterBackgroundNotification :
            @"App Did Enter Background",
        UIKeyboardDidShowNotification : @"Keyboard Became Visible",
        UIKeyboardDidHideNotification : @"Keyboard Became Hidden",
        UIMenuControllerDidShowMenuNotification : @"Did Show Menu",
        UIMenuControllerDidHideMenuNotification : @"Did Hide Menu",
        NSUndoManagerDidUndoChangeNotification : kUndoOperation,
        NSUndoManagerDidRedoChangeNotification : kRedoOperation,
        UIApplicationUserDidTakeScreenshotNotification : @"Took Screenshot",
        UITextFieldTextDidBeginEditingNotification : kBeganTextEdit,
        UITextViewTextDidBeginEditingNotification : kBeganTextEdit,
        UITextFieldTextDidEndEditingNotification : kStoppedTextEdit,
        UITextViewTextDidEndEditingNotification : kStoppedTextEdit,
        UITableViewSelectionDidChangeNotification : kTableViewSelectionChange,
        UIDeviceBatteryStateDidChangeNotification : @"Battery State Changed",
        UIDeviceBatteryLevelDidChangeNotification : @"Battery Level Changed",
        UIDeviceOrientationDidChangeNotification : @"Orientation Changed",
        UIApplicationDidReceiveMemoryWarningNotification : @"Memory Warning",

#elif TARGET_OS_MAC
        NSApplicationDidBecomeActiveNotification : @"App Became Active",
        NSApplicationDidResignActiveNotification : @"App Resigned Active",
        NSApplicationDidHideNotification : @"App Did Hide",
        NSApplicationDidUnhideNotification : @"App Did Unhide",
        NSApplicationWillTerminateNotification : kAppWillTerminate,
        NSWorkspaceScreensDidSleepNotification : @"Workspace Screen Slept",
        NSWorkspaceScreensDidWakeNotification : @"Workspace Screen Awoke",
        NSWindowWillCloseNotification : @"Window Will Close",
        NSWindowDidBecomeKeyNotification : @"Window Became Key",
        NSWindowWillMiniaturizeNotification : @"Window Will Miniaturize",
        NSWindowDidEnterFullScreenNotification : @"Window Entered Full Screen",
        NSWindowDidExitFullScreenNotification : @"Window Exited Full Screen",
        NSControlTextDidBeginEditingNotification : @"Control Text Began Edit",
        NSControlTextDidEndEditingNotification : @"Control Text Ended Edit",
        NSMenuWillSendActionNotification : @"Menu Will Send Action",
        NSTableViewSelectionDidChangeNotification : kTableViewSelectionChange,
#endif
    };
}

- (void)start {
    [self.crashSentry install:self.configuration
                    apiClient:self.errorReportApiClient
                      onCrash:&BSSerializeDataCrashHandler];
    [self computeDidCrashLastLaunch];
    [self setupConnectivityListener];
    [self updateAutomaticBreadcrumbDetectionSettings];

    NSNotificationCenter *center = [NSNotificationCenter defaultCenter];
    [self watchLifecycleEvents:center];

#if TARGET_OS_TV
    [self addTerminationObserver:UIApplicationWillTerminateNotification];

#elif TARGET_IPHONE_SIMULATOR || TARGET_OS_IPHONE
    [center addObserver:self
               selector:@selector(batteryChanged:)
                   name:UIDeviceBatteryStateDidChangeNotification
                 object:nil];

    [center addObserver:self
               selector:@selector(batteryChanged:)
                   name:UIDeviceBatteryLevelDidChangeNotification
                 object:nil];

    [center addObserver:self
               selector:@selector(orientationChanged:)
                   name:UIDeviceOrientationDidChangeNotification
                 object:nil];

    [center addObserver:self
               selector:@selector(lowMemoryWarning:)
                   name:UIApplicationDidReceiveMemoryWarningNotification
                 object:nil];

    [UIDevice currentDevice].batteryMonitoringEnabled = YES;
    [[UIDevice currentDevice] beginGeneratingDeviceOrientationNotifications];

    [self batteryChanged:nil];
    [self orientationChanged:nil];
    [self addTerminationObserver:UIApplicationWillTerminateNotification];

#elif TARGET_OS_MAC
    [center addObserver:self
               selector:@selector(willEnterForeground:)
                   name:NSApplicationDidBecomeActiveNotification
                 object:nil];

    [center addObserver:self
               selector:@selector(willEnterBackground:)
                   name:NSApplicationDidResignActiveNotification
                 object:nil];

    [self addTerminationObserver:NSApplicationWillTerminateNotification];
#endif

    _started = YES;
    // autoDetectErrors disables all unhandled event reporting
    BOOL configuredToReportOOMs = self.configuration.reportOOMs && self.configuration.autoDetectErrors;
    // Disable if a debugger is enabled, since the development cycle of starting
    // and restarting an app is also an uncatchable kill
    BOOL noDebuggerEnabled = !bsg_ksmachisBeingTraced();
    // Disable if in an app extension, since app extensions have a different
    // app lifecycle and the heuristic used for finding app terminations rooted
    // in fixable code does not apply
    BOOL notInAppExtension = ![BSG_KSSystemInfo isRunningInAppExtension];
    if (configuredToReportOOMs && noDebuggerEnabled && notInAppExtension) {
        [self.oomWatchdog enable];
    }

    [self.sessionTracker startNewSessionIfAutoCaptureEnabled];

    // notification not received in time on initial startup, so trigger manually
    [self willEnterForeground:self];
}

- (void)addTerminationObserver:(NSString *)name {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(unsubscribeFromNotifications:)
                                                 name:name
                                               object:nil];
}

- (void)computeDidCrashLastLaunch {
    const BSG_KSCrash_State *crashState = bsg_kscrashstate_currentState();
#if TARGET_OS_TV || TARGET_OS_IPHONE
    NSFileManager *manager = [NSFileManager defaultManager];
    NSString *didCrashSentinelPath = [NSString stringWithUTF8String:crashSentinelPath];
    BOOL appCrashSentinelExists = [manager fileExistsAtPath:didCrashSentinelPath];
    BOOL handledCrashLastLaunch = appCrashSentinelExists || crashState->crashedLastLaunch;
    if (appCrashSentinelExists) {
        NSError *error = nil;
        [manager removeItemAtPath:didCrashSentinelPath error:&error];
        if (error) {
            bsg_log_err(@"Failed to remove crash sentinel file: %@", error);
            unlink(crashSentinelPath);
        }
    }
    self.appCrashedLastLaunch = handledCrashLastLaunch || [self.oomWatchdog didOOMLastLaunch];
    // Ignore potential false positive OOM if previous session crashed and was
    // reported. There are two checks in place:
    // 1. crashState->crashedLastLaunch: Accurate unless the crash callback crashes
    // 2. crash sentinel file exists: This file is written in the event of a crash
    //    and insures against the crash callback crashing
    if (!handledCrashLastLaunch && [self.oomWatchdog didOOMLastLaunch]) {
        [self notifyOutOfMemoryEvent];
    }
#else
    self.appCrashedLastLaunch = crashState->crashedLastLaunch;
#endif
}

/**
 * Removes observers and listeners to prevent allocations when the app is terminated
 */
- (void)unsubscribeFromNotifications:(id)sender {
    [[NSNotificationCenter defaultCenter] removeObserver:self];
    [self.networkReachable stopWatchingConnectivity];

#if TARGET_OS_TV || TARGET_OS_MAC
#elif TARGET_IPHONE_SIMULATOR || TARGET_OS_IPHONE
    [UIDevice currentDevice].batteryMonitoringEnabled = NO;
    [[UIDevice currentDevice] endGeneratingDeviceOrientationNotifications];
#endif
}

- (void)watchLifecycleEvents:(NSNotificationCenter *)center {
    NSString *foregroundName;
    NSString *backgroundName;

    #if TARGET_OS_TV || TARGET_IPHONE_SIMULATOR || TARGET_OS_IPHONE
    foregroundName = UIApplicationWillEnterForegroundNotification;
    backgroundName = UIApplicationWillEnterForegroundNotification;
    #elif TARGET_OS_MAC
    foregroundName = NSApplicationWillBecomeActiveNotification;
    backgroundName = NSApplicationDidFinishLaunchingNotification;
    #endif

    [center addObserver:self
               selector:@selector(willEnterForeground:)
                   name:foregroundName
                 object:nil];

    [center addObserver:self
               selector:@selector(willEnterBackground:)
                   name:backgroundName
                 object:nil];
}

- (void)willEnterForeground:(id)sender {
    [self.sessionTracker handleAppForegroundEvent];
}

- (void)willEnterBackground:(id)sender {
    [self.sessionTracker handleAppBackgroundEvent];
}

- (void)startSession {
    [self.sessionTracker startNewSession];
}

- (void)stopSession {
    [self.sessionTracker stopSession];
}

- (BOOL)resumeSession {
    return [self.sessionTracker resumeSession];
}

- (void)flushPendingReports {
    [self.errorReportApiClient flushPendingData];
}

- (void)setupConnectivityListener {
    NSURL *url = self.configuration.notifyURL;

    __weak id weakSelf = self;
    self.networkReachable =
        [[BSGConnectivity alloc] initWithURL:url
                                 changeBlock:^(BSGConnectivity *connectivity) {
                                   [weakSelf flushPendingReports];
                                 }];
    [self.networkReachable startWatchingConnectivity];
}


- (void)notifyError:(NSError *)error
              block:(void (^)(BugsnagCrashReport *))block {
    BugsnagHandledState *state =
        [BugsnagHandledState handledStateWithSeverityReason:HandledError
                                                   severity:BSGSeverityWarning
                                                  attrValue:error.domain];
    NSException *wrapper = [NSException exceptionWithName:NSStringFromClass([error class])
                                                   reason:error.localizedDescription
                                                 userInfo:error.userInfo];
    [self notify:wrapper
        handledState:state
               block:^(BugsnagCrashReport *_Nonnull report) {
                 NSMutableDictionary *metadata = [report.metaData mutableCopy];
                 metadata[@"nserror"] = @{
                     @"code" : @(error.code),
                     @"domain" : error.domain,
                     BSGKeyReason : error.localizedFailureReason ?: @""
                 };
                   if (report.context == nil) { // set context as error domain
                       report.context = [NSString stringWithFormat:@"%@ (%ld)", error.domain, (long)error.code];
                   }
                 report.metaData = metadata;

                 if (block) {
                     block(report);
                 }
               }];
}

- (void)notifyException:(NSException *)exception
             atSeverity:(BSGSeverity)severity
                  block:(void (^)(BugsnagCrashReport *))block {

    BugsnagHandledState *state = [BugsnagHandledState
        handledStateWithSeverityReason:UserSpecifiedSeverity
                              severity:severity
                             attrValue:nil];
    [self notify:exception handledState:state block:block];
}

- (void)notifyException:(NSException *)exception
                  block:(void (^)(BugsnagCrashReport *))block {
    BugsnagHandledState *state =
        [BugsnagHandledState handledStateWithSeverityReason:HandledException];
    [self notify:exception handledState:state block:block];
}

- (void)internalClientNotify:(NSException *_Nonnull)exception
                    withData:(NSDictionary *_Nullable)metaData
                       block:(BugsnagNotifyBlock _Nullable)block {

    BSGSeverity severity = BSGParseSeverity(metaData[BSGKeySeverity]);
    NSString *severityReason = metaData[BSGKeySeverityReason];
    BOOL unhandled = [metaData[BSGKeyUnhandled] boolValue];
    NSString *logLevel = metaData[BSGKeyLogLevel];
    NSParameterAssert(severityReason.length > 0);

    SeverityReasonType severityReasonType =
        [BugsnagHandledState severityReasonFromString:severityReason];

    BugsnagHandledState *state = [[BugsnagHandledState alloc] initWithSeverityReason:severityReasonType
                                                                            severity:severity
                                                                           unhandled:unhandled
                                                                           attrValue:logLevel];

    [self notify:exception handledState:state block:block];
}

- (void)notifyOutOfMemoryEvent {
    static NSString *const BSGOutOfMemoryErrorClass = @"Out Of Memory";
    static NSString *const BSGOutOfMemoryMessageFormat = @"The app was likely terminated by the operating system while in the %@";
    NSMutableDictionary *lastLaunchInfo = [[self.oomWatchdog lastBootCachedFileInfo] mutableCopy];
    NSArray *crumbs = [self.configuration.breadcrumbs cachedBreadcrumbs];
    if (crumbs.count > 0) {
        lastLaunchInfo[@"breadcrumbs"] = crumbs;
    }
    for (NSDictionary *crumb in crumbs) {
        if ([crumb isKindOfClass:[NSDictionary class]]
            && [crumb[@"name"] isKindOfClass:[NSString class]]) {
            NSString *name = crumb[@"name"];
            // If the termination breadcrumb is set, the app entered a normal
            // termination flow but expired before the watchdog sentinel could
            // be updated. In this case, no report should be sent.
            if ([name isEqualToString:kAppWillTerminate]) {
                return;
            }
        }
    }

    BOOL wasInForeground = [[lastLaunchInfo valueForKeyPath:@"app.inForeground"] boolValue];
    NSString *message = [NSString stringWithFormat:BSGOutOfMemoryMessageFormat, wasInForeground ? @"foreground" : @"background"];
    BugsnagHandledState *handledState = [BugsnagHandledState
                                         handledStateWithSeverityReason:LikelyOutOfMemory
                                         severity:BSGSeverityError
                                         attrValue:nil];
    NSDictionary *appState = @{@"oom": lastLaunchInfo, @"didOOM": @YES};
    [self.crashSentry reportUserException:BSGOutOfMemoryErrorClass
                                   reason:message
                        originalException:nil
                             handledState:[handledState toJson]
                                 appState:appState
                        callbackOverrides:@{}
                                 metadata:@{}
                                   config:@{}
                             discardDepth:0];
}

- (void)notify:(NSException *)exception
    handledState:(BugsnagHandledState *_Nonnull)handledState
           block:(void (^)(BugsnagCrashReport *))block {
    NSString *exceptionName = exception.name ?: NSStringFromClass([exception class]);
    NSString *message = exception.reason;
    if (handledState.unhandled) {
        [self.sessionTracker handleUnhandledErrorEvent];
    } else {
        [self.sessionTracker handleHandledErrorEvent];
    }

    BugsnagCrashReport *report = [[BugsnagCrashReport alloc]
        initWithErrorName:exceptionName
             errorMessage:message
            configuration:self.configuration
                 metaData:[self.configuration.metaData toDictionary]
             handledState:handledState
                  session:self.sessionTracker.runningSession];
    if (block) {
        block(report);
    }
    //    We discard 5 stack frames (including this one) by default,
    //    and sum that with the number specified by report.depth:
    //
    //    0 bsg_kscrashsentry_reportUserException
    //    1 bsg_kscrash_reportUserException
    //    2 -[BSG_KSCrash
    //    reportUserException:reason:language:lineOfCode:stackTrace:terminateProgram:]
    //    3 -[BugsnagCrashSentry reportUserException:reason:]
    //    4 -[BugsnagNotifier notify:message:block:]

    int depth = (int)(BSGNotifierStackFrameCount + report.depth);

    NSString *reportName =
        report.errorClass ?: NSStringFromClass([NSException class]);
    NSString *reportMessage = report.errorMessage ?: @"";

    [self.crashSentry reportUserException:reportName
                                   reason:reportMessage
                        originalException:exception
                             handledState:[handledState toJson]
                                 appState:[self.state toDictionary]
                        callbackOverrides:report.overrides
                                 metadata:[report.metaData copy]
                                   config:[self.configuration.config toDictionary]
                             discardDepth:depth];

    [self addBreadcrumbWithBlock:^(BugsnagBreadcrumb *_Nonnull crumb) {
      crumb.type = BSGBreadcrumbTypeError;
      crumb.name = reportName;
      crumb.metadata = @{
          BSGKeyMessage : reportMessage,
          BSGKeySeverity : BSGFormatSeverity(report.severity)
      };
    }];
    [self flushPendingReports];
}

- (void)addBreadcrumbWithBlock:
    (void (^_Nonnull)(BugsnagBreadcrumb *_Nonnull))block {
    [self.configuration.breadcrumbs addBreadcrumbWithBlock:block];
    [self serializeBreadcrumbs];
}

- (void)clearBreadcrumbs {
    [self.configuration.breadcrumbs clearBreadcrumbs];
    [self serializeBreadcrumbs];
}

- (void)serializeBreadcrumbs {
    BugsnagBreadcrumbs *crumbs = self.configuration.breadcrumbs;
    NSArray *arrayValue = crumbs.count == 0 ? nil : [crumbs arrayValue];
    [self.state addAttribute:BSGKeyBreadcrumbs
                   withValue:arrayValue
               toTabWithName:BSTabCrash];
}

- (void)metaDataChanged:(BugsnagMetaData *)metaData {
    @synchronized(metaData) {
        if (metaData == self.configuration.metaData) {
            if ([self.metaDataLock tryLock]) {
                BSSerializeJSONDictionary([metaData toDictionary],
                                          &bsg_g_bugsnag_data.metaDataJSON);
                [self.metaDataLock unlock];
            }
        } else if (metaData == self.configuration.config) {
            BSSerializeJSONDictionary([metaData getTab:BSGKeyConfig],
                                      &bsg_g_bugsnag_data.configJSON);
        } else if (metaData == self.state) {
            BSSerializeJSONDictionary([metaData toDictionary],
                                      &bsg_g_bugsnag_data.stateJSON);
        } else {
            bsg_log_debug(@"Unknown metadata dictionary changed");
        }
    }
}

#if TARGET_OS_TV
#elif TARGET_IPHONE_SIMULATOR || TARGET_OS_IPHONE
- (void)batteryChanged:(NSNotification *)notif {
    NSNumber *batteryLevel =
            @([UIDevice currentDevice].batteryLevel);
    NSNumber *charging =
            @([UIDevice currentDevice].batteryState ==
                    UIDeviceBatteryStateCharging);

    [[self state] addAttribute:BSGKeyBatteryLevel
                     withValue:batteryLevel
                 toTabWithName:BSGKeyDeviceState];
    [[self state] addAttribute:BSGKeyCharging
                     withValue:charging
                 toTabWithName:BSGKeyDeviceState];
}

- (void)orientationChanged:(NSNotification *)notif {
    NSString *orientation;
    UIDeviceOrientation deviceOrientation =
        [UIDevice currentDevice].orientation;

    switch (deviceOrientation) {
    case UIDeviceOrientationPortraitUpsideDown:
        orientation = @"portraitupsidedown";
        break;
    case UIDeviceOrientationPortrait:
        orientation = @"portrait";
        break;
    case UIDeviceOrientationLandscapeRight:
        orientation = @"landscaperight";
        break;
    case UIDeviceOrientationLandscapeLeft:
        orientation = @"landscapeleft";
        break;
    case UIDeviceOrientationFaceUp:
        orientation = @"faceup";
        break;
    case UIDeviceOrientationFaceDown:
        orientation = @"facedown";
        break;
    default:
        return; // always ignore unknown breadcrumbs
    }

    NSDictionary *lastBreadcrumb =
        [[self.configuration.breadcrumbs arrayValue] lastObject];
    NSString *orientationNotifName =
        BSGBreadcrumbNameForNotificationName(notif.name);

    if (lastBreadcrumb &&
        [orientationNotifName isEqualToString:lastBreadcrumb[BSGKeyName]]) {
        NSDictionary *metaData = lastBreadcrumb[BSGKeyMetaData];

        if ([orientation isEqualToString:metaData[BSGKeyOrientation]]) {
            return; // ignore duplicate orientation event
        }
    }

    [[self state] addAttribute:BSGKeyOrientation
                     withValue:orientation
                 toTabWithName:BSGKeyDeviceState];
    if ([self.configuration automaticallyCollectBreadcrumbs]) {
        [self addBreadcrumbWithBlock:^(BugsnagBreadcrumb *_Nonnull breadcrumb) {
          breadcrumb.type = BSGBreadcrumbTypeState;
          breadcrumb.name = orientationNotifName;
          breadcrumb.metadata = @{BSGKeyOrientation : orientation};
        }];
    }
}

- (void)lowMemoryWarning:(NSNotification *)notif {
    [[self state] addAttribute:BSEventLowMemoryWarning
                     withValue:[[Bugsnag payloadDateFormatter]
                                   stringFromDate:[NSDate date]]
                 toTabWithName:BSGKeyDeviceState];
    if ([self.configuration automaticallyCollectBreadcrumbs]) {
        [self sendBreadcrumbForNotification:notif];
    }
}
#endif

- (void)updateCrashDetectionSettings {
    if (self.configuration.autoDetectErrors) {
        // Enable all crash detection
        bsg_kscrash_setHandlingCrashTypes(BSG_KSCrashTypeAll);
        if (self.configuration.reportOOMs) {
            [self.oomWatchdog enable];
        }
    } else {
        // Only enable support for notify()-based reports
        bsg_kscrash_setHandlingCrashTypes(BSG_KSCrashTypeUserReported);
        // autoDetectErrors gates all unhandled report detection
        [self.oomWatchdog disable];
    }
}

- (void)updateAutomaticBreadcrumbDetectionSettings {
    if ([self.configuration automaticallyCollectBreadcrumbs]) {
        for (NSString *name in [self automaticBreadcrumbStateEvents]) {
            [self crumbleNotification:name];
        }
        for (NSString *name in [self automaticBreadcrumbTableItemEvents]) {
            [[NSNotificationCenter defaultCenter]
                addObserver:self
                   selector:@selector(sendBreadcrumbForTableViewNotification:)
                       name:name
                     object:nil];
        }
        for (NSString *name in [self automaticBreadcrumbControlEvents]) {
            [[NSNotificationCenter defaultCenter]
                addObserver:self
                   selector:@selector(sendBreadcrumbForControlNotification:)
                       name:name
                     object:nil];
        }
        for (NSString *name in [self automaticBreadcrumbMenuItemEvents]) {
            [[NSNotificationCenter defaultCenter]
                addObserver:self
                   selector:@selector(sendBreadcrumbForMenuItemNotification:)
                       name:name
                     object:nil];
        }
    } else {
        NSArray *eventNames = [[[[self automaticBreadcrumbStateEvents]
            arrayByAddingObjectsFromArray:[self
                                              automaticBreadcrumbControlEvents]]
            arrayByAddingObjectsFromArray:
                [self automaticBreadcrumbMenuItemEvents]]
            arrayByAddingObjectsFromArray:
                [self automaticBreadcrumbTableItemEvents]];
        for (NSString *name in eventNames) {
            [[NSNotificationCenter defaultCenter] removeObserver:self
                                                            name:name
                                                          object:nil];
        }
    }
}

- (NSArray<NSString *> *)automaticBreadcrumbStateEvents {
#if TARGET_OS_TV
    return @[
        NSUndoManagerDidUndoChangeNotification,
        NSUndoManagerDidRedoChangeNotification,
        UIWindowDidBecomeVisibleNotification,
        UIWindowDidBecomeHiddenNotification, UIWindowDidBecomeKeyNotification,
        UIWindowDidResignKeyNotification,
        UIScreenBrightnessDidChangeNotification
    ];
#elif TARGET_IPHONE_SIMULATOR || TARGET_OS_IPHONE
    return @[
        UIWindowDidBecomeHiddenNotification,
        UIWindowDidBecomeVisibleNotification,
        UIApplicationWillTerminateNotification,
        UIApplicationWillEnterForegroundNotification,
        UIApplicationDidEnterBackgroundNotification,
        UIKeyboardDidShowNotification, UIKeyboardDidHideNotification,
        UIMenuControllerDidShowMenuNotification,
        UIMenuControllerDidHideMenuNotification,
        NSUndoManagerDidUndoChangeNotification,
        NSUndoManagerDidRedoChangeNotification,
#if __IPHONE_OS_VERSION_MIN_REQUIRED >= __IPHONE_7_0
        UIApplicationUserDidTakeScreenshotNotification
#endif
    ];
#elif TARGET_OS_MAC
    return @[
        NSApplicationDidBecomeActiveNotification,
        NSApplicationDidResignActiveNotification,
        NSApplicationDidHideNotification, NSApplicationDidUnhideNotification,
        NSApplicationWillTerminateNotification,
        NSWorkspaceScreensDidSleepNotification,
        NSWorkspaceScreensDidWakeNotification, NSWindowWillCloseNotification,
        NSWindowDidBecomeKeyNotification, NSWindowWillMiniaturizeNotification,
        NSWindowDidEnterFullScreenNotification,
        NSWindowDidExitFullScreenNotification
    ];
#else
    return nil;
#endif
}

- (NSArray<NSString *> *)automaticBreadcrumbControlEvents {
#if TARGET_IPHONE_SIMULATOR || TARGET_OS_IPHONE
    return @[
        UITextFieldTextDidBeginEditingNotification,
        UITextViewTextDidBeginEditingNotification,
        UITextFieldTextDidEndEditingNotification,
        UITextViewTextDidEndEditingNotification
    ];
#elif TARGET_OS_MAC
    return @[
        NSControlTextDidBeginEditingNotification,
        NSControlTextDidEndEditingNotification
    ];
#else
    return nil;
#endif
}

- (NSArray<NSString *> *)automaticBreadcrumbTableItemEvents {
#if TARGET_IPHONE_SIMULATOR || TARGET_OS_IPHONE || TARGET_OS_TV
    return @[ UITableViewSelectionDidChangeNotification ];
#elif TARGET_OS_MAC
    return @[ NSTableViewSelectionDidChangeNotification ];
#else
    return nil;
#endif
}

- (NSArray<NSString *> *)automaticBreadcrumbMenuItemEvents {
#if TARGET_OS_TV
    return @[];
#elif TARGET_IPHONE_SIMULATOR || TARGET_OS_IPHONE
    return nil;
#elif TARGET_OS_MAC
    return @[ NSMenuWillSendActionNotification ];
#else
    return nil;
#endif
}

- (void)crumbleNotification:(NSString *)notificationName {
    [[NSNotificationCenter defaultCenter]
        addObserver:self
           selector:@selector(sendBreadcrumbForNotification:)
               name:notificationName
             object:nil];
}

- (void)dealloc {
    [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)sendBreadcrumbForNotification:(NSNotification *)note {
    [self addBreadcrumbWithBlock:^(BugsnagBreadcrumb *_Nonnull breadcrumb) {
      breadcrumb.type = BSGBreadcrumbTypeState;
      breadcrumb.name = BSGBreadcrumbNameForNotificationName(note.name);
    }];
}

- (void)sendBreadcrumbForTableViewNotification:(NSNotification *)note {
#if TARGET_IPHONE_SIMULATOR || TARGET_OS_IPHONE || TARGET_OS_TV
    UITableView *tableView = [note object];
    NSIndexPath *indexPath = [tableView indexPathForSelectedRow];
    [self addBreadcrumbWithBlock:^(BugsnagBreadcrumb *_Nonnull breadcrumb) {
      breadcrumb.type = BSGBreadcrumbTypeNavigation;
      breadcrumb.name = BSGBreadcrumbNameForNotificationName(note.name);
      if (indexPath) {
          breadcrumb.metadata =
              @{ @"row" : @(indexPath.row),
                 @"section" : @(indexPath.section) };
      }
    }];
#elif TARGET_OS_MAC
    NSTableView *tableView = [note object];
    [self addBreadcrumbWithBlock:^(BugsnagBreadcrumb *_Nonnull breadcrumb) {
      breadcrumb.type = BSGBreadcrumbTypeNavigation;
      breadcrumb.name = BSGBreadcrumbNameForNotificationName(note.name);
      if (tableView) {
          breadcrumb.metadata = @{
              @"selectedRow" : @(tableView.selectedRow),
              @"selectedColumn" : @(tableView.selectedColumn)
          };
      }
    }];
#endif
}

- (void)sendBreadcrumbForMenuItemNotification:(NSNotification *)notif {
#if TARGET_OS_TV
#elif TARGET_IPHONE_SIMULATOR || TARGET_OS_IPHONE
#elif TARGET_OS_MAC
    NSMenuItem *menuItem = [[notif userInfo] valueForKey:@"MenuItem"];
    if ([menuItem isKindOfClass:[NSMenuItem class]]) {
        [self addBreadcrumbWithBlock:^(BugsnagBreadcrumb *_Nonnull breadcrumb) {
          breadcrumb.type = BSGBreadcrumbTypeState;
          breadcrumb.name = BSGBreadcrumbNameForNotificationName(notif.name);
          if (menuItem.title.length > 0)
              breadcrumb.metadata = @{BSGKeyAction : menuItem.title};
        }];
    }
#endif
}

- (void)sendBreadcrumbForControlNotification:(NSNotification *)note {
#if TARGET_OS_TV
#elif TARGET_IPHONE_SIMULATOR || TARGET_OS_IPHONE
    UIControl *control = note.object;
    [self addBreadcrumbWithBlock:^(BugsnagBreadcrumb *_Nonnull breadcrumb) {
      breadcrumb.type = BSGBreadcrumbTypeUser;
      breadcrumb.name = BSGBreadcrumbNameForNotificationName(note.name);
      NSString *label = control.accessibilityLabel;
      if (label.length > 0) {
          breadcrumb.metadata = @{BSGKeyLabel : label};
      }
    }];
#elif TARGET_OS_MAC
    NSControl *control = note.object;
    [self addBreadcrumbWithBlock:^(BugsnagBreadcrumb *_Nonnull breadcrumb) {
      breadcrumb.type = BSGBreadcrumbTypeUser;
      breadcrumb.name = BSGBreadcrumbNameForNotificationName(note.name);
      if ([control respondsToSelector:@selector(accessibilityLabel)]) {
          NSString *label = control.accessibilityLabel;
          if (label.length > 0) {
              breadcrumb.metadata = @{BSGKeyLabel : label};
          }
      }
    }];
#endif
}

@end
