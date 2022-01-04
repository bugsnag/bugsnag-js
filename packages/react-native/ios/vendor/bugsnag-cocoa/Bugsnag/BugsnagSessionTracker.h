//
//  BugsnagSessionTracker.h
//  Bugsnag
//
//  Created by Jamie Lynch on 24/11/2017.
//  Copyright © 2017 Bugsnag. All rights reserved.
//

#import <Foundation/Foundation.h>

#import <Bugsnag/BugsnagConfiguration.h>
#import <Bugsnag/BugsnagSession.h>

NS_ASSUME_NONNULL_BEGIN

@class BSGSessionUploader;

typedef void (^SessionTrackerCallback)(BugsnagSession *_Nullable newSession);

extern NSString *const BSGSessionUpdateNotification;

@interface BugsnagSessionTracker : NSObject

/**
 Create a new session tracker

 @param config The Bugsnag configuration to use
 @param callback A callback invoked each time a new session is started
 @return A new session tracker
 */
- (instancetype)initWithConfig:(BugsnagConfiguration *)config
                        client:(nullable BugsnagClient *)client
            postRecordCallback:(nullable void(^)(BugsnagSession *))callback;

- (void)startWithNotificationCenter:(NSNotificationCenter *)notificationCenter isInForeground:(BOOL)isInForeground;

/**
 Record and send a new session
 */
- (void)startNewSession;

- (void)pauseSession;
- (BOOL)resumeSession;

/**
 Record a new auto-captured session if neededed. Auto-captured sessions are only
 recorded and sent if -[BugsnagConfiguration autoTrackSessions] is YES
 */
- (void)startNewSessionIfAutoCaptureEnabled;

/**
 Update the details of the current session to account for externally reported
 session information. Current session details are included in subsequent crash
 reports.
 */
- (void)registerExistingSession:(NSString *)sessionId
                      startedAt:(NSDate *)startedAt
                           user:(BugsnagUser *)user
                   handledCount:(NSUInteger)handledCount
                 unhandledCount:(NSUInteger)unhandledCount;

/**
 Handle the app foregrounding event. If more than 30s has elapsed since being
 sent to the background, records a new session if session auto-capture is
 enabled.
 Must be called from the main thread.
 */
- (void)handleAppForegroundEvent;

/**
 Handle the app backgrounding event. Tracks time between foreground and
 background to determine when to automatically record a session.
 Must be called from the main thread.
 */
- (void)handleAppBackgroundEvent;

/**
 Handle some variation of Bugsnag.notify() being called.
 Increments the number of handled or unhandled errors recorded for the current session, if
 a session exists.
 */
- (void)incrementEventCountUnhandled:(BOOL)unhandled;

@property (copy, nonatomic) NSString *codeBundleId;

@property (nullable, nonatomic) BugsnagSession *currentSession;

/**
 * Retrieves the running session, or nil if the session is stopped or has not yet been started/resumed.
 */
@property (nullable, readonly, nonatomic) BugsnagSession *runningSession;

- (void)addRuntimeVersionInfo:(NSString *)info
                      withKey:(NSString *)key;

@end

NS_ASSUME_NONNULL_END
