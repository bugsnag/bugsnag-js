//
//  BugsnagSession.m
//  Bugsnag
//
//  Created by Jamie Lynch on 24/11/2017.
//  Copyright © 2017 Bugsnag. All rights reserved.
//

#import "BugsnagSession+Private.h"

#import "BugsnagApp+Private.h"
#import "BugsnagCollections.h"
#import "BugsnagDevice+Private.h"
#import "BugsnagUser+Private.h"
#import "BSG_RFC3339DateTool.h"
#import "BugsnagKeys.h"

static NSString *const kBugsnagSessionId = @"id";
static NSString *const kBugsnagUnhandledCount = @"unhandledCount";
static NSString *const kBugsnagHandledCount = @"handledCount";
static NSString *const kBugsnagStartedAt = @"startedAt";
static NSString *const kBugsnagUser = @"user";

@implementation BugsnagSession

- (instancetype)initWithId:(NSString *_Nonnull)sessionId
                 startDate:(NSDate *_Nonnull)startDate
                      user:(BugsnagUser *_Nullable)user
              autoCaptured:(BOOL)autoCaptured
                       app:(BugsnagApp *_Nonnull)app
                       device:(BugsnagDevice *_Nonnull)device {
    if (self = [super init]) {
        _id = sessionId;
        _startedAt = [startDate copy];
        _user = user;
        _autoCaptured = autoCaptured;
        _app = app;
        _device = device;
    }
    return self;
}

+ (instancetype)fromJson:(NSDictionary *)json {
    if (!json) {
        return nil;
    }
    BugsnagSession *session = [BugsnagSession new];
    session.id = json[kBugsnagSessionId];

    NSString *timestamp = json[kBugsnagStartedAt];

    if (timestamp != nil) {
        session.startedAt = [BSG_RFC3339DateTool dateFromString:timestamp];
    }
    NSDictionary *events = json[@"events"];

    if (events != nil) {
        session.unhandledCount = [events[@"unhandled"] unsignedIntegerValue];
        session.handledCount = [events[@"handled"] unsignedIntegerValue];
    }
    return session;
}

- (instancetype)initWithDictionary:(NSDictionary *_Nonnull)dict {
    if (self = [super init]) {
        _id = dict[kBugsnagSessionId];
        _unhandledCount = [dict[kBugsnagUnhandledCount] unsignedIntegerValue];
        _handledCount = [dict[kBugsnagHandledCount] unsignedIntegerValue];
        _startedAt = [BSG_RFC3339DateTool dateFromString:dict[kBugsnagStartedAt]];

        _user = [[BugsnagUser alloc] initWithDictionary:dict[kBugsnagUser]];
        _app = [BugsnagApp deserializeFromJson:dict[BSGKeyApp]];
        _device = [BugsnagDevice deserializeFromJson:dict[BSGKeyDevice]];
    }
    return self;
}

- (_Nonnull instancetype)initWithId:(NSString *_Nonnull)sessionId
                          startDate:(NSDate *_Nonnull)startDate
                               user:(BugsnagUser *_Nullable)user
                       handledCount:(NSUInteger)handledCount
                     unhandledCount:(NSUInteger)unhandledCount
                                app:(BugsnagApp *_Nonnull)app
                             device:(BugsnagDevice *_Nonnull)device {
    if (self = [super init]) {
        _id = sessionId;
        _startedAt = startDate;
        _unhandledCount = unhandledCount;
        _handledCount = handledCount;
        _user = user;
        _app = app;
        _device = device;
    }
    return self;
}

- (NSDictionary *)toJson {
    NSMutableDictionary *dict = [NSMutableDictionary new];
    dict[kBugsnagSessionId] = self.id;
    dict[kBugsnagStartedAt] = [BSG_RFC3339DateTool stringFromDate:self.startedAt];

    if (self.user) {
        dict[kBugsnagUser] = [self.user toJson];
    }

    dict[BSGKeyApp] = [self.app toDict];
    dict[BSGKeyDevice] = [self.device toDictionary];
    return [NSDictionary dictionaryWithDictionary:dict];
}

- (NSDictionary *)toDictionary {
    NSMutableDictionary *dict = [NSMutableDictionary new];
    dict[kBugsnagSessionId] = self.id ?: @"";
    dict[kBugsnagStartedAt] = self.startedAt ? [BSG_RFC3339DateTool stringFromDate:self.startedAt] : @"";
    dict[kBugsnagHandledCount] = @(self.handledCount);
    dict[kBugsnagUnhandledCount] = @(self.unhandledCount);
    if (self.user) {
        dict[kBugsnagUser] = [self.user toJson];
    }
    return dict;
}

- (void)stop {
    self.stopped = YES;
}

- (void)resume {
    self.stopped = NO;
}

- (void)setUser:(NSString *_Nullable)userId
      withEmail:(NSString *_Nullable)email
        andName:(NSString *_Nullable)name {
    self.user = [[BugsnagUser alloc] initWithUserId:userId name:name emailAddress:email];
}

@end
