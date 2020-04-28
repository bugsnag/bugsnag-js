//
//  BugsnagAppWithState.m
//  Bugsnag
//
//  Created by Jamie Lynch on 01/04/2020.
//  Copyright © 2020 Bugsnag. All rights reserved.
//

#import "BugsnagAppWithState.h"
#import "BugsnagKeys.h"
#import "BugsnagConfiguration.h"
#import "BugsnagCollections.h"

@interface BugsnagApp ()
+ (void)populateFields:(BugsnagApp *)app
            dictionary:(NSDictionary *)event
                config:(BugsnagConfiguration *)config
          codeBundleId:(NSString *)codeBundleId;

- (NSDictionary *)toDict;
@end

@implementation BugsnagAppWithState

+ (BugsnagAppWithState *)appWithOomData:(NSDictionary *)event
{
    BugsnagAppWithState *app = [BugsnagAppWithState new];
    app.id = event[@"id"];
    app.releaseStage = event[@"releaseStage"];
    app.version = event[@"version"];
    app.bundleVersion = event[@"bundleVersion"];
    app.codeBundleId = event[@"codeBundleId"];
    app.inForeground = [event[@"inForeground"] boolValue];
    app.type = event[@"type"];
    return app;
}

+ (BugsnagAppWithState *)appWithDictionary:(NSDictionary *)event
                                    config:(BugsnagConfiguration *)config
                              codeBundleId:(NSString *)codeBundleId
{
    BugsnagAppWithState *app = [BugsnagAppWithState new];
    NSDictionary *system = event[BSGKeySystem];
    NSDictionary *stats = system[@"application_stats"];

    // convert from seconds to milliseconds
    NSUInteger activeTimeSinceLaunch = (NSUInteger) ([stats[@"active_time_since_launch"] longValue] * 1000);
    NSUInteger backgroundTimeSinceLaunch = (NSUInteger) ([stats[@"background_time_since_launch"] longValue] * 1000);

    app.durationInForeground = activeTimeSinceLaunch;
    app.duration = activeTimeSinceLaunch + backgroundTimeSinceLaunch;
    app.inForeground = [stats[@"application_in_foreground"] boolValue];
    [BugsnagApp populateFields:app dictionary:event config:config codeBundleId:codeBundleId];
    return app;
}

- (NSDictionary *)toDict
{
    NSMutableDictionary *dict = (NSMutableDictionary *) [super toDict];
    BSGDictInsertIfNotNil(dict, @(self.duration), @"duration");
    BSGDictInsertIfNotNil(dict, @(self.durationInForeground), @"durationInForeground");
    BSGDictInsertIfNotNil(dict, @(self.inForeground), @"inForeground");
    return dict;
}

@end
