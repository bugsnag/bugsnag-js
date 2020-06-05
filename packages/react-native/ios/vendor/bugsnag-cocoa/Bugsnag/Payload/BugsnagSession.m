//
//  BugsnagSession.m
//  Bugsnag
//
//  Created by Jamie Lynch on 24/11/2017.
//  Copyright © 2017 Bugsnag. All rights reserved.
//

#import "BugsnagSession.h"
#import "BugsnagCollections.h"
#import "BSG_RFC3339DateTool.h"
#import "BugsnagKeys.h"

static NSString *const kBugsnagSessionId = @"id";
static NSString *const kBugsnagUnhandledCount = @"unhandledCount";
static NSString *const kBugsnagHandledCount = @"handledCount";
static NSString *const kBugsnagStartedAt = @"startedAt";
static NSString *const kBugsnagUser = @"user";

@interface BugsnagApp ()
- (NSDictionary *)toDict;
+ (BugsnagApp *)deserializeFromJson:(NSDictionary *)json;
@end

@interface BugsnagDevice ()
- (NSDictionary *)toDictionary;
+ (BugsnagDevice *)deserializeFromJson:(NSDictionary *)json;
@end

@interface BugsnagUser ()
- (instancetype)initWithDictionary:(NSDictionary *)dict;
- (instancetype)initWithUserId:(NSString *)userId name:(NSString *)name emailAddress:(NSString *)emailAddress;
- (NSDictionary *)toJson;
@end

@interface BugsnagSession ()
@property(readwrite, getter=isStopped) BOOL stopped;
@property(readonly) BOOL autoCaptured;
@property NSUInteger unhandledCount;
@property NSUInteger handledCount;

/**
 * Representation used in report payloads
 */
- (NSDictionary *_Nonnull)toJson;

/**
 * Full representation of a session suitable for creating an identical session
 * using initWithDictionary
 */
- (NSDictionary *_Nonnull)toDictionary;
- (void)stop;
- (void)resume;
@end

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
    BSGDictInsertIfNotNil(dict, self.id, kBugsnagSessionId);
    BSGDictInsertIfNotNil(dict, [BSG_RFC3339DateTool stringFromDate:self.startedAt], kBugsnagStartedAt);

    if (self.user) {
        BSGDictInsertIfNotNil(dict, [self.user toJson], kBugsnagUser);
    }

    BSGDictInsertIfNotNil(dict, [self.app toDict], BSGKeyApp);
    BSGDictInsertIfNotNil(dict, [self.device toDictionary], BSGKeyDevice);
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
    _user = [[BugsnagUser alloc] initWithUserId:userId name:name emailAddress:email];
}

@end
