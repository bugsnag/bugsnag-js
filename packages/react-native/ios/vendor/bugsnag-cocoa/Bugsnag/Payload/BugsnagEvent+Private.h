//
//  BugsnagEvent+Private.h
//  Bugsnag
//
//  Created by Nick Dowell on 23/11/2020.
//  Copyright © 2020 Bugsnag Inc. All rights reserved.
//

#import <Bugsnag/BugsnagEvent.h>

NS_ASSUME_NONNULL_BEGIN

@interface BugsnagEvent ()

@property (copy, nonatomic) NSString *codeBundleId;

/// User-provided exception metadata.
@property (readwrite, copy, nullable, nonatomic) NSDictionary *customException;

/// Number of frames to discard at the top of the generated stacktrace. Stacktraces from raised exceptions are unaffected.
@property NSUInteger depth;

/// A unique hash identifying this device for the application or vendor.
@property (readwrite, copy, nullable, nonatomic) NSString *deviceAppHash;

/// The release stages used to notify at the time this report is captured.
@property (readwrite, copy, nullable) NSArray *enabledReleaseStages;

/// Raw error data added to metadata.
@property (readwrite, copy, nullable) NSDictionary *error;

/// The event state (whether the error is handled/unhandled.)
@property (readonly) BugsnagHandledState *handledState;

@property (strong, nonatomic) BugsnagMetadata *metadata;

/// Property overrides.
@property (readonly, nonatomic) NSDictionary *overrides;

@property NSSet<id> *redactedKeys;

/// The release stage of the application
@property (readwrite, copy, nullable) NSString *releaseStage;

@property (strong, nullable, nonatomic) BugsnagSession *session;

/// An array of string representations of BSGErrorType describing the types of stackframe / stacktrace in this error.
@property (readonly, nonatomic) NSArray<NSString *> *stacktraceTypes;

- (instancetype)initWithApp:(nullable BugsnagAppWithState *)app
                     device:(nullable BugsnagDeviceWithState *)device
               handledState:(BugsnagHandledState *)handledState
                       user:(nullable BugsnagUser *)user
                   metadata:(nullable BugsnagMetadata *)metadata
                breadcrumbs:(NSArray<BugsnagBreadcrumb *> *)breadcrumbs
                     errors:(NSArray<BugsnagError *> *)errors
                    threads:(NSArray<BugsnagThread *> *)threads
                    session:(nullable BugsnagSession *)session;

- (instancetype)initWithKSReport:(NSDictionary *)KSReport;

- (instancetype)initWithUserData:(NSDictionary *)event;

/// Whether this report should be sent, based on release stage information cached at crash time and within the application currently.
- (BOOL)shouldBeSent;

- (void)setOverrideProperty:(NSString *)key value:(id)value;

- (NSDictionary *)toJson;

- (void)notifyUnhandledOverridden;

@end

NS_ASSUME_NONNULL_END
