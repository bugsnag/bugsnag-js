//
//  BugsnagSessionTracker.m
//  Bugsnag
//
//  Created by Jamie Lynch on 24/11/2017.
//  Copyright © 2017 Bugsnag. All rights reserved.
//

#import "BugsnagSessionTracker.h"

#import "BSGSessionUploader.h"
#import "BSG_KSSystemInfo.h"
#import "BugsnagApp+Private.h"
#import "BugsnagClient+Private.h"
#import "BugsnagCollections.h"
#import "BugsnagConfiguration+Private.h"
#import "BugsnagDevice+Private.h"
#import "BugsnagLogger.h"
#import "BugsnagSession+Private.h"
#import "BSGDefines.h"
#import "BSGAppKit.h"
#import "BSGWatchKit.h"
#import "BSGUIKit.h"

/**
 Number of seconds in background required to make a new session
 */
static NSTimeInterval const BSGNewSessionBackgroundDuration = 30;

@interface BugsnagSessionTracker ()
@property (strong, nonatomic) BugsnagConfiguration *config;
@property (weak, nonatomic) BugsnagClient *client;
@property (strong, nonatomic) BSGSessionUploader *sessionUploader;
@property (strong, nonatomic) NSDate *backgroundStartTime;
@property (nonatomic) NSMutableDictionary *extraRuntimeInfo;
@end

@implementation BugsnagSessionTracker

- (instancetype)initWithConfig:(BugsnagConfiguration *)config client:(BugsnagClient *)client {
    if ((self = [super init])) {
        _config = config;
        _client = client;
        _sessionUploader = [[BSGSessionUploader alloc] initWithConfig:config notifier:client.notifier];
        _extraRuntimeInfo = [NSMutableDictionary new];
    }
    return self;
}

- (void)startWithNotificationCenter:(NSNotificationCenter *)notificationCenter isInForeground:(BOOL)isInForeground {
#if !TARGET_OS_WATCH
    if ([BSG_KSSystemInfo isRunningInAppExtension]) {
        // UIApplication lifecycle notifications and UIApplicationState, which the automatic session tracking logic
        // depends on, are not available in app extensions.
        if (self.config.autoTrackSessions) {
            bsg_log_info(@"Automatic session tracking is not supported in app extensions");
        }
        return;
    }
#endif
    
    if (isInForeground) {
        [self startNewSessionIfAutoCaptureEnabled];
    } else {
        bsg_log_debug(@"Not starting session because app is not in the foreground");
    }

#if BSG_HAVE_APPKIT
    [notificationCenter addObserver:self
               selector:@selector(handleAppForegroundEvent)
                   name:NSApplicationWillBecomeActiveNotification
                 object:nil];

    [notificationCenter addObserver:self
               selector:@selector(handleAppForegroundEvent)
                   name:NSApplicationDidBecomeActiveNotification
                 object:nil];

    [notificationCenter addObserver:self
               selector:@selector(handleAppBackgroundEvent)
                   name:NSApplicationDidResignActiveNotification
                 object:nil];
#elif BSG_HAVE_WATCHKIT
    [notificationCenter addObserver:self
               selector:@selector(handleAppForegroundEvent)
                   name:WKApplicationWillEnterForegroundNotification
                 object:nil];

    [notificationCenter addObserver:self
               selector:@selector(handleAppForegroundEvent)
                   name:WKApplicationDidBecomeActiveNotification
                 object:nil];

    [notificationCenter addObserver:self
               selector:@selector(handleAppBackgroundEvent)
                   name:WKApplicationDidEnterBackgroundNotification
                 object:nil];
#else
    [notificationCenter addObserver:self
               selector:@selector(handleAppForegroundEvent)
                   name:UIApplicationWillEnterForegroundNotification
                 object:nil];

    [notificationCenter addObserver:self
               selector:@selector(handleAppForegroundEvent)
                   name:UIApplicationDidBecomeActiveNotification
                 object:nil];

    [notificationCenter addObserver:self
               selector:@selector(handleAppBackgroundEvent)
                   name:UIApplicationDidEnterBackgroundNotification
                 object:nil];
#endif
}

- (void)setCodeBundleId:(NSString *)codeBundleId {
    _codeBundleId = codeBundleId;
    self.sessionUploader.codeBundleId = codeBundleId;
}

#pragma mark - Creating and sending a new session

- (void)pauseSession {
    self.currentSession.stopped = YES;

    BSGSessionUpdateRunContext(nil);
}

- (BOOL)resumeSession {
    BugsnagSession *session = self.currentSession;

    if (session == nil) {
        [self startNewSession];
        return NO;
    } else {
        BOOL stopped = session.isStopped;
        session.stopped = NO;
        BSGSessionUpdateRunContext(session);
        return stopped;
    }
}

- (BugsnagSession *)runningSession {
    BugsnagSession *session = self.currentSession;

    if (session == nil || session.isStopped) {
        return nil;
    }
    return session;
}

- (void)startNewSessionIfAutoCaptureEnabled {
    if (self.config.autoTrackSessions) {
        [self startNewSession];
    }
}

- (void)startNewSession {
    NSSet<NSString *> *releaseStages = self.config.enabledReleaseStages;
    if (releaseStages != nil && ![releaseStages containsObject:self.config.releaseStage ?: @""]) {
        return;
    }
    if (self.config.sessionURL == nil) {
        bsg_log_err(@"The session tracking endpoint has not been set. Session tracking is disabled");
        return;
    }

    NSDictionary *systemInfo = [BSG_KSSystemInfo systemInfo];
    BugsnagApp *app = [BugsnagApp appWithDictionary:@{@"system": systemInfo}
                                             config:self.config
                                       codeBundleId:self.codeBundleId];
    BugsnagDevice *device = [BugsnagDevice deviceWithKSCrashReport:@{@"system": systemInfo}];
    [device appendRuntimeInfo:self.extraRuntimeInfo];

    BugsnagSession *newSession = [[BugsnagSession alloc] initWithId:[[NSUUID UUID] UUIDString]
                                                          startedAt:[NSDate date]
                                                               user:self.client.user
                                                                app:app
                                                             device:device];

    for (BugsnagOnSessionBlock onSessionBlock in self.config.onSessionBlocks) {
        @try {
            if (!onSessionBlock(newSession)) {
                return;
            }
        } @catch (NSException *exception) {
            bsg_log_err(@"Error from onSession callback: %@", exception);
        }
    }

    self.currentSession = newSession;

    BSGSessionUpdateRunContext(newSession);

    [self.sessionUploader uploadSession:newSession];
}

- (void)addRuntimeVersionInfo:(NSString *)info
                      withKey:(NSString *)key {
    if (info != nil && key != nil) {
        self.extraRuntimeInfo[key] = info;
    }
}

- (void)registerExistingSession:(NSString *)sessionId
                      startedAt:(NSDate *)startedAt
                           user:(BugsnagUser *)user
                   handledCount:(NSUInteger)handledCount
                 unhandledCount:(NSUInteger)unhandledCount {
    if (sessionId == nil || startedAt == nil) {
        self.currentSession = nil;
    } else {
        self.currentSession = [[BugsnagSession alloc] initWithId:sessionId
                                                       startedAt:startedAt
                                                            user:user
                                                             app:[BugsnagApp new]
                                                          device:[BugsnagDevice new]];
        self.currentSession.handledCount = handledCount;
        self.currentSession.unhandledCount = unhandledCount;
    }
    BSGSessionUpdateRunContext(self.currentSession);
}

#pragma mark - Handling events

- (void)handleAppBackgroundEvent {
    self.backgroundStartTime = [NSDate date];
}

- (void)handleAppForegroundEvent {
    if (!self.currentSession ||
        (self.backgroundStartTime && [[NSDate date] timeIntervalSinceDate:self.backgroundStartTime] >= BSGNewSessionBackgroundDuration)) {
        [self startNewSessionIfAutoCaptureEnabled];
    }
    self.backgroundStartTime = nil;
}

- (void)incrementEventCountUnhandled:(BOOL)unhandled {
    BugsnagSession *session = [self runningSession];

    if (session == nil) {
        return;
    }

    @synchronized (session) {
        if (unhandled) {
            session.unhandledCount++;
        } else {
            session.handledCount++;
        }
        BSGSessionUpdateRunContext(session);
    }
}

@end
