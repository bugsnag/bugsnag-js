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

#if TARGET_IPHONE_SIMULATOR || TARGET_OS_IPHONE
#import <UIKit/UIKit.h>
#elif TARGET_OS_MAC
#import <AppKit/AppKit.h>
#endif

NSString *const BSTabCrash = @"crash";
NSString *const BSAttributeDepth = @"depth";
NSString *const BSEventLowMemoryWarning = @"lowMemoryWarning";

static NSInteger const BSGNotifierStackFrameCount = 6;

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
#if TARGET_OS_IOS
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
#if TARGET_IPHONE_SIMULATOR || TARGET_OS_IPHONE
// The previous device orientation - iOS only
@property (nonatomic, strong) NSString *lastOrientation;
#endif
@property NSMutableDictionary *extraRuntimeInfo;
@end

@interface BugsnagConfiguration ()
@property(nonatomic, readwrite, strong) NSMutableSet *plugins;
@property(readonly, retain, nullable) NSURL *notifyURL;
@property(readwrite, retain, nullable) BugsnagMetadata *metadata;
@property(readwrite, retain, nullable) BugsnagMetadata *config;
@property(readonly, strong, nullable) BugsnagBreadcrumbs *breadcrumbs;
- (BOOL)shouldRecordBreadcrumbType:(BSGBreadcrumbType)type;
@end

@interface BugsnagEvent ()
@property(readonly, copy, nonnull) NSDictionary *overrides;
@property(readwrite) NSUInteger depth;
@property(readonly, nonnull) BugsnagHandledState *handledState;
@property (nonatomic, strong) BugsnagMetadata *metadata;

- (instancetype _Nonnull)initWithErrorName:(NSString *_Nonnull)name
                              errorMessage:(NSString *_Nonnull)message
                             configuration:(BugsnagConfiguration *_Nonnull)config
                                  metadata:(BugsnagMetadata *_Nullable)metadata
                              handledState:(BugsnagHandledState *_Nonnull)handledState
                                   session:(BugsnagSession *_Nullable)session;
@end

@interface BugsnagMetadata ()
@property(unsafe_unretained) id<BugsnagMetadataDelegate> _Nullable delegate;
- (NSDictionary *_Nonnull)toDictionary;
- (id)deepCopy;
@end

@interface BSGOutOfMemoryWatchdog ()
@property(nonatomic) NSString *codeBundleId;
@end

@interface BugsnagSessionTracker ()
@property(nonatomic) NSString *codeBundleId;
@end

@interface BugsnagUser ()
- (instancetype)initWithDictionary:(NSDictionary *)dict;
@end

@interface Bugsnag ()
+ (NSDateFormatter *_Nonnull)payloadDateFormatter;
@end

@interface BugsnagBreadcrumbs ()
@property(nonatomic, readwrite, strong) NSMutableArray *breadcrumbs;
@end

// =============================================================================
// MARK: - BugsnagClient
// =============================================================================

@implementation BugsnagClient

#if TARGET_IPHONE_SIMULATOR || TARGET_OS_IPHONE
/**
 * Storage for the device orientation.  It is "last" whenever an orientation change is received
 */
NSString *_lastOrientation = nil;
#endif

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

        self.extraRuntimeInfo = [NSMutableDictionary new];
        self.metadataLock = [[NSLock alloc] init];
        self.configuration.metadata.delegate = self;
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

        self.sessionTracker = [[BugsnagSessionTracker alloc] initWithConfig:self.configuration
                                                         postRecordCallback:^(BugsnagSession *session) {
                                                             BSGWriteSessionCrashData(session);
                                                         }];

        // Start with a copy of the configuration metadata
        self.metadata = [[configuration metadata] deepCopy];
        [self metadataChanged:self.configuration.metadata];
        [self metadataChanged:self.configuration.config];
        [self metadataChanged:self.state];
        self.pluginClient = [[BugsnagPluginClient alloc] initWithPlugins:self.configuration.plugins];

#if TARGET_OS_IOS
        _lastOrientation = BSGOrientationNameFromEnum([UIDevice currentDevice].orientation);
#endif
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
NSString *const BSGBreadcrumbLoadedMessage = @"Bugsnag loaded";

/**
 * A map of notification names to human-readable strings
 */
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
    BOOL configuredToReportOOMs = self.configuration.autoDetectErrors && self.configuration.enabledErrorTypes.ooms;
    
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

    // Record a "Bugsnag Loaded" message
    [self addAutoBreadcrumbOfType:BSGBreadcrumbTypeState
                      withMessage:BSGBreadcrumbLoadedMessage
                      andMetadata:nil];

    // notification not received in time on initial startup, so trigger manually
    [self willEnterForeground:self];
    [self.pluginClient loadPlugins];
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
    self.appDidCrashLastLaunch = handledCrashLastLaunch || [self.oomWatchdog didOOMLastLaunch];
    // Ignore potential false positive OOM if previous session crashed and was
    // reported. There are two checks in place:
    // 1. crashState->crashedLastLaunch: Accurate unless the crash callback crashes
    // 2. crash sentinel file exists: This file is written in the event of a crash
    //    and insures against the crash callback crashing
    if (!handledCrashLastLaunch && [self.oomWatchdog didOOMLastLaunch]) {
        [self notifyOutOfMemoryEvent];
    }
#else
    self.appDidCrashLastLaunch = crashState->crashedLastLaunch;
#endif
}

- (void)setCodeBundleId:(NSString *)codeBundleId {
    _codeBundleId = codeBundleId;
    self.oomWatchdog.codeBundleId = codeBundleId;
    self.sessionTracker.codeBundleId = codeBundleId;
}

/**
 * Removes observers and listeners to prevent allocations when the app is terminated
 */
- (void)unsubscribeFromNotifications:(id)sender {
    [[NSNotificationCenter defaultCenter] removeObserver:self];
    [BSGConnectivity stopMonitoring];

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
    NSDictionary *userInfo = [self.metadata getMetadataFromSection:BSGKeyUser];
    return [[BugsnagUser alloc] initWithDictionary:userInfo ?: @{}];
}

- (void)setUser:(NSString *_Nullable)userId
      withEmail:(NSString *_Nullable)email
        andName:(NSString *_Nullable)name
{
    [self.metadata addMetadata:userId withKey:BSGKeyId    toSection:BSGKeyUser];
    [self.metadata addMetadata:name   withKey:BSGKeyName  toSection:BSGKeyUser];
    [self.metadata addMetadata:email  withKey:BSGKeyEmail toSection:BSGKeyUser];
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
// MARK: - onSend
// =============================================================================

- (void)addOnSendErrorBlock:(BugsnagOnSendErrorBlock _Nonnull)block {
    [self.configuration addOnSendErrorBlock:block];
}

- (void)removeOnSendErrorBlock:(BugsnagOnSendErrorBlock _Nonnull)block {
    [self.configuration removeOnSendErrorBlock:block];
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
}

- (NSString *)context {
    return self.configuration.context;
}

// MARK: - Notify

- (void)notifyError:(NSError *_Nonnull)error {
    [self notifyError:error block:nil];
}

- (void)notifyError:(NSError *)error
              block:(BugsnagOnErrorBlock)block
{
    BugsnagHandledState *state = [BugsnagHandledState handledStateWithSeverityReason:HandledError
                                                                            severity:BSGSeverityWarning
                                                                           attrValue:error.domain];
    NSException *wrapper = [NSException exceptionWithName:NSStringFromClass([error class])
                                                   reason:error.localizedDescription
                                                 userInfo:error.userInfo];
    [self notify:wrapper
    handledState:state
           block:^BOOL(BugsnagEvent *_Nonnull event) {
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
           }];
}

- (void)notify:(NSException *_Nonnull)exception {
    [self notify:exception block:nil];
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
         block:(BugsnagOnErrorBlock)block
{
    NSString *exceptionName = exception.name ?: NSStringFromClass([exception class]);
    NSString *message = exception.reason;

    BugsnagEvent *event = [[BugsnagEvent alloc] initWithErrorName:exceptionName
                                                     errorMessage:message
                                                    configuration:self.configuration
                                                         metadata:self.metadata
                                                     handledState:handledState
                                                          session:self.sessionTracker.runningSession];
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
    [event.device appendRuntimeInfo:self.extraRuntimeInfo];
    if (block != nil && !block(event)) { // skip notifying if callback false
        return;
    }

    if (event.handledState.unhandled) {
        [self.sessionTracker handleUnhandledErrorEvent];
    } else {
        [self.sessionTracker handleHandledErrorEvent];
    }

    //    We discard 6 stack frames (including this one) by default,
    //    and sum that with the number specified by report.depth:
    //
    //    0 bsg_kscrashsentry_reportUserException
    //    1 bsg_kscrash_reportUserException
    //    2 -[BSG_KSCrash
    //    reportUserException:reason:language:lineOfCode:stackTrace:terminateProgram:]
    //    3 -[BugsnagCrashSentry reportUserException:reason:]
    //    4 -[BugsnagClient notifyInternal:block:]
    //    5 -[BugsnagClient notify:message:block:]

    int depth = (int)(BSGNotifierStackFrameCount + event.depth);

    NSString *eventErrorClass = event.errors[0].errorClass ?: NSStringFromClass([NSException class]);
    NSString *eventMessage = event.errors[0].errorMessage ?: @"";

    NSException *exc = nil;

    if ([event.originalError isKindOfClass:[NSException class]]) {
        exc = event.originalError;
    }

    [self.crashSentry reportUserException:eventErrorClass
                                   reason:eventMessage
                        originalException:exc
                             handledState:[event.handledState toJson]
                                 appState:[self.state toDictionary]
                        callbackOverrides:event.overrides
                                 metadata:[event.metadata toDictionary]
                                   config:[self.configuration.config toDictionary]
                             discardDepth:depth];

    // A basic set of event metadata
    NSMutableDictionary *metadata = [@{
            BSGKeyErrorClass : eventErrorClass,
            BSGKeyUnhandled : [[event handledState] unhandled] ? @YES : @NO,
            BSGKeySeverity : BSGFormatSeverity(event.severity)
    } mutableCopy];

    // Only include the eventMessage if it contains something
    if (eventMessage && [eventMessage length] > 0) {
        [metadata setValue:eventMessage forKey:BSGKeyName];
    }

    [self addAutoBreadcrumbOfType:BSGBreadcrumbTypeError
                      withMessage:eventErrorClass
                      andMetadata:metadata];

    [self flushPendingReports];
}

// MARK: - Breadcrumbs

- (void)addBreadcrumbWithBlock:
    (void (^_Nonnull)(BugsnagBreadcrumb *_Nonnull))block {
    [self.configuration.breadcrumbs addBreadcrumbWithBlock:block];
    [self serializeBreadcrumbs];
}

- (void)serializeBreadcrumbs {
    BugsnagBreadcrumbs *crumbs = self.configuration.breadcrumbs;
    NSArray *arrayValue = crumbs.count == 0 ? nil : [crumbs arrayValue];
    [self.state addMetadata:arrayValue
                    withKey:BSGKeyBreadcrumbs
                  toSection:BSTabCrash];
}

- (void)metadataChanged:(BugsnagMetadata *)metadata {
    @synchronized(metadata) {
        if (metadata == self.configuration.metadata) {
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
        } else {
            bsg_log_debug(@"Unknown metadata dictionary changed");
        }
    }
}

/**
 * Update the device status in response to a battery change notification
 *
 * @param notification The change notification
 */
#if TARGET_OS_TV
#elif TARGET_IPHONE_SIMULATOR || TARGET_OS_IPHONE
- (void)batteryChanged:(NSNotification *)notification {
    NSNumber *batteryLevel = @([UIDevice currentDevice].batteryLevel);
    BOOL charging = [UIDevice currentDevice].batteryState == UIDeviceBatteryStateCharging ||
                    [UIDevice currentDevice].batteryState == UIDeviceBatteryStateFull;

    [[self state] addMetadata:batteryLevel
                     withKey:BSGKeyBatteryLevel
                 toSection:BSGKeyDeviceState];
    
    [[self state] addMetadata:charging ? @YES : @NO
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
    [[self state] addMetadata:orientation
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
    [[self state] addMetadata:[[Bugsnag payloadDateFormatter] stringFromDate:[NSDate date]]
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

#if TARGET_OS_TV
#elif TARGET_IPHONE_SIMULATOR || TARGET_OS_IPHONE
#elif TARGET_OS_MAC
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
#if TARGET_OS_TV
#elif TARGET_IPHONE_SIMULATOR || TARGET_OS_IPHONE
#elif TARGET_OS_MAC
    return @[
        NSWorkspaceScreensDidSleepNotification,
        NSWorkspaceScreensDidWakeNotification
    ];
#endif

    // Fall-through
    return nil;
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
#endif
    
    // Fall-through
    return nil;
}

- (NSArray<NSString *> *)automaticBreadcrumbTableItemEvents {
#if TARGET_IPHONE_SIMULATOR || TARGET_OS_IPHONE || TARGET_OS_TV
    return @[ UITableViewSelectionDidChangeNotification ];
#elif TARGET_OS_MAC
    return @[ NSTableViewSelectionDidChangeNotification ];
#endif

    // Fall-through
    return nil;
}

- (NSArray<NSString *> *)automaticBreadcrumbMenuItemEvents {
#if TARGET_OS_TV
    return @[];
#elif TARGET_IPHONE_SIMULATOR || TARGET_OS_IPHONE
    return nil;
#elif TARGET_OS_MAC
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
#if TARGET_OS_TV
#elif TARGET_IPHONE_SIMULATOR || TARGET_OS_IPHONE
#elif TARGET_OS_MAC
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
#if TARGET_IPHONE_SIMULATOR || TARGET_OS_IPHONE || TARGET_OS_TV
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
#elif TARGET_OS_MAC
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
#if TARGET_OS_TV
#elif TARGET_IPHONE_SIMULATOR || TARGET_OS_IPHONE
#elif TARGET_OS_MAC
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
#if TARGET_OS_TV
#elif TARGET_IPHONE_SIMULATOR || TARGET_OS_IPHONE
    UIControl *control = note.object;
    [self addBreadcrumbWithBlock:^(BugsnagBreadcrumb *_Nonnull breadcrumb) {
      breadcrumb.type = BSGBreadcrumbTypeUser;
      breadcrumb.message = BSGBreadcrumbNameForNotificationName(note.name);
      NSString *label = control.accessibilityLabel;
      if (label.length > 0) {
          breadcrumb.metadata = @{BSGKeyLabel : label};
      }
    }];
#elif TARGET_OS_MAC
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

// MARK: - methods used by React Native for collecting payload data

- (NSDictionary *)collectAppWithState {
    NSDictionary *systemInfo = [BSG_KSSystemInfo systemInfo];
    BugsnagAppWithState *app = [BugsnagAppWithState appWithDictionary:@{@"system": systemInfo}
                                                               config:self.configuration
                                                         codeBundleId:self.codeBundleId];
    return [app toDict];
}

- (NSDictionary *)collectDeviceWithState {
    NSDictionary *systemInfo = [BSG_KSSystemInfo systemInfo];
    BugsnagDeviceWithState *device = [BugsnagDeviceWithState deviceWithDictionary:@{@"system": systemInfo}];
    [device appendRuntimeInfo:self.extraRuntimeInfo];
    return [device toDictionary];
}

- (NSArray *)collectBreadcrumbs {
    NSMutableArray *crumbs = self.configuration.breadcrumbs.breadcrumbs;
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

- (NSArray *)collectThreads {
    return @[
        // TODO implement
    ];
}

- (void)addRuntimeVersionInfo:(NSString *)info
                      withKey:(NSString *)key {
    [self.sessionTracker addRuntimeVersionInfo:info
                                       withKey:key];
    if (info != nil && key != nil) {
        self.extraRuntimeInfo[key] = info;
    }
}

@end
