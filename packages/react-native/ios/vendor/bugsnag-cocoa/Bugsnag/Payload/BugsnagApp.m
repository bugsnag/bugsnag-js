//
//  BugsnagApp.m
//  Bugsnag
//
//  Created by Jamie Lynch on 01/04/2020.
//  Copyright © 2020 Bugsnag. All rights reserved.
//

#import "BugsnagApp.h"
#import "BugsnagKeys.h"
#import "BugsnagConfiguration.h"
#import "BugsnagCollections.h"

/**
 * Parse an event dictionary representation for App-specific metadata.
 *
 * @returns A dictionary of app-specific metadata
 */
NSDictionary *BSGParseAppMetadata(NSDictionary *event) {
    NSMutableDictionary *app = [NSMutableDictionary new];
    app[@"name"] = [event valueForKeyPath:@"system.CFBundleExecutable"];
    return app;
}

@implementation BugsnagApp

+ (BugsnagApp *)deserializeFromJson:(NSDictionary *)json {
    BugsnagApp *app = [BugsnagApp new];
    if (json != nil) {
        app.bundleVersion = json[@"bundleVersion"];
        app.codeBundleId = json[@"codeBundleId"];
        app.id = json[@"id"];
        app.releaseStage = json[@"releaseStage"];
        app.type = json[@"type"];
        app.version = json[@"version"];
        app.dsymUuid = json[@"dsymUUIDs"][0];
    }
    return app;
}

+ (BugsnagApp *)appWithDictionary:(NSDictionary *)event
                           config:(BugsnagConfiguration *)config
                     codeBundleId:(NSString *)codeBundleId
{
    BugsnagApp *app = [BugsnagApp new];
    [self populateFields:app
              dictionary:event
                  config:config
            codeBundleId:codeBundleId];
    return app;
}

+ (void)populateFields:(BugsnagApp *)app
            dictionary:(NSDictionary *)event
                config:(BugsnagConfiguration *)config
          codeBundleId:(NSString *)codeBundleId
{
    NSDictionary *system = event[BSGKeySystem];
    app.id = system[@"CFBundleIdentifier"];
    app.bundleVersion = config.bundleVersion ?: system[@"CFBundleVersion"];
    app.dsymUuid = system[@"app_uuid"];
    app.version = config.appVersion ?: system[@"CFBundleShortVersionString"];
    app.releaseStage = config.releaseStage;
    app.codeBundleId = [event valueForKeyPath:@"user.state.app.codeBundleId"] ?: codeBundleId;
    app.type = config.appType;
}

- (NSDictionary *)toDict
{
    NSMutableDictionary *dict = [NSMutableDictionary new];
    dict[@"bundleVersion"] = self.bundleVersion;
    dict[@"codeBundleId"] = self.codeBundleId;
    dict[@"dsymUUIDs"] = self.dsymUuid ? @[self.dsymUuid] : nil;
    dict[@"id"] = self.id;
    dict[@"releaseStage"] = self.releaseStage;
    dict[@"type"] = self.type;
    dict[@"version"] = self.version;
    return dict;
}

@end
