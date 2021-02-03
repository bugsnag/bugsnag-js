//
//  BugsnagAppWithState.m
//  Bugsnag
//
//  Created by Jamie Lynch on 01/04/2020.
//  Copyright © 2020 Bugsnag. All rights reserved.
//

#import "BugsnagAppWithState+Private.h"

#import "BugsnagApp+Private.h"
#import "BugsnagKeys.h"
#import "BugsnagConfiguration.h"
#import "BugsnagCollections.h"

@implementation BugsnagAppWithState

+ (BugsnagAppWithState *)appFromJson:(NSDictionary *)json {
    BugsnagAppWithState *app = [BugsnagAppWithState new];

    id duration = json[@"duration"];
    if ([duration isKindOfClass:[NSNumber class]]) {
        app.duration = duration;
    }

    id durationInForeground = json[@"durationInForeground"];
    if ([durationInForeground isKindOfClass:[NSNumber class]]) {
        app.durationInForeground = durationInForeground;
    }

    id inForeground = json[@"inForeground"];
    if (inForeground) {
        app.inForeground = [(NSNumber *) inForeground boolValue];
    }

    NSArray *dsyms = json[@"dsymUUIDs"];

    if (dsyms.count) {
        app.dsymUuid = dsyms[0];
    }

    app.bundleVersion = json[@"bundleVersion"];
    app.codeBundleId = json[@"codeBundleId"];
    app.id = json[@"id"];
    app.releaseStage = json[@"releaseStage"];
    app.type = json[@"type"];
    app.version = json[@"version"];
    return app;
}

+ (BugsnagAppWithState *)appWithOomData:(NSDictionary *)event
{
    BugsnagAppWithState *app = [BugsnagAppWithState new];
    app.id = event[@"id"];
    app.dsymUuid = event[BSGKeyMachoUUID];
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
    NSNumber *activeTimeSinceLaunch = @([stats[@"active_time_since_launch"] longValue] * 1000);
    NSNumber *backgroundTimeSinceLaunch = @([stats[@"background_time_since_launch"] longValue] * 1000);

    app.durationInForeground = activeTimeSinceLaunch;
    app.duration = @([activeTimeSinceLaunch longValue] + [backgroundTimeSinceLaunch longValue]);
    app.inForeground = [stats[@"application_in_foreground"] boolValue];
    [BugsnagApp populateFields:app dictionary:event config:config codeBundleId:codeBundleId];
    return app;
}

- (NSDictionary *)toDict
{
    NSMutableDictionary *dict = (NSMutableDictionary *) [super toDict];
    dict[@"duration"] = self.duration;
    dict[@"durationInForeground"] = self.durationInForeground;
    dict[@"inForeground"] = @(self.inForeground);
    return dict;
}

@end
