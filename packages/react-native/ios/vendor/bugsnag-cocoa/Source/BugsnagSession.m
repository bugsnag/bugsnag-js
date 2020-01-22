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

static NSString *const kBugsnagSessionId = @"id";
static NSString *const kBugsnagUnhandledCount = @"unhandledCount";
static NSString *const kBugsnagHandledCount = @"handledCount";
static NSString *const kBugsnagStartedAt = @"startedAt";
static NSString *const kBugsnagUser = @"user";

@interface BugsnagSession ()
@property(readwrite, getter=isStopped) BOOL stopped;
@end

@implementation BugsnagSession

- (instancetype)initWithId:(NSString *_Nonnull)sessionId
                 startDate:(NSDate *_Nonnull)startDate
                      user:(BugsnagUser *_Nullable)user
              autoCaptured:(BOOL)autoCaptured {

    if (self = [super init]) {
        _sessionId = sessionId;
        _startedAt = [startDate copy];
        _user = user;
        _autoCaptured = autoCaptured;
    }
    return self;
}

- (instancetype)initWithDictionary:(NSDictionary *_Nonnull)dict {
    if (self = [super init]) {
        _sessionId = dict[kBugsnagSessionId];
        _unhandledCount = [dict[kBugsnagUnhandledCount] unsignedIntegerValue];
        _handledCount = [dict[kBugsnagHandledCount] unsignedIntegerValue];
        _startedAt = [BSG_RFC3339DateTool dateFromString:dict[kBugsnagStartedAt]];

        NSDictionary *userDict = dict[kBugsnagUser];

        if (userDict) {
            _user = [[BugsnagUser alloc] initWithDictionary:userDict];
        }
    }
    return self;
}

- (_Nonnull instancetype)initWithId:(NSString *_Nonnull)sessionId
                          startDate:(NSDate *_Nonnull)startDate
                               user:(BugsnagUser *_Nullable)user
                       handledCount:(NSUInteger)handledCount
                     unhandledCount:(NSUInteger)unhandledCount {
    if (self = [super init]) {
        _sessionId = sessionId;
        _startedAt = startDate;
        _unhandledCount = unhandledCount;
        _handledCount = handledCount;
        _user = user;
    }
    return self;
}

- (NSDictionary *)toJson {
    NSMutableDictionary *dict = [NSMutableDictionary new];
    BSGDictInsertIfNotNil(dict, self.sessionId, kBugsnagSessionId);
    BSGDictInsertIfNotNil(dict, [BSG_RFC3339DateTool stringFromDate:self.startedAt], kBugsnagStartedAt);

    if (self.user) {
        BSGDictInsertIfNotNil(dict, [self.user toJson], kBugsnagUser);
    }
    return [NSDictionary dictionaryWithDictionary:dict];
}

- (NSDictionary *)toDictionary {
    NSMutableDictionary *dict = [NSMutableDictionary new];
    dict[kBugsnagSessionId] = self.sessionId ?: @"";
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

@end
