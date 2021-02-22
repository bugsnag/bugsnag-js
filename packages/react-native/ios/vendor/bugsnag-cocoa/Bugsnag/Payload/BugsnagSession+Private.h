//
//  BugsnagSession+Private.h
//  Bugsnag
//
//  Created by Nick Dowell on 23/11/2020.
//  Copyright © 2020 Bugsnag Inc. All rights reserved.
//

#import "BugsnagSession.h"

NS_ASSUME_NONNULL_BEGIN

@class BugsnagUser;

@interface BugsnagSession ()

#pragma mark Initializers

+ (instancetype)fromJson:(NSDictionary *)json;

- (instancetype)initWithDictionary:(NSDictionary *)dict;

- (instancetype)initWithId:(NSString *)sessionId
                 startDate:(NSDate *)startDate
                      user:(nullable BugsnagUser *)user
              autoCaptured:(BOOL)autoCaptured
                       app:(BugsnagApp *)app
                    device:(BugsnagDevice *)device;

- (instancetype)initWithId:(NSString *)sessionId
                 startDate:(NSDate *)startDate
                      user:(nullable BugsnagUser *)user
              handledCount:(NSUInteger)handledCount
            unhandledCount:(NSUInteger)unhandledCount
                       app:(BugsnagApp *)app
                    device:(BugsnagDevice *)device;

#pragma mark Properties

@property (readonly) BOOL autoCaptured;

@property NSUInteger handledCount;

@property (getter=isStopped) BOOL stopped;

@property NSUInteger unhandledCount;

@property (readwrite, nonnull, nonatomic) BugsnagUser *user;

#pragma mark Methods

- (void)resume;

- (void)stop;

// Representation used in report payloads.
- (NSDictionary *)toJson;

/// Full representation of a session suitable for creating an identical session using -initWithDictionary:
- (NSDictionary *)toDictionary;

@end

NS_ASSUME_NONNULL_END
