//
//  BugsnagConfigSerializer.m
//  BugsnagReactNative
//
//  Created by Jamie Lynch on 16/03/2020.
//  Copyright © 2020 Bugsnag, Inc. All rights reserved.
//

#import "BugsnagConfigSerializer.h"

@implementation BugsnagConfigSerializer

- (NSDictionary *)serialize:(BugsnagConfiguration *)config {
    NSMutableDictionary *dict = [NSMutableDictionary new];
    dict[@"apiKey"] = config.apiKey;
    dict[@"autoDetectErrors"] = @(config.autoDetectErrors);
    dict[@"autoTrackSessions"] = @(config.autoTrackSessions);
    dict[@"enabledReleaseStages"] = config.enabledReleaseStages.allObjects;
    dict[@"releaseStage"] = config.releaseStage;
    dict[@"appVersion"] = config.appVersion;
    dict[@"appType"] = config.appType;
    dict[@"persistUser"] = @(config.persistUser);
    dict[@"maxBreadcrumbs"] = @(config.maxBreadcrumbs);
    
    dict[@"sendThreads"] = [self serializeThreadSendPolicy:config.sendThreads];
    dict[@"enabledBreadcrumbTypes"] = [self serializeBreadcrumbTypes:config];
    dict[@"enabledErrorTypes"] = [self serializeErrorTypes:config];
    dict[@"endpoints"] = [self serializeEndpoints:config];

    return [NSDictionary dictionaryWithDictionary:dict];
}

- (NSDictionary *)serializeEndpoints:(BugsnagConfiguration *)config {
    return @{
        @"notify" : config.endpoints.notify,
        @"sessions" : config.endpoints.sessions
    };
}

- (NSDictionary *)serializeErrorTypes:(BugsnagConfiguration *)config {
    return @{
        @"unhandledExceptions" : @(config.enabledErrorTypes.unhandledExceptions),
        @"unhandledRejections" : @(config.enabledErrorTypes.unhandledRejections)
    };
}

- (NSString *)serializeThreadSendPolicy:(BSGThreadSendPolicy)policy {
    switch (policy) {
        case BSGThreadSendPolicyAlways:
            return @"ALWAYS";
        case BSGThreadSendPolicyUnhandledOnly:
            return @"UNHANDLED_ONLY";
        case BSGThreadSendPolicyNever:
            return @"NEVER";
        default:
            return @"ALWAYS";
    }
}

- (NSArray *)serializeBreadcrumbTypes:(BugsnagConfiguration *)config {
    NSMutableArray *types = [NSMutableArray new];
    [types addObject:@"manual"];
    BSGEnabledBreadcrumbType enabled = config.enabledBreadcrumbTypes;
    
    if (enabled & BSGEnabledBreadcrumbTypeError) {
        [types addObject:@"error"];
    }
    if (enabled & BSGEnabledBreadcrumbTypeLog) {
        [types addObject:@"log"];
    }
    if (enabled & BSGEnabledBreadcrumbTypeNavigation) {
        [types addObject:@"navigation"];
    }
    if (enabled & BSGEnabledBreadcrumbTypeProcess) {
        [types addObject:@"process"];
    }
    if (enabled & BSGEnabledBreadcrumbTypeRequest) {
        [types addObject:@"request"];
    }
    if (enabled & BSGEnabledBreadcrumbTypeState) {
        [types addObject:@"state"];
    }
    if (enabled & BSGEnabledBreadcrumbTypeUser) {
        [types addObject:@"user"];
    }
    return types;
}

@end
