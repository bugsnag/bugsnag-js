//
//  BugsnagSessionTracker.m
//  Bugsnag
//
//  Created by Jamie Lynch on 24/11/2017.
//  Copyright © 2017 Bugsnag. All rights reserved.
//

#import "BugsnagSessionTracker.h"
#import "BugsnagSessionFileStore.h"
#import "BSG_KSLogger.h"
#import "BugsnagSessionTrackingPayload.h"
#import "BugsnagSessionTrackingApiClient.h"
#import "BugsnagLogger.h"
#import "BugsnagSessionInternal.h"
#import "BSG_KSSystemInfo.h"
#import "BugsnagCollections.h"

/**
 Number of seconds in background required to make a new session
 */
NSTimeInterval const BSGNewSessionBackgroundDuration = 30;

NSString *const BSGSessionUpdateNotification = @"BugsnagSessionChanged";

@interface BugsnagSession ()

@property(readwrite, getter=isStopped) BOOL stopped;
@property NSUInteger unhandledCount;
@property NSUInteger handledCount;
- (NSDictionary *_Nonnull)toDictionary;
- (void)stop;
- (void)resume;
@end

@interface BugsnagConfiguration ()
@property(readonly, retain, nullable) NSURL *sessionURL;
@property(nonatomic, readwrite, strong) NSMutableArray *onSessionBlocks;
@end

@interface BugsnagApp ()
+ (BugsnagApp *)appWithDictionary:(NSDictionary *)event
                           config:(BugsnagConfiguration *)config
                     codeBundleId:(NSString *)codeBundleId;
@end

@interface BugsnagDevice ()
+ (BugsnagDevice *)deviceWithDictionary:(NSDictionary *)event;
- (void)appendRuntimeInfo:(NSDictionary *)info;
@end

@interface BugsnagSessionTrackingApiClient ()
@property (nonatomic) NSString *codeBundleId;
@end

@interface BugsnagSessionTracker ()
@property (weak, nonatomic) BugsnagConfiguration *config;
@property (strong, nonatomic) BugsnagSessionFileStore *sessionStore;
@property (strong, nonatomic) BugsnagSessionTrackingApiClient *apiClient;
@property (strong, nonatomic) NSDate *backgroundStartTime;
@property (nonatomic) NSString *codeBundleId;
@property (strong, readwrite) BugsnagSession *currentSession;

/**
 * Called when a session is altered
 */
@property (nonatomic, strong, readonly) SessionTrackerCallback callback;

@property NSMutableDictionary *extraRuntimeInfo;
@end

@implementation BugsnagSessionTracker

- (instancetype)initWithConfig:(BugsnagConfiguration *)config
            postRecordCallback:(void(^)(BugsnagSession *))callback {
    if (self = [super init]) {
        _config = config;
        _apiClient = [[BugsnagSessionTrackingApiClient alloc] initWithConfig:config queueName:@"Session API queue"];
        _callback = callback;

        NSString *storePath = [BugsnagFileStore findReportStorePath:@"Sessions"];
        if (!storePath) {
            BSG_KSLOG_ERROR(@"Failed to initialize session store.");
        }
        _sessionStore = [BugsnagSessionFileStore storeWithPath:storePath];
        _extraRuntimeInfo = [NSMutableDictionary new];
    }
    return self;
}

- (void)setCodeBundleId:(NSString *)codeBundleId {
    _codeBundleId = codeBundleId;
    _apiClient.codeBundleId = codeBundleId;
}

#pragma mark - Creating and sending a new session

- (void)startNewSession {
    [self startNewSessionWithAutoCaptureValue:NO];
}

- (void)pauseSession {
    [[self currentSession] stop];

    if (self.callback) {
        self.callback(nil);
    }
    [self postUpdateNotice];
}

- (BOOL)resumeSession {
    BugsnagSession *session = self.currentSession;

    if (session == nil) {
        [self startNewSessionWithAutoCaptureValue:NO];
        return NO;
    } else {
        BOOL stopped = session.isStopped;
        [session resume];
        [self postUpdateNotice];
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
        [self startNewSessionWithAutoCaptureValue:YES];
    }
}

- (void)startNewSessionWithAutoCaptureValue:(BOOL)isAutoCaptured {
    if (self.config.sessionURL == nil) {
        bsg_log_err(@"The session tracking endpoint has not been set. Session tracking is disabled");
        return;
    }

    NSDictionary *systemInfo = [BSG_KSSystemInfo systemInfo];
    BugsnagApp *app = [BugsnagApp appWithDictionary:@{@"system": systemInfo} config:self.config codeBundleId:self.codeBundleId];
    BugsnagDevice *device = [BugsnagDevice deviceWithDictionary:@{@"system": systemInfo}];
    [device appendRuntimeInfo:self.extraRuntimeInfo];

    BugsnagSession *newSession = [[BugsnagSession alloc] initWithId:[[NSUUID UUID] UUIDString]
                                                          startDate:[NSDate date]
                                                               user:self.config.user
                                                       autoCaptured:isAutoCaptured
                                                                app:app
                                                             device:device];

    for (BugsnagOnSessionBlock onSessionBlock in self.config.onSessionBlocks) {
        if (!onSessionBlock(newSession)) {
            return;
        }
    }
    self.currentSession = newSession;
    [self.sessionStore write:self.currentSession];

    if (self.callback) {
        self.callback(self.currentSession);
    }
    [self postUpdateNotice];

    [self.apiClient deliverSessionsInStore:self.sessionStore];
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
                                                       startDate:startedAt
                                                            user:user
                                                    handledCount:handledCount
                                                  unhandledCount:unhandledCount
                                                             app:[BugsnagApp new]
                                                          device:[BugsnagDevice new]];
    }
    if (self.callback) {
        self.callback(self.currentSession);
    }
    [self postUpdateNotice];
}

- (void)postUpdateNotice {
    [[NSNotificationCenter defaultCenter] postNotificationName:BSGSessionUpdateNotification
                                                        object:[self.runningSession toDictionary]];
}

#pragma mark - Handling events

- (void)handleAppBackgroundEvent {
    self.backgroundStartTime = [NSDate date];
}

- (void)handleAppForegroundEvent {
    if (self.backgroundStartTime
        && [[NSDate date] timeIntervalSinceDate:self.backgroundStartTime] >= BSGNewSessionBackgroundDuration) {
        [self startNewSessionIfAutoCaptureEnabled];
    }
    self.backgroundStartTime = nil;
}

- (void)handleHandledErrorEvent {
    BugsnagSession *session = [self runningSession];

    if (session == nil) {
        return;
    }

    @synchronized (session) {
        session.handledCount++;
        if (self.callback) {
            self.callback(session);
        }
        [self postUpdateNotice];
    }
}

- (void)handleUnhandledErrorEvent {
    BugsnagSession *session = [self runningSession];

    if (session == nil) {
        return;
    }

    @synchronized (session) {
        session.unhandledCount++;
        if (self.callback) {
            self.callback(session);
        }
        [self postUpdateNotice];
    }
}

@end
