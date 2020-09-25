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

#import "BugsnagPlatformConditional.h"

#import "BugsnagClient.h"
#import "BugsnagClientInternal.h"
#import "BSGConnectivity.h"
#import "Bugsnag.h"
#import "Private.h"
#import "BugsnagCrashSentry.h"
#import "BugsnagHandledState.h"
#import "BugsnagLogger.h"
#import "BugsnagKeys.h"
#import "BugsnagSessionTracker.h"
#import "BugsnagSessionTrackingApiClient.h"
#import "BugsnagPluginClient.h"
#import "BSGOutOfMemoryWatchdog.h"
#import "BSG_RFC3339DateTool.h"
#import "BSG_KSCrashC.h"
#import "BSG_KSCrashType.h"
#import "BSG_KSCrashState.h"
#import "BSG_KSSystemInfo.h"
#import "BSG_KSMach.h"
#import "BSGSerialization.h"
#import "Bugsnag.h"
#import "BugsnagErrorTypes.h"
#import "BugsnagNotifier.h"
#import "BugsnagMetadataInternal.h"
#import "BugsnagStateEvent.h"
#import "BugsnagCollections.h"
#import "BSG_KSCrashReport.h"
#import "BSG_KSCrash.h"
#import "BSGJSONSerialization.h"

#if BSG_PLATFORM_IOS
#import <UIKit/UIKit.h>
#elif BSG_PLATFORM_OSX
#import <AppKit/AppKit.h>
#endif

NSString *const BSTabCrash = @"crash";
NSString *const BSAttributeDepth = @"depth";
NSString *const BSEventLowMemoryWarning = @"lowMemoryWarning";

static NSInteger const BSGNotifierStackFrameCount = 4;

struct bugsnag_data_t {
    // Contains the state of the event (handled/unhandled)
    char *handledState;
    // Contains the user-specified metadata, including the user tab from config.
    char *metadataJSON;
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

NSDictionary *BSGParseAppMetadata(NSDictionary *event);
NSDictionary *BSGParseDeviceMetadata(NSDictionary *event);

@interface NSDictionary (BSGKSMerge)
- (NSDictionary *)BSG_mergedInto:(NSDictionary *)dest;
@end

@interface Bugsnag ()
+ (BugsnagClient *)client;
@end

@interface BugsnagSession ()
@property NSUInteger unhandledCount;
@property NSUInteger handledCount;
@end

@interface BugsnagThread ()
+ (NSMutableArray *)serializeThreads:(NSArray<BugsnagThread *> *)threads;
@end

@interface BugsnagAppWithState ()
+ (BugsnagAppWithState *)appWithDictionary:(NSDictionary *)event
                                    config:(BugsnagConfiguration *)config
                              codeBundleId:(NSString *)codeBundleId;
- (NSDictionary *)toDict;
@end

@interface BugsnagDeviceWithState ()
+ (BugsnagDeviceWithState *)deviceWithDictionary:(NSDictionary *)event;
- (NSDictionary *)toDictionary;
- (void)appendRuntimeInfo:(NSDictionary *)info;
@end

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
        if (bsg_g_bugsnag_data.metadataJSON) {
            // The API expects "metaData", capitalised as such.  Elsewhere is is one word.
            writer->addJSONElement(writer, "metaData", bsg_g_bugsnag_data.metadataJSON);
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

/**
 * Maps an NSNotificationName to its standard (Bugsnag) name
 *
 * @param name The NSNotificationName (type aliased to NSString)
 *
 * @returns The Bugsnag-standard name, or the notification name minus the "Notification" portion.
 */
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
 * Convert a device orientation into its Bugsnag string representation
 *
 * @param deviceOrientation The platform device orientation
 *
 * @returns A string representing the device orientation or nil if there's no equivalent
 */

#if BSG_PLATFORM_IOS
NSString *BSGOrientationNameFromEnum(UIDeviceOrientation deviceOrientation)
{
    NSString *orientation;
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
        return nil; // always ignore unknown breadcrumbs
    }
    return orientation;
}
#endif

/**
 *  Writes a dictionary to a destination using the BSG_KSCrash JSON encoding
 *
 *  @param dictionary  data to encode
 *  @param destination target location of the data
 */
void BSSerializeJSONDictionary(NSDictionary *dictionary, char **destination) {
    if (![BSGJSONSerialization isValidJSONObject:dictionary]) {
        bsg_log_err(@"could not serialize metadata: is not valid JSON object");
        return;
    }
    @try {
        NSError *error;
        NSData *json = [BSGJSONSerialization dataWithJSONObject:dictionary
                                                       options:0
                                                         error:&error];

        if (!json) {
            bsg_log_err(@"could not serialize metadata: %@", error);
            return;
        }
        *destination = reallocf(*destination, [json length] + 1);
        if (*destination) {
            memcpy(*destination, [json bytes], [json length]);
            (*destination)[[json length]] = '\0';
        }
    } @catch (NSException *exception) {
        bsg_log_err(@"could not serialize metadata: %@", exception);
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
    const char *newSessionId = [session.id UTF8String];
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

@interface BugsnagClient ()
@property(nonatomic, strong) BugsnagCrashSentry *crashSentry;
@property(nonatomic, strong) BugsnagErrorReportApiClient *errorReportApiClient;
@property (nonatomic, strong) BSGOutOfMemoryWatchdog *oomWatchdog;
@property (nonatomic, strong) BugsnagPluginClient *pluginClient;
@property (nonatomic) BOOL appDidCrashLastLaunch;
@property (nonatomic, strong) BugsnagMetadata *metadata;
@property (nonatomic) NSString *codeBundleId;
@property(nonatomic, readwrite, strong) NSMutableArray *stateEventBlocks;
#if BSG_PLATFORM_IOS
// The previous device orientation - iOS only
@property (nonatomic, strong) NSString *lastOrientation;
#endif
@property NSMutableDictionary *extraRuntimeInfo;
@property (nonatomic) BugsnagUser *user;
@end

@interface BugsnagConfiguration ()
@property(nonatomic, readwrite, strong) NSMutableSet *plugins;
@property(readonly, retain, nullable) NSURL *notifyURL;
@property(readwrite, retain, nullable) BugsnagMetadata *metadata;
@property(readwrite, retain, nullable) BugsnagMetadata *config;
- (BOOL)shouldRecordBreadcrumbType:(BSGBreadcrumbType)type;
@end

@interface BugsnagEvent ()
@property(readonly, copy, nonnull) NSDictionary *overrides;
@property(readwrite) NSUInteger depth;
@property(readonly, nonnull) BugsnagHandledState *handledState;
@property (nonatomic, strong) BugsnagMetadata *metadata;
- (void)setOverrideProperty:(NSString *)key value:(id)value;
- (NSDictionary *)toJson;
- (instancetype)initWithApp:(BugsnagAppWithState *)app
                     device:(BugsnagDeviceWithState *)device
               handledState:(BugsnagHandledState *)handledState
                       user:(BugsnagUser *)user
                   metadata:(BugsnagMetadata *)metadata
                breadcrumbs:(NSArray<BugsnagBreadcrumb *> *)breadcrumbs
                     errors:(NSArray<BugsnagError *> *)errors
                    threads:(NSArray<BugsnagThread *> *)threads
                    session:(BugsnagSession *)session;
@end

@interface BugsnagError ()
- (instancetype)initWithErrorClass:(NSString *)errorClass
                      errorMessage:(NSString *)errorMessage
                         errorType:(BSGErrorType)errorType
                        stacktrace:(NSArray<BugsnagStackframe *> *)stacktrace;
@end

@interface BSGOutOfMemoryWatchdog ()
@property(nonatomic) NSString *codeBundleId;
@end

@interface BugsnagSessionTracker ()
@property(nonatomic) NSString *codeBundleId;
@end

@interface BugsnagUser ()
- (instancetype)initWithDictionary:(NSDictionary *)dict;
- (instancetype)initWithUserId:(NSString *)userId name:(NSString *)name emailAddress:(NSString *)emailAddress;
- (NSDictionary *)toJson;
@end

@interface BugsnagBreadcrumbs ()
@property(nonatomic, readwrite, strong) NSMutableArray *breadcrumbs;
@end

// =============================================================================
// MARK: - BugsnagClient
// =============================================================================

@implementation BugsnagClient

/**
 * Storage for the device orientation.  It is "last" whenever an orientation change is received
 */
NSString *_lastOrientation = nil;

@synthesize configuration;

- (id)initWithConfiguration:(BugsnagConfiguration *)initConfiguration {
    static NSString *const BSGWatchdogSentinelFileName = @"bugsnag_oom_watchdog.json";
    static NSString *const BSGCrashSentinelFileName = @"bugsnag_handled_crash.txt";
    if ((self = [super init])) {
        // Take a shallow copy of the configuration
        self.configuration = [initConfiguration copy];
        self.state = [[BugsnagMetadata alloc] init];
        self.notifier = [BugsnagNotifier new];

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

        self.stateEventBlocks = [NSMutableArray new];
        self.extraRuntimeInfo = [NSMutableDictionary new];
        self.metadataLock = [[NSLock alloc] init];
        self.crashSentry = [BugsnagCrashSentry new];
        self.errorReportApiClient = [[BugsnagErrorReportApiClient alloc] initWithConfig:configuration
                                                                              queueName:@"Error API queue"];
        bsg_g_bugsnag_data.onCrash = (void (*)(const BSG_KSCrashReportWriter *))self.configuration.onCrashHandler;

        static dispatch_once_t once_t;
        dispatch_once(&once_t, ^{
            [self initializeNotificationNameMap];
        });

        self.sessionTracker = [[BugsnagSessionTracker alloc] initWithConfig:self.configuration
                                                                     client:self
                                                         postRecordCallback:^(BugsnagSession *session) {
                                                             BSGWriteSessionCrashData(session);
                                                         }];

        self.breadcrumbs = [[BugsnagBreadcrumbs alloc] initWithConfiguration:self.configuration];

        // Start with a copy of the configuration metadata
        self.metadata = [[configuration metadata] deepCopy];
        // sync initial state
        [self metadataChanged:self.metadata];
        [self metadataChanged:self.configuration.config];
        [self metadataChanged:self.state];

        // add observers for future metadata changes
        // weakSelf is used as the BugsnagClient will always be instantiated
        // for the entire lifecycle of an application, and there is therefore
        // no need to check for strong self
        __weak __typeof__(self) weakSelf = self;
        void (^observer)(BugsnagStateEvent *) = ^(BugsnagStateEvent *event) {
            [weakSelf metadataChanged:event.data];
        };
        [self addObserverWithBlock:observer];
        [self.metadata addObserverWithBlock:observer];
        [self.configuration.config addObserverWithBlock:observer];
        [self.state addObserverWithBlock:observer];

        self.pluginClient = [[BugsnagPluginClient alloc] initWithPlugins:self.configuration.plugins
                                                                  client:self];

#if BSG_PLATFORM_IOS
        _lastOrientation = BSGOrientationNameFromEnum([UIDevice currentDevice].orientation);
#endif
        _user = self.configuration.user;

        if (_user.id == nil) { // populate with an autogenerated ID if no value set
            [self setUser:[BSG_KSSystemInfo deviceAndAppHash] withEmail:_user.email andName:_user.name];
        }
    }
    return self;
}

- (void)addObserverWithBlock:(BugsnagObserverBlock _Nonnull)observer {
    [self.stateEventBlocks addObject:[observer copy]];

    // additionally listen for metadata updates
    [self.metadata addObserverWithBlock:observer];

    // sync the new observer with changes to metadata so far
    BugsnagStateEvent *event = [[BugsnagStateEvent alloc] initWithName:kStateEventMetadata data:self.metadata];
    observer(event);

    NSDictionary *userJson = [self.user toJson];
    observer([[BugsnagStateEvent alloc] initWithName:kStateEventUser data:userJson]);

    observer([[BugsnagStateEvent alloc] initWithName:kStateEventContext data:self.context]);
}

- (void)removeObserverWithBlock:(BugsnagObserverBlock _Nonnull)observer {
    [self.stateEventBlocks removeObject:observer];

    // additionally remove metadata listener
    [self.metadata removeObserverWithBlock:observer];
}

- (void)notifyObservers:(BugsnagStateEvent *)event {
    for (BugsnagObserverBlock callback in self.stateEventBlocks) {
        callback(event);
    }
}

NSString *const kWindowVisible = @"Window Became Visible";
NSString *const kWindowHidden = @"Window Became Hidden";
NSString *const kBeganTextEdit = @"Began Editing Text";
NSString *const kStoppedTextEdit = @"Stopped Editing Text";
NSString *const kUndoOperation = @"Undo Operation";
NSString *const kRedoOperation = @"Redo Operation";
NSString *const kTableViewSelectionChange = @"TableView Select Change";
NSString *const kAppWillTerminate = @"App Will Terminate";
NSString *const BSGBreadcrumbLoadedMessage = @"Bugsnag loaded";

/**
 * A map of notification names to human-readable strings
 */
- (void)initializeNotificationNameMap {
    notificationNameMap = @{
#if BSG_PLATFORM_TVOS
        NSUndoManagerDidUndoChangeNotification : kUndoOperation,
        NSUndoManagerDidRedoChangeNotification : kRedoOperation,
        UIWindowDidBecomeVisibleNotification : kWindowVisible,
        UIWindowDidBecomeHiddenNotification : kWindowHidden,
        UIWindowDidBecomeKeyNotification : @"Window Became Key",
        UIWindowDidResignKeyNotification : @"Window Resigned Key",
        UIScreenBrightnessDidChangeNotification : @"Screen Brightness Changed",
        UITableViewSelectionDidChangeNotification : kTableViewSelectionChange,

#elif BSG_PLATFORM_IOS
        UIWindowDidBecomeVisibleNotification : kWindowVisible,
        UIWindowDidBecomeHiddenNotification : kWindowHidden,
        UIApplicationWillTerminateNotification : kAppWillTerminate,
        UIApplicationWillEnterForegroundNotification : @"App Will Enter Foreground",
        UIApplicationDidEnterBackgroundNotification : @"App Did Enter Background",
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

#elif BSG_PLATFORM_OSX
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

#if BSG_PLATFORM_TVOS
    [self addTerminationObserver:UIApplicationWillTerminateNotification];

#elif BSG_PLATFORM_IOS
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
    [self addTerminationObserver:UIApplicationWillTerminateNotification];

#elif BSG_PLATFORM_OSX
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
    BOOL configuredToReportOOMs = self.configuration.autoDetectErrors && self.configuration.enabledErrorTypes.ooms;

    // Disable if a debugger is enabled, since the development cycle of starting
    // and restarting an app is also an uncatchable kill
    BOOL noDebuggerEnabled = !bsg_ksmachisBeingTraced();

    // Disable if in an app extension, since app extensions have a different
    // app lifecycle and the heuristic used for finding app terminations rooted
    // in fixable code does not apply
    BOOL notInAppExtension = ![BSG_KSSystemInfo isRunningInAppExtension];

    if (configuredToReportOOMs && noDebuggerEnabled && notInAppExtension) {
        [self.oomWatchdog start];
    }

    [self.sessionTracker startNewSessionIfAutoCaptureEnabled];

    // Record a "Bugsnag Loaded" message
    [self addAutoBreadcrumbOfType:BSGBreadcrumbTypeState
                      withMessage:BSGBreadcrumbLoadedMessage
                      andMetadata:nil];

    // notification not received in time on initial startup, so trigger manually
    [self willEnterForeground:self];
    [self.pluginClient loadPlugins];

    // add metadata about app/device
    NSDictionary *systemInfo = [BSG_KSSystemInfo systemInfo];
    [self.metadata addMetadata:BSGParseAppMetadata(@{@"system": systemInfo}) toSection:BSGKeyApp];
    [self.metadata addMetadata:BSGParseDeviceMetadata(@{@"system": systemInfo}) toSection:BSGKeyDevice];
}

- (void)addTerminationObserver:(NSString *)name {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(unsubscribeFromNotifications:)
                                                 name:name
                                               object:nil];
}

- (void)computeDidCrashLastLaunch {
    const BSG_KSCrash_State *crashState = bsg_kscrashstate_currentState();
#if BSG_PLATFORM_TVOS || BSG_PLATFORM_IOS
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
    self.appDidCrashLastLaunch = handledCrashLastLaunch || [self.oomWatchdog didOOMLastLaunch];

    // Ignore potential false positive OOM if previous session crashed and was
    // reported. There are two checks in place:
    //
    //     1. crashState->crashedLastLaunch: Accurate unless the crash callback crashes
    //
    //     2. crash sentinel file exists: This file is written in the event of a crash
    //        and insures against the crash callback crashing

    if (!handledCrashLastLaunch && [self.oomWatchdog didOOMLastLaunch]) {
        [self notifyOutOfMemoryEvent];
    }
#else
    self.appDidCrashLastLaunch = crashState->crashedLastLaunch;
#endif
}

- (void)setCodeBundleId:(NSString *)codeBundleId {
    _codeBundleId = codeBundleId;
    [self.state addMetadata:codeBundleId withKey:BSGKeyCodeBundleId toSection:BSGKeyApp];
    self.oomWatchdog.codeBundleId = codeBundleId;
    self.sessionTracker.codeBundleId = codeBundleId;
}

/**
 * Removes observers and listeners to prevent allocations when the app is terminated
 */
- (void)unsubscribeFromNotifications:(id)sender {
    [[NSNotificationCenter defaultCenter] removeObserver:self];
    [BSGConnectivity stopMonitoring];

#if BSG_PLATFORM_IOS
    [UIDevice currentDevice].batteryMonitoringEnabled = NO;
    [[UIDevice currentDevice] endGeneratingDeviceOrientationNotifications];
#endif
}

- (void)watchLifecycleEvents:(NSNotificationCenter *)center {
    NSString *foregroundName;
    NSString *backgroundName;

    #if BSG_PLATFORM_IOS || BSG_PLATFORM_TVOS
    foregroundName = UIApplicationWillEnterForegroundNotification;
    backgroundName = UIApplicationDidEnterBackgroundNotification;
    #elif BSG_PLATFORM_OSX
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

- (void)pauseSession {
    [self.sessionTracker pauseSession];
}

- (BOOL)resumeSession {
    return [self.sessionTracker resumeSession];
}

- (void)flushPendingReports {
    [self.errorReportApiClient flushPendingData];
}

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
            [strongSelf flushPendingReports];
        }

        [self addAutoBreadcrumbOfType:BSGBreadcrumbTypeState
                          withMessage:@"Connectivity changed"
                          andMetadata:@{
                              @"type"  :  connectionType
                          }];
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
    [self startListeningForStateChangeNotification:notificationName];
}

- (void)leaveBreadcrumbWithMessage:(NSString *_Nonnull)message
                          metadata:(NSDictionary *_Nullable)metadata
                           andType:(BSGBreadcrumbType)type {
    [self addBreadcrumbWithBlock:^(BugsnagBreadcrumb *_Nonnull crumbs) {
        crumbs.message = message;
        crumbs.metadata = metadata;
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
    NSDictionary *userJson = [_user toJson];
    [self.state addMetadata:userJson toSection:BSGKeyUser];

    NSMutableDictionary *dict = [NSMutableDictionary new];
    BSGDictInsertIfNotNil(dict, userId, @"id");
    BSGDictInsertIfNotNil(dict, email, @"email");
    BSGDictInsertIfNotNil(dict, name, @"name");
    [self notifyObservers:[[BugsnagStateEvent alloc] initWithName:kStateEventUser data:dict]];
}

// =============================================================================
// MARK: - onSession
// =============================================================================

- (void)addOnSessionBlock:(BugsnagOnSessionBlock _Nonnull)block {
    [self.configuration addOnSessionBlock:block];
}

- (void)removeOnSessionBlock:(BugsnagOnSessionBlock _Nonnull )block {
    [self.configuration removeOnSessionBlock:block];
}

// =============================================================================
// MARK: - onBreadcrumb
// =============================================================================

- (void)addOnBreadcrumbBlock:(BugsnagOnBreadcrumbBlock _Nonnull)block {
    [self.configuration addOnBreadcrumbBlock:block];
}

- (void)removeOnBreadcrumbBlock:(BugsnagOnBreadcrumbBlock _Nonnull)block {
    [self.configuration removeOnBreadcrumbBlock:block];
}

// =============================================================================
// MARK: - Other methods
// =============================================================================

- (void)setContext:(NSString *_Nullable)context {
    self.configuration.context = context;
    [self notifyObservers:[[BugsnagStateEvent alloc] initWithName:kStateEventContext data:context]];
}

- (NSString *)context {
    return self.configuration.context;
}

// MARK: - Notify

// note - some duplication between notifyError calls is required to ensure
// the same number of stackframes are used for each call.
// see notify:handledState:block for further info

- (void)notifyError:(NSError *_Nonnull)error {
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
    [event addMetadata:@{
                            @"code" : @(error.code),
                            @"domain" : error.domain,
                            BSGKeyReason : error.localizedFailureReason ?: @""
                        }
             toSection:@"nserror"];
    if (event.context == nil) { // set context as error domain
         event.context = [NSString stringWithFormat:@"%@ (%ld)", error.domain, (long)error.code];
    }

    if (block) {
        return block(event);
    }
    return true;
}

- (void)notify:(NSException *_Nonnull)exception {
    BugsnagHandledState *state =
            [BugsnagHandledState handledStateWithSeverityReason:HandledException];
    [self notify:exception handledState:state block:nil];
}

- (void)notify:(NSException *)exception
         block:(BugsnagOnErrorBlock)block
{
    BugsnagHandledState *state =
        [BugsnagHandledState handledStateWithSeverityReason:HandledException];
    [self notify:exception handledState:state block:block];
}

- (void)notifyOutOfMemoryEvent {
    static NSString *const BSGOutOfMemoryErrorClass = @"Out Of Memory";
    static NSString *const BSGOutOfMemoryMessageFormat = @"The app was likely terminated by the operating system while in the %@";
    NSMutableDictionary *lastLaunchInfo = [[self.oomWatchdog lastBootCachedFileInfo] mutableCopy];
    NSArray *crumbs = [self.breadcrumbs cachedBreadcrumbs];
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
                             handledState:[handledState toJson]
                                 appState:appState
                        callbackOverrides:@{}
                           eventOverrides:nil
                                 metadata:@{}
                                   config:@{}];
}

- (void)notify:(NSException *)exception
  handledState:(BugsnagHandledState *_Nonnull)handledState
         block:(BugsnagOnErrorBlock)block
{
    BugsnagError *error = [BugsnagError new];
    error.type = BSGErrorTypeCocoa;

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
     * 4. -[BSG_KSCrash captureThreads:depth:]
     */
    int depth = (int)(BSGNotifierStackFrameCount);

    BOOL recordAllThreads = self.configuration.sendThreads == BSGThreadSendPolicyAlways;
    NSArray *threads = [[BSG_KSCrash sharedInstance] captureThreads:exception
                                                              depth:depth
                                                   recordAllThreads:recordAllThreads];
    NSArray *errors = @[[self generateError:exception threads:threads]];

    BugsnagMetadata *metadata = [self.metadata deepCopy];

    NSDictionary *systemInfo = [BSG_KSSystemInfo systemInfo];
    BugsnagEvent *event = [[BugsnagEvent alloc] initWithApp:[self generateAppWithState:systemInfo]
                                                     device:[self generateDeviceWithState:systemInfo]
                                               handledState:handledState
                                                       user:self.user
                                                   metadata:metadata
                                                breadcrumbs:[NSArray arrayWithArray:self.breadcrumbs.breadcrumbs]
                                                     errors:errors
                                                    threads:threads
                                                    session:self.sessionTracker.runningSession];
    event.apiKey = self.configuration.apiKey;
    event.context = self.context;
    event.originalError = exception;

    [self notifyInternal:event block:block];
}

/**
 *  Notify Bugsnag of an exception. Only intended for React Native/Unity use.
 *
 *  @param event    the event
 *  @param block     Configuration block for adding additional report information
 */
- (void)notifyInternal:(BugsnagEvent *_Nonnull)event
                 block:(BugsnagOnErrorBlock)block
{
    // enhance device information with additional metadata
    NSDictionary *deviceFields = [self.state getMetadataFromSection:BSGKeyDeviceState];

    if (deviceFields) {
        [event.metadata addMetadata:deviceFields toSection:BSGKeyDevice];
    }

    @try {
        if (block != nil && !block(event)) { // skip notifying if callback false
            return;
        }
    } @catch (NSException *exception) {
        bsg_log_err(@"Error from onError callback: %@", exception);
    }

    if (event.handledState.unhandled) {
        [self.sessionTracker handleUnhandledErrorEvent];
    } else {
        [self.sessionTracker handleHandledErrorEvent];
    }

    // apiKey not added to event JSON by default, need to add it here
    // for when it is read next
    NSMutableDictionary *eventOverrides = [[event toJson] mutableCopy];
    eventOverrides[BSGKeyApiKey] = event.apiKey;

    // handled errors should persist any information edited by the user
    // in a section within the KSCrash report so it can be read
    // when the error is delivered
    [self.crashSentry reportUserException:@""
                                   reason:@""
                             handledState:[event.handledState toJson]
                                 appState:[self.state toDictionary]
                        callbackOverrides:event.overrides
                           eventOverrides:eventOverrides
                                 metadata:[event.metadata toDictionary]
                                   config:[self.configuration.config toDictionary]];

    // A basic set of event metadata
    NSMutableDictionary *metadata = [@{
            BSGKeyErrorClass : event.errors[0].errorClass,
            BSGKeyUnhandled : [[event handledState] unhandled] ? @YES : @NO,
            BSGKeySeverity : BSGFormatSeverity(event.severity)
    } mutableCopy];

    // Only include the eventMessage if it contains something
    NSString *eventMessage = event.errors[0].errorMessage;
    if (eventMessage && [eventMessage length] > 0) {
        [metadata setValue:eventMessage forKey:BSGKeyName];
    }

    [self addAutoBreadcrumbOfType:BSGBreadcrumbTypeError
                      withMessage:event.errors[0].errorClass
                      andMetadata:metadata];

    [self flushPendingReports];
}

- (BugsnagError *)generateError:(NSException *)exception
                                 threads:(NSArray<BugsnagThread *> *)threads {
    NSString *errorClass = exception.name ?: NSStringFromClass([exception class]);
    NSString *errorMessage = exception.reason;

    BugsnagThread *errorReportingThread;

    for (BugsnagThread *thread in threads) {
        if (thread.errorReportingThread) {
            errorReportingThread = thread;
            break;
        }
    }

    BugsnagError *error = [[BugsnagError alloc] initWithErrorClass:errorClass
                                                      errorMessage:errorMessage ?: @""
                                                         errorType:BSGErrorTypeCocoa
                                                        stacktrace:errorReportingThread.stacktrace];
    return error;
}

// MARK: - Breadcrumbs

- (void)addBreadcrumbWithBlock:
    (void (^_Nonnull)(BugsnagBreadcrumb *_Nonnull))block {
    [self.breadcrumbs addBreadcrumbWithBlock:block];
    [self serializeBreadcrumbs];
}

- (void)serializeBreadcrumbs {
    [self.state addMetadata:[self.breadcrumbs arrayValue]
                    withKey:BSGKeyBreadcrumbs
                  toSection:BSTabCrash];
}

- (void)metadataChanged:(BugsnagMetadata *)metadata {
    @synchronized(metadata) {
        if (metadata == self.metadata) {
            if ([self.metadataLock tryLock]) {
                BSSerializeJSONDictionary([metadata toDictionary],
                                          &bsg_g_bugsnag_data.metadataJSON);
                [self.metadataLock unlock];
            }
        } else if (metadata == self.configuration.config) {
            BSSerializeJSONDictionary([metadata getMetadataFromSection:BSGKeyConfig],
                                      &bsg_g_bugsnag_data.configJSON);
        } else if (metadata == self.state) {
            BSSerializeJSONDictionary([metadata toDictionary],
                                      &bsg_g_bugsnag_data.stateJSON);
        }
    }
}

/**
 * Update the device status in response to a battery change notification
 *
 * @param notification The change notification
 */
#if BSG_PLATFORM_IOS
- (void)batteryChanged:(NSNotification *)notification {
    NSNumber *batteryLevel = @([UIDevice currentDevice].batteryLevel);
    BOOL charging = [UIDevice currentDevice].batteryState == UIDeviceBatteryStateCharging ||
                    [UIDevice currentDevice].batteryState == UIDeviceBatteryStateFull;

    [self.state addMetadata:batteryLevel
                    withKey:BSGKeyBatteryLevel
                  toSection:BSGKeyDeviceState];

    [self.state addMetadata:charging ? @YES : @NO
                    withKey:BSGKeyCharging
                  toSection:BSGKeyDeviceState];
}

/**
 * Called when an orientation change notification is received to record an
 * equivalent breadcrumb.
 *
 * @param notification The orientation-change notification
 */
- (void)orientationChanged:(NSNotification *)notification {
    UIDeviceOrientation currentDeviceOrientation = [UIDevice currentDevice].orientation;
    NSString *orientation = BSGOrientationNameFromEnum(currentDeviceOrientation);

    // No orientation, nothing  to be done
    if (!orientation) {
        return;
    }

    // Update the device orientation in metadata
    [self.state addMetadata:orientation
                    withKey:BSGKeyOrientation
                  toSection:BSGKeyDeviceState];

    // Short-circuit the exit if we don't have enough info to record a full breadcrumb
    // or the orientation hasn't changed (false positive).
    if (!_lastOrientation || [orientation isEqualToString:_lastOrientation]) {
        _lastOrientation = orientation;
        return;
    }

    // We have an orientation, it's not a dupe and we have a lastOrientation.
    // Send a breadcrumb and preserve the orientation.

    [self addAutoBreadcrumbOfType:BSGBreadcrumbTypeState
                      withMessage:BSGBreadcrumbNameForNotificationName(notification.name)
                      andMetadata:@{
                          @"from" : _lastOrientation,
                          @"to" : orientation
                      }];

    _lastOrientation = orientation;
}

- (void)lowMemoryWarning:(NSNotification *)notif {
    [self.state addMetadata:[BSG_RFC3339DateTool stringFromDate:[NSDate date]]
                      withKey:BSEventLowMemoryWarning
                    toSection:BSGKeyDeviceState];

    if ([[self configuration] shouldRecordBreadcrumbType:BSGBreadcrumbTypeState]) {
        [self sendBreadcrumbForNotification:notif];
    }
}
#endif

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

/**
 * Configure event listeners (i.e. observers) for enabled automatic breadcrumbs.
 */
- (void)updateAutomaticBreadcrumbDetectionSettings {
   // State events
    if ([[self configuration] shouldRecordBreadcrumbType:BSGBreadcrumbTypeState]) {
        // Generic state events
        for (NSString *name in [self automaticBreadcrumbStateEvents]) {
            [self startListeningForStateChangeNotification:name];
        }

#if BSG_PLATFORM_OSX
        // Workspace-specific events - MacOS only
        for (NSString *name in [self workspaceBreadcrumbStateEvents]) {
            [self startListeningForWorkspaceStateChangeNotifications:name];
        }
#endif

        // NSMenu events (Mac only)
        for (NSString *name in [self automaticBreadcrumbMenuItemEvents]) {
            [[NSNotificationCenter defaultCenter]
                addObserver:self
                   selector:@selector(sendBreadcrumbForMenuItemNotification:)
                       name:name
                     object:nil];
        }
    }

    // Navigation events
    if ([[self configuration] shouldRecordBreadcrumbType:BSGBreadcrumbTypeNavigation]) {
        // UI/NSTableView events
        for (NSString *name in [self automaticBreadcrumbTableItemEvents]) {
            [[NSNotificationCenter defaultCenter]
                addObserver:self
                   selector:@selector(sendBreadcrumbForTableViewNotification:)
                       name:name
                     object:nil];
        }
    }

    // User events
    if ([[self configuration] shouldRecordBreadcrumbType:BSGBreadcrumbTypeUser]) {
        // UITextField/NSControl events (text editing)
        for (NSString *name in [self automaticBreadcrumbControlEvents]) {
            [[NSNotificationCenter defaultCenter]
                addObserver:self
                   selector:@selector(sendBreadcrumbForControlNotification:)
                       name:name
                     object:nil];
        }
    }
}

/**
 * NSWorkspace-specific automatic breadcrumb events
 */
- (NSArray<NSString *> *)workspaceBreadcrumbStateEvents {
#if BSG_PLATFORM_OSX
    return @[
        NSWorkspaceScreensDidSleepNotification,
        NSWorkspaceScreensDidWakeNotification
    ];
#endif

    // Fall-through
    return nil;
}

- (NSArray<NSString *> *)automaticBreadcrumbStateEvents {
#if BSG_PLATFORM_TVOS
    return @[
        NSUndoManagerDidUndoChangeNotification,
        NSUndoManagerDidRedoChangeNotification,
        UIWindowDidBecomeVisibleNotification,
        UIWindowDidBecomeHiddenNotification, UIWindowDidBecomeKeyNotification,
        UIWindowDidResignKeyNotification,
        UIScreenBrightnessDidChangeNotification
    ];
#elif BSG_PLATFORM_IOS
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
#elif BSG_PLATFORM_OSX
    return @[
        NSApplicationDidBecomeActiveNotification,
        NSApplicationDidResignActiveNotification,
        NSApplicationDidHideNotification,
        NSApplicationDidUnhideNotification,
        NSApplicationWillTerminateNotification,

        NSWindowWillCloseNotification,
        NSWindowDidBecomeKeyNotification,
        NSWindowWillMiniaturizeNotification,
        NSWindowDidEnterFullScreenNotification,
        NSWindowDidExitFullScreenNotification
    ];
#endif

    // Fall-through
    return nil;
}

- (NSArray<NSString *> *)automaticBreadcrumbControlEvents {
#if BSG_PLATFORM_IOS
    return @[
        UITextFieldTextDidBeginEditingNotification,
        UITextViewTextDidBeginEditingNotification,
        UITextFieldTextDidEndEditingNotification,
        UITextViewTextDidEndEditingNotification
    ];
#elif BSG_PLATFORM_OSX
    return @[
        NSControlTextDidBeginEditingNotification,
        NSControlTextDidEndEditingNotification
    ];
#endif

    // Fall-through
    return nil;
}

- (NSArray<NSString *> *)automaticBreadcrumbTableItemEvents {
#if BSG_PLATFORM_IOS || BSG_PLATFORM_TVOS
    return @[ UITableViewSelectionDidChangeNotification ];
#elif BSG_PLATFORM_OSX
    return @[ NSTableViewSelectionDidChangeNotification ];
#endif

    // Fall-through
    return nil;
}

- (NSArray<NSString *> *)automaticBreadcrumbMenuItemEvents {
#if BSG_PLATFORM_TVOS
    return @[];
#elif BSG_PLATFORM_IOS
    return nil;
#elif BSG_PLATFORM_OSX
    return @[ NSMenuWillSendActionNotification ];
#endif

    // Fall-through
    return nil;
}

/**
 * Configure a generic state change breadcrumb listener
 *
 * @param notificationName The name of the notification.
 */
- (void)startListeningForStateChangeNotification:(NSString *)notificationName {
    [[NSNotificationCenter defaultCenter]
        addObserver:self
           selector:@selector(sendBreadcrumbForNotification:)
               name:notificationName
             object:nil];
}

/**
 * Configure an NSWorkspace-specific state change breadcrumb listener.  MacOS only.
 *
 * @param notificationName The name of the notification.
 */
#if BSG_PLATFORM_OSX
- (void)startListeningForWorkspaceStateChangeNotifications:(NSString *)notificationName {
    [NSWorkspace.sharedWorkspace.notificationCenter
        addObserver:self
           selector:@selector(sendBreadcrumbForNotification:)
               name:notificationName
             object:nil];
    }
#endif

- (void)dealloc {
    [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)sendBreadcrumbForNotification:(NSNotification *)note {
    [self addBreadcrumbWithBlock:^(BugsnagBreadcrumb *_Nonnull breadcrumb) {
        breadcrumb.type = BSGBreadcrumbTypeState;
        breadcrumb.message = BSGBreadcrumbNameForNotificationName(note.name);
    }];
}

/**
 * Leave a navigation breadcrumb whenever a tableView selection changes
 *
 * @param notification The UI/NSTableViewSelectionDidChangeNotification
 */
- (void)sendBreadcrumbForTableViewNotification:(NSNotification *)notification {
#if BSG_PLATFORM_IOS || BSG_PLATFORM_TVOS
    UITableView *tableView = [notification object];
    NSIndexPath *indexPath = [tableView indexPathForSelectedRow];
    [self addBreadcrumbWithBlock:^(BugsnagBreadcrumb *_Nonnull breadcrumb) {
      breadcrumb.type = BSGBreadcrumbTypeNavigation;
      breadcrumb.message = BSGBreadcrumbNameForNotificationName(notification.name);
      if (indexPath) {
          breadcrumb.metadata =
              @{ @"row" : @(indexPath.row),
                 @"section" : @(indexPath.section) };
      }
    }];
#elif BSG_PLATFORM_OSX
    NSTableView *tableView = [notification object];
    [self addBreadcrumbWithBlock:^(BugsnagBreadcrumb *_Nonnull breadcrumb) {
      breadcrumb.type = BSGBreadcrumbTypeNavigation;
      breadcrumb.message = BSGBreadcrumbNameForNotificationName(notification.name);
      if (tableView) {
          breadcrumb.metadata = @{
              @"selectedRow" : @(tableView.selectedRow),
              @"selectedColumn" : @(tableView.selectedColumn)
          };
      }
    }];
#endif
}

/**
* Leave a state breadcrumb whenever a tableView selection changes
*
* @param notification The UI/NSTableViewSelectionDidChangeNotification
*/
- (void)sendBreadcrumbForMenuItemNotification:(NSNotification *)notification {
#if BSG_PLATFORM_OSX
    NSMenuItem *menuItem = [[notification userInfo] valueForKey:@"MenuItem"];
    if ([menuItem isKindOfClass:[NSMenuItem class]]) {
        [self addBreadcrumbWithBlock:^(BugsnagBreadcrumb *_Nonnull breadcrumb) {
          breadcrumb.type = BSGBreadcrumbTypeState;
          breadcrumb.message = BSGBreadcrumbNameForNotificationName(notification.name);
          if (menuItem.title.length > 0)
              breadcrumb.metadata = @{BSGKeyAction : menuItem.title};
        }];
    }
#endif
}

- (void)sendBreadcrumbForControlNotification:(NSNotification *)note {
#if BSG_PLATFORM_IOS
    UIControl *control = note.object;
    [self addBreadcrumbWithBlock:^(BugsnagBreadcrumb *_Nonnull breadcrumb) {
      breadcrumb.type = BSGBreadcrumbTypeUser;
      breadcrumb.message = BSGBreadcrumbNameForNotificationName(note.name);
      NSString *label = control.accessibilityLabel;
      if (label.length > 0) {
          breadcrumb.metadata = @{BSGKeyLabel : label};
      }
    }];
#elif BSG_PLATFORM_OSX
    NSControl *control = note.object;
    [self addBreadcrumbWithBlock:^(BugsnagBreadcrumb *_Nonnull breadcrumb) {
      breadcrumb.type = BSGBreadcrumbTypeUser;
      breadcrumb.message = BSGBreadcrumbNameForNotificationName(note.name);
      if ([control respondsToSelector:@selector(accessibilityLabel)]) {
          NSString *label = control.accessibilityLabel;
          if (label.length > 0) {
              breadcrumb.metadata = @{BSGKeyLabel : label};
          }
      }
    }];
#endif
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
    return [BugsnagAppWithState appWithDictionary:@{@"system": systemInfo}
                                           config:self.configuration
                                     codeBundleId:self.codeBundleId];
}

- (BugsnagDeviceWithState *)generateDeviceWithState:(NSDictionary *)systemInfo {
    BugsnagDeviceWithState *device = [BugsnagDeviceWithState deviceWithDictionary:@{@"system": systemInfo}];
    device.time = [NSDate date]; // default to current time for handled errors
    [device appendRuntimeInfo:self.extraRuntimeInfo];
    device.orientation = _lastOrientation;
    return device;
}

// MARK: - methods used by React Native for collecting payload data

- (NSDictionary *)collectAppWithState {
    return [[self generateAppWithState:[BSG_KSSystemInfo systemInfo]] toDict];
}

- (NSDictionary *)collectDeviceWithState {
    NSDictionary *systemInfo = [BSG_KSSystemInfo systemInfo];
    BugsnagDeviceWithState *device = [self generateDeviceWithState:systemInfo];
    return [device toDictionary];
}

- (NSArray *)collectBreadcrumbs {
    NSMutableArray *crumbs = self.breadcrumbs.breadcrumbs;
    NSMutableArray *data = [NSMutableArray new];

    for (BugsnagBreadcrumb *crumb in crumbs) {
        NSMutableDictionary *crumbData = [[crumb objectValue] mutableCopy];
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
    // 3. [BSG_KSCrash captureThreads:depth:unhandled:]
    int depth = 3;
    NSException *exc = [NSException exceptionWithName:@"Bugsnag" reason:@"" userInfo:nil];
    BSGThreadSendPolicy sendThreads = self.configuration.sendThreads;
    BOOL recordAllThreads = sendThreads == BSGThreadSendPolicyAlways
            || (unhandled && sendThreads == BSGThreadSendPolicyUnhandledOnly);
    NSArray<BugsnagThread *> *threads = [[BSG_KSCrash sharedInstance] captureThreads:exc
                                                                               depth:depth
                                                                    recordAllThreads:recordAllThreads];
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

@end
