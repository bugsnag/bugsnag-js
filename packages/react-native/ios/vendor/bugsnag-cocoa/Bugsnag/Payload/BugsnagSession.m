//
//  BugsnagSession.m
//  Bugsnag
//
//  Created by Jamie Lynch on 24/11/2017.
//  Copyright © 2017 Bugsnag. All rights reserved.
//

#import "BugsnagSession+Private.h"

#import "BSGKeys.h"
#import "BSGRunContext.h"
#import "BSG_RFC3339DateTool.h"
#import "BugsnagApp+Private.h"
#import "BugsnagDevice+Private.h"
#import "BugsnagUser+Private.h"

@implementation BugsnagSession

- (instancetype)initWithId:(NSString *)sessionId
                 startedAt:(NSDate *)startedAt
                      user:(BugsnagUser *)user
                       app:(BugsnagApp *)app
                    device:(BugsnagDevice *)device {
    if ((self = [super init])) {
        _id = [sessionId copy];
        _startedAt = startedAt;
        _user = user;
        _app = app;
        _device = device;
    }
    return self;
}

- (instancetype)copyWithZone:(NSZone *)zone {
    BugsnagSession *session = [[[self class] allocWithZone:zone]
                               initWithId:self.id
                               startedAt:self.startedAt
                               user:self.user
                               app:self.app
                               device:self.device];
    session.handledCount = self.handledCount;
    session.unhandledCount = self.unhandledCount;
    return session;
}

- (void)setUser:(NSString *_Nullable)userId
      withEmail:(NSString *_Nullable)email
        andName:(NSString *_Nullable)name {
    self.user = [[BugsnagUser alloc] initWithUserId:userId name:name emailAddress:email];
}

@end

#pragma mark - Serialization

NSDictionary * BSGSessionToDictionary(BugsnagSession *session) {
    return @{
        BSGKeyApp: [session.app toDict] ?: @{},
        BSGKeyDevice: [session.device toDictionary] ?: @{},
        BSGKeyHandledCount: @(session.handledCount),
        BSGKeyId: session.id,
        BSGKeyStartedAt: [BSG_RFC3339DateTool stringFromDate:session.startedAt] ?: [NSNull null],
        BSGKeyUnhandledCount: @(session.unhandledCount),
        BSGKeyUser: [session.user toJson] ?: @{}
    };
}

BugsnagSession *_Nullable BSGSessionFromDictionary(NSDictionary *json) {
    NSString *sessionId = json[BSGKeyId];
    NSDate *startedAt = [BSG_RFC3339DateTool dateFromString:json[BSGKeyStartedAt]];
    if (!sessionId || !startedAt) {
        return nil;
    }
    BugsnagApp *app = [BugsnagApp deserializeFromJson:json[BSGKeyApp]];
    BugsnagDevice *device = [BugsnagDevice deserializeFromJson:json[BSGKeyDevice]];
    BugsnagUser *user = [[BugsnagUser alloc] initWithDictionary:json[BSGKeyUser]];
    BugsnagSession *session = [[BugsnagSession alloc] initWithId:sessionId startedAt:startedAt user:user app:app device:device];
    session.handledCount = [json[BSGKeyHandledCount] unsignedIntegerValue];
    session.unhandledCount = [json[BSGKeyUnhandledCount] unsignedIntegerValue];
    return session;
}

NSDictionary * BSGSessionToEventJson(BugsnagSession *session) {
    return @{
        BSGKeyEvents: @{
            BSGKeyHandled: @(session.handledCount),
            BSGKeyUnhandled: @(session.unhandledCount)
        },
        BSGKeyId: session.id,
        BSGKeyStartedAt: [BSG_RFC3339DateTool stringFromDate:session.startedAt] ?: [NSNull null]
    };
}

BugsnagSession * BSGSessionFromEventJson(NSDictionary *_Nullable json, BugsnagApp *app, BugsnagDevice *device, BugsnagUser *user) {
    NSString *sessionId = json[BSGKeyId];
    NSDate *startedAt = [BSG_RFC3339DateTool dateFromString:json[BSGKeyStartedAt]];
    if (!sessionId || !startedAt) {
        return nil;
    }
    BugsnagSession *session = [[BugsnagSession alloc] initWithId:sessionId startedAt:startedAt user:user app:app device:device];
    NSDictionary *events = json[BSGKeyEvents];
    session.handledCount = [events[BSGKeyHandled] unsignedIntegerValue];
    session.unhandledCount = [events[BSGKeyUnhandled] unsignedIntegerValue];
    return session;
}

void BSGSessionUpdateRunContext(BugsnagSession *_Nullable session) {
    if (session) {
        [session.id getCString:bsg_runContext->sessionId maxLength:sizeof(bsg_runContext->sessionId) encoding:NSUTF8StringEncoding];
        bsg_runContext->sessionStartTime = session.startedAt.timeIntervalSinceReferenceDate;
        bsg_runContext->handledCount = session.handledCount;
        bsg_runContext->unhandledCount = session.unhandledCount;
    } else {
        bzero(bsg_runContext->sessionId, sizeof(bsg_runContext->sessionId));
        bsg_runContext->sessionStartTime = 0;
    }
    BSGRunContextUpdateTimestamp();
}

BugsnagSession * BSGSessionFromLastRunContext(BugsnagApp *app, BugsnagDevice *device, BugsnagUser *user) {
    if (bsg_lastRunContext && bsg_lastRunContext->sessionId[0] && bsg_lastRunContext->sessionStartTime > 0) {
        NSString *sessionId = @(bsg_lastRunContext->sessionId);
        NSDate *startedAt = [NSDate dateWithTimeIntervalSinceReferenceDate:bsg_lastRunContext->sessionStartTime];
        BugsnagSession *session = [[BugsnagSession alloc] initWithId:sessionId startedAt:startedAt user:user app:app device:device];
        session.handledCount = bsg_lastRunContext->handledCount;
        session.unhandledCount = bsg_lastRunContext->unhandledCount;
        return session;
    } else {
        return nil;
    }
}

void BSGSessionWriteCrashReport(const BSG_KSCrashReportWriter *writer) {
    if (bsg_runContext->sessionId[0] && bsg_runContext->sessionStartTime > 0) {
        writer->addStringElement(writer, "id", bsg_runContext->sessionId);
        writer->addFloatingPointElement(writer, "startedAt", bsg_runContext->sessionStartTime);
        writer->addUIntegerElement(writer, "handledCount", bsg_runContext->handledCount);
        writer->addUIntegerElement(writer, "unhandledCount", bsg_runContext->unhandledCount + 1);
    }
}

BugsnagSession * BSGSessionFromCrashReport(NSDictionary *report, BugsnagApp *app, BugsnagDevice *device, BugsnagUser *user) {
    NSDictionary *json = report[BSGKeyUser];
    NSString *sessionId = json[BSGKeyId];
    id startedAt = json[BSGKeyStartedAt];
    NSDate *date = nil;
    if ([startedAt isKindOfClass:[NSNumber class]]) {
        date = [NSDate dateWithTimeIntervalSinceReferenceDate:[startedAt doubleValue]];
    } else if ([startedAt isKindOfClass:[NSString class]]) {
        // BSSerializeDataCrashHandler used to store the date as a string
        date = [BSG_RFC3339DateTool dateFromString:startedAt];
    }
    if (!sessionId || !date) {
        return nil;
    }
    BugsnagSession *session = [[BugsnagSession alloc] initWithId:sessionId startedAt:date user:user app:app device:device];
    session.handledCount = [json[BSGKeyHandledCount] unsignedLongValue];
    session.unhandledCount = [json[BSGKeyUnhandledCount] unsignedLongValue];
    return session;
}
