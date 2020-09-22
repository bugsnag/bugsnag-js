//
//  BugsnagSessionTrackingPayload.m
//  Bugsnag
//
//  Created by Jamie Lynch on 27/11/2017.
//  Copyright © 2017 Bugsnag. All rights reserved.
//

#import "BugsnagSessionTrackingPayload.h"
#import "BugsnagCollections.h"
#import "BugsnagClient.h"
#import "BugsnagClientInternal.h"
#import "Bugsnag.h"
#import "BugsnagKeys.h"
#import "BugsnagNotifier.h"
#import "BSG_KSSystemInfo.h"
#import "BugsnagConfiguration.h"
#import "Private.h"
#import "BugsnagApp.h"

@interface BugsnagNotifier ()
- (NSDictionary *)toDict;
@end

@interface BugsnagSession ()
- (NSDictionary *)toDictionary;
@end

@interface Bugsnag ()
+ (BugsnagClient *)client;
@end

@interface BugsnagDevice ()
+ (BugsnagDevice *)deviceWithDictionary:(NSDictionary *)event;
- (NSDictionary *)toDictionary;
@end

@interface BugsnagApp ()
+ (BugsnagApp *)appWithDictionary:(NSDictionary *)event
                           config:(BugsnagConfiguration *)config
                     codeBundleId:(NSString *)codeBundleId;

- (NSDictionary *)toDict;
@end

@interface BugsnagSessionTrackingPayload ()
@property (nonatomic) BugsnagConfiguration *config;
@property(nonatomic, copy) NSString *codeBundleId;
@end

@implementation BugsnagSessionTrackingPayload

- (instancetype)initWithSessions:(NSArray<BugsnagSession *> *)sessions
                          config:(BugsnagConfiguration *)config
                    codeBundleId:(NSString *)codeBundleId
{
    if (self = [super init]) {
        _sessions = sessions;
        _config = config;
        _codeBundleId = codeBundleId;
    }
    return self;
}

- (NSMutableDictionary *)toJson
{
    NSMutableDictionary *dict = [NSMutableDictionary new];
    NSMutableArray *sessionData = [NSMutableArray new];

    for (BugsnagSession *session in self.sessions) {
        [sessionData addObject:[session toDictionary]];
    }
    BSGDictInsertIfNotNil(dict, sessionData, @"sessions");
    BSGDictSetSafeObject(dict, [[Bugsnag client].notifier toDict], BSGKeyNotifier);

    // app/device data collection relies on KSCrash reports,
    // need to mimic the JSON structure here
    BugsnagApp *app = self.sessions[0].app;
    BSGDictSetSafeObject(dict, [app toDict], BSGKeyApp);

    BugsnagDevice *device = self.sessions[0].device;
    BSGDictSetSafeObject(dict, [device toDictionary], BSGKeyDevice);
    return dict;
}

@end
