//
//  BugsnagConfiguration.h
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

#import <Foundation/Foundation.h>

#import "BSG_KSCrashReportWriter.h"
#import "BugsnagBreadcrumb.h"
#import "BugsnagEvent.h"
#import "BugsnagMetadata.h"
#import "BugsnagPlugin.h"

@class BugsnagBreadcrumbs;
@class BugsnagUser;

/**
 * BugsnagConfiguration error constants
 */
extern NSString * _Nonnull const BSGConfigurationErrorDomain;
typedef NS_ENUM(NSInteger, BSGConfigurationErrorCode) {
    BSGConfigurationErrorInvalidApiKey = 0
};

/**
 *  A configuration block for modifying an error report
 *
 *  @param report The default report
 */
typedef void (^BugsnagOnErrorBlock)(BugsnagEvent *_Nonnull report);

/**
 *  A handler for modifying data before sending it to Bugsnag.
 *
 * onSendBlocks will be invoked on a dedicated
 * background queue, which will be different from the queue where the block was originally added.
 *
 *  @param rawEventData The raw event data written at crash time. This
 *                      includes data added in onError.
 *  @param reports      The report generated from the rawEventData
 *
 *  @return YES if the report should be sent
 */
typedef bool (^BugsnagOnSendBlock)(NSDictionary *_Nonnull rawEventData,
                                       BugsnagEvent *_Nonnull reports);

/**
 * A configuration block for modifying a session. Intended for internal usage only.
 *
 * @param sessionPayload The session about to be delivered
 */
typedef void(^BugsnagOnSessionBlock)(NSMutableDictionary *_Nonnull sessionPayload);

/**
 *  A handler for modifying data before sending it to Bugsnag
 *
 *  @param rawEventReports The raw event data written at crash time. This
 *                         includes data added in onError.
 *  @param report          The default report payload
 *
 *  @return the report payload intended to be sent or nil to cancel sending
 */
typedef NSDictionary *_Nullable (^BugsnagBeforeNotifyHook)(
    NSArray *_Nonnull rawEventReports, NSDictionary *_Nonnull report);

typedef NS_OPTIONS(NSUInteger, BSGErrorType) {
    BSGErrorTypesNone         NS_SWIFT_NAME(None)         = 0,
    BSGErrorTypesOOMs         NS_SWIFT_NAME(OOMs)         = 1 << 0,
    BSGErrorTypesNSExceptions NS_SWIFT_NAME(NSExceptions) = 1 << 1,
    BSGErrorTypesSignals      NS_SWIFT_NAME(Signals)      = 1 << 2,
    BSGErrorTypesCPP          NS_SWIFT_NAME(CPP)          = 1 << 3,
    BSGErrorTypesMach         NS_SWIFT_NAME(Mach)         = 1 << 4
};

@interface BugsnagConfiguration : NSObject

// -----------------------------------------------------------------------------
// MARK: - Properties
// -----------------------------------------------------------------------------

/**
 *  The API key of a Bugsnag project
 */
@property(readwrite, retain, nonnull) NSString *apiKey;
/**
 *  The release stage of the application, such as production, development, beta
 *  et cetera
 */
@property(readwrite, retain, nullable) NSString *releaseStage;
/**
 *  Release stages which are allowed to notify Bugsnag
 */
@property(readwrite, retain, nullable) NSArray *notifyReleaseStages;
/**
 *  A general summary of what was occuring in the application
 */
@property(readwrite, retain, nullable) NSString *context;
/**
 *  The version of the application
 */
@property(readwrite, retain, nullable) NSString *appVersion;

/**
 *  The URL session used to send requests to Bugsnag.
 */
@property(readwrite, strong, nonnull) NSURLSession *session;

/**
 * The current user
 */
@property(retain, nullable) BugsnagUser *currentUser;

/**
 *  Additional information about the state of the app or environment at the
 *  time the report was generated
 */
@property(readwrite, retain, nullable) BugsnagMetadata *metadata;
/**
 *  Meta-information about the state of Bugsnag
 */
@property(readwrite, retain, nullable) BugsnagMetadata *config;
/**
 *  Rolling snapshots of user actions leading up to a crash report
 */
@property(readonly, strong, nullable)
BugsnagBreadcrumbs *breadcrumbs;

/**
 *  Hooks for modifying crash reports before it is sent to Bugsnag
 */
@property(readonly, strong, nullable)
    NSArray<BugsnagOnSendBlock> *onSendBlocks;

/**
 *  Hooks for modifying sessions before they are sent to Bugsnag. Intended for internal use only by React Native/Unity.
 */
@property(readonly, strong, nullable)
NSArray<BugsnagOnSessionBlock> *onSessionBlocks;

/**
 *  Optional handler invoked when an error or crash occurs
 */
@property void (*_Nullable onError)
    (const BSG_KSCrashReportWriter *_Nonnull writer);

/**
 *  YES if uncaught exceptions and other crashes should be reported automatically
 */
@property BOOL autoDetectErrors;

/**
 * Determines whether app sessions should be tracked automatically. By default this value is true.
 * If this value is updated after +[Bugsnag start] is called, only subsequent automatic sessions
 * will be captured.
 */
@property BOOL autoTrackSessions;

/**
 * Whether the app should report out of memory events which terminate the app
 * while the app is in the background. Setting this property has no effect.
 */
@property BOOL reportBackgroundOOMs
    __deprecated_msg("This detection option is unreliable and should no longer be used.");

/**
 * The types of breadcrumbs which will be captured. By default, this is all types.
 */
@property BSGEnabledBreadcrumbType enabledBreadcrumbTypes;

/**
 * Retrieves the endpoint used to notify Bugsnag of errors
 *
 * NOTE: If you want to set this value, you should do so via setEndpointsForNotify:sessions: instead.
 *
 * @see setEndpointsForNotify:sessions:
 */
@property(readonly, retain, nullable) NSURL *notifyURL;

/**
 * Retrieves the endpoint used to send tracked sessions to Bugsnag
 *
 * NOTE: If you want to set this value, you should do so via setEndpointsForNotify:sessions: instead.
 *
 * @see setEndpointsForNotify:sessions:
 */
@property(readonly, retain, nullable) NSURL *sessionURL;

@property(retain, nullable) NSString *codeBundleId;
@property(retain, nullable) NSString *notifierType;

/**
 * The maximum number of breadcrumbs to keep and sent to Bugsnag.
 * By default, we'll keep and send the 25 most recent breadcrumb log
 * messages.
 */
@property NSUInteger maxBreadcrumbs;

/**
 * Determines whether app sessions should be tracked automatically. By default this value is true.
 * If this value is updated after +[Bugsnag start] is called, only subsequent automatic sessions
 * will be captured.
 */
@property BOOL shouldAutoCaptureSessions __deprecated_msg("Use autoTrackSessions instead");

/**
 *  YES if uncaught exceptions should be reported automatically
 */
@property BOOL autoNotify __deprecated_msg("Use autoDetectErrors instead");

/**
 * Whether User information should be persisted to disk between application runs.
 * Defaults to True.
 */
@property BOOL persistUser;

// -----------------------------------------------------------------------------
// MARK: - Methods
// -----------------------------------------------------------------------------

/**
 * A bitfield defining the types of error that are reported.
 * Passed down to KSCrash in BugsnagCrashSentry.
 * Defaults to all-true
 */
@property BSGErrorType enabledErrorTypes;

/**
 * Required declaration to suppress a superclass designated-initializer error
 */
- (instancetype _Nonnull )init NS_UNAVAILABLE NS_SWIFT_UNAVAILABLE("Use initWithApiKey:");

/**
 * The designated initializer.
 */
- (instancetype _Nullable)initWithApiKey:(NSString *_Nonnull)apiKey
                                   error:(NSError *_Nullable *_Nullable)error
    NS_DESIGNATED_INITIALIZER
    NS_SWIFT_NAME(init(_:)) __attribute__((swift_error(nonnull_error)));

/**
 * Set the endpoints to send data to. By default we'll send error reports to
 * https://notify.bugsnag.com, and sessions to https://sessions.bugsnag.com, but you can
 * override this if you are using Bugsnag Enterprise to point to your own Bugsnag endpoint.
 *
 * Please note that it is recommended that you set both endpoints. If the notify endpoint is
 * missing, an assertion will be thrown. If the session endpoint is missing, a warning will be
 * logged and sessions will not be sent automatically.
 *
 * @param notify the notify endpoint
 * @param sessions the sessions endpoint
 *
 * @throws an assertion if the notify endpoint is not a valid URL
 */

- (void)setEndpointsForNotify:(NSString *_Nonnull)notify
                     sessions:(NSString *_Nonnull)sessions NS_SWIFT_NAME(setEndpoints(notify:sessions:));

/**
 *  Set user metadata
 *
 *  @param userId ID of the user
 *  @param name   Name of the user
 *  @param email  Email address of the user
 */
- (void)setUser:(NSString *_Nullable)userId
       withName:(NSString *_Nullable)name
       andEmail:(NSString *_Nullable)email;

/**
 *  Add a callback to be invoked before a report is sent to Bugsnag, to
 *  change the report contents as needed
 *
 *  @param block A block which returns YES if the report should be sent
 */
- (void)addOnSendBlock:(BugsnagOnSendBlock _Nonnull)block;

/**
 *  Add a callback to be invoked before a session is sent to Bugsnag.
 *
 *  @param block A block which can modify the session
 */
- (void)addOnSessionBlock:(BugsnagOnSessionBlock _Nonnull)block;

/**
 * Remove a callback that would be invoked before a session is sent to Bugsnag.
 *
 * @param block The block to be removed.
 */
- (void)removeOnSessionBlock:(BugsnagOnSessionBlock _Nonnull )block;

/**
 * Clear all callbacks
 */
- (void)clearOnSendBlocks;

/**
 *  Whether reports shoould be sent, based on release stage options
 *
 *  @return YES if reports should be sent based on this configuration
 */
- (BOOL)shouldSendReports;

- (NSDictionary *_Nonnull)errorApiHeaders;
- (NSDictionary *_Nonnull)sessionApiHeaders;

- (void)addPlugin:(id<BugsnagPlugin> _Nonnull)plugin;

@end
