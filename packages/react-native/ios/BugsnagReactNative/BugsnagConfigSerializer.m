//
//  BugsnagConfigSerializer.m
//  BugsnagReactNative
//
//  Created by Jamie Lynch on 16/03/2020.
//  Copyright © 2020 Bugsnag, Inc. All rights reserved.
//

#import "BugsnagConfigSerializer.h"
#import "BugsnagCollections.h"

@implementation BugsnagConfigSerializer

- (NSDictionary *)serialize:(BugsnagConfiguration *)config {
    NSMutableDictionary *dict = [NSMutableDictionary new];
    BSGDictInsertIfNotNil(dict, config.apiKey, @"apiKey");
    BSGDictInsertIfNotNil(dict, @(config.autoDetectErrors), @"autoDetectErrors");
    BSGDictInsertIfNotNil(dict, @(config.autoTrackSessions), @"autoTrackSessions");
    BSGDictInsertIfNotNil(dict, config.enabledReleaseStages, @"enabledReleaseStages");
    BSGDictInsertIfNotNil(dict, config.releaseStage, @"releaseStage");
    BSGDictInsertIfNotNil(dict, config.appVersion, @"appVersion");
    BSGDictInsertIfNotNil(dict, config.appType, @"appType");
    BSGDictInsertIfNotNil(dict, @(config.persistUser), @"persistUser");
    BSGDictInsertIfNotNil(dict, @(config.maxBreadcrumbs), @"maxBreadcrumbs");
    
    BSGDictInsertIfNotNil(dict, [self serializeThreadSendPolicy:config.sendThreads], @"sendThreads");
    BSGDictInsertIfNotNil(dict, [self serializeBreadcrumbTypes:config], @"enabledBreadcrumbTypes");
    BSGDictInsertIfNotNil(dict, [self serializeErrorTypes:config], @"enabledErrorTypes");
    BSGDictInsertIfNotNil(dict, [self serializeEndpoints:config], @"endpoints");

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
