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
    BSGDictInsertIfNotNil(dict, [NSNumber numberWithBool:config.autoDetectErrors], @"autoDetectErrors");
    BSGDictInsertIfNotNil(dict, [NSNumber numberWithBool:config.autoTrackSessions], @"autoTrackSessions");
    BSGDictInsertIfNotNil(dict, config.enabledReleaseStages, @"enabledReleaseStages");
    BSGDictInsertIfNotNil(dict, config.releaseStage, @"releaseStage");
    BSGDictInsertIfNotNil(dict, config.appVersion, @"appVersion");
    BSGDictInsertIfNotNil(dict, config.appType, @"type");
    BSGDictInsertIfNotNil(dict, [NSNumber numberWithBool:config.persistUser], @"persistUser");
    BSGDictInsertIfNotNil(dict, [NSNumber numberWithInteger:config.maxBreadcrumbs], @"maxBreadcrumbs");

    BSGDictInsertIfNotNil(dict, @{
        @"notify" : config.endpoints.notify,
        @"sessions" : config.endpoints.sessions
    }, @"endpoints");

    return [NSDictionary dictionaryWithDictionary:dict];
}

@end
