//
//  BugsnagSession+Private.h
//  Bugsnag
//
//  Created by Nick Dowell on 23/11/2020.
//  Copyright © 2020 Bugsnag Inc. All rights reserved.
//

#import <Bugsnag/BugsnagSession.h>

#import "BSGDefines.h"
#import "BSG_KSCrashReportWriter.h"

NS_ASSUME_NONNULL_BEGIN

@class BugsnagUser;

@interface BugsnagSession () <NSCopying>

#pragma mark Initializers

- (instancetype)initWithId:(NSString *)sessionId
                 startedAt:(NSDate *)startedAt
                      user:(BugsnagUser *)user
                       app:(BugsnagApp *)app
                    device:(BugsnagDevice *)device;

#pragma mark Properties

@property (nonatomic) NSUInteger handledCount;

@property (getter=isStopped, nonatomic) BOOL stopped;

@property (nonatomic) NSUInteger unhandledCount;

@property (readwrite, nonnull, nonatomic) BugsnagUser *user;

@end

#pragma mark Serialization

/// Produces a session dictionary that contains all the information to fully recreate it via BSGSessionFromDictionary().
NSDictionary * BSGSessionToDictionary(BugsnagSession *session);

/// Parses a session dictionary produced by BSGSessionToDictionary() or added to a KSCrashReport by BSSerializeDataCrashHandler().
BugsnagSession *_Nullable BSGSessionFromDictionary(NSDictionary *_Nullable json);

/// Produces a session dictionary suitable for inclusion in an event's JSON representation.
NSDictionary * BSGSessionToEventJson(BugsnagSession *session);

/// Parses a session dictionary from an event's JSON representation.
BugsnagSession *_Nullable BSGSessionFromEventJson(NSDictionary *_Nullable json, BugsnagApp *app, BugsnagDevice *device, BugsnagUser *user);

/// Saves the session info into bsg_runContext.
BSG_PRIVATE void BSGSessionUpdateRunContext(BugsnagSession *_Nullable session);

/// Returns session information from bsg_lastRunContext.
BSG_PRIVATE BugsnagSession *_Nullable BSGSessionFromLastRunContext(BugsnagApp *app, BugsnagDevice *device, BugsnagUser *user);

/// Saves current session information (from bsg_runContext) into a crash report.
BSG_PRIVATE void BSGSessionWriteCrashReport(const BSG_KSCrashReportWriter *writer);

/// Returns session information from a crash report previously written to by BSGSessionWriteCrashReport or BSSerializeDataCrashHandler.
BSG_PRIVATE BugsnagSession *_Nullable BSGSessionFromCrashReport(NSDictionary *report, BugsnagApp *app, BugsnagDevice *device, BugsnagUser *user);

NS_ASSUME_NONNULL_END
