//
//  BugsnagEventDeserializer.m
//  BugsnagReactNative
//
//  Created by Jamie Lynch on 04/05/2020.
//  Copyright © 2020 Bugsnag, Inc. All rights reserved.
//

#import "BugsnagEventDeserializer.h"

BSGSeverity BSGParseSeverity(NSString *severity);

@interface Bugsnag ()
+ (id)client;
+ (BugsnagConfiguration *)configuration;
@end

@interface BugsnagClient()
@property id sessionTracker;
@property BugsnagMetadata *metadata;
@end

@interface BugsnagMetadata ()
@end

@interface BugsnagHandledState: NSObject
- (instancetype)initWithSeverityReason:(NSUInteger)severityReason
                              severity:(BSGSeverity)severity
                             unhandled:(BOOL)unhandled
                             attrValue:(NSString *)attrValue;
+ (NSUInteger)severityReasonFromString:(NSString *)string;
@end

@interface BugsnagAppWithState()
+ (BugsnagAppWithState *)appFromJson:(NSDictionary *)json;
@end

@interface BugsnagDeviceWithState()
+ (BugsnagDeviceWithState *)deviceFromJson:(NSDictionary *)json;
@end

@interface BugsnagUser()
- (instancetype)initWithDictionary:(NSDictionary *)dict;
@end

@interface BugsnagEvent ()
- (instancetype)initWithApp:(BugsnagAppWithState *)app
                     device:(BugsnagDeviceWithState *)device
               handledState:(BugsnagHandledState *)handledState
                       user:(BugsnagUser *)user
                   metadata:(BugsnagMetadata *)metadata
                breadcrumbs:(NSArray<BugsnagBreadcrumb *> *)breadcrumbs
                     errors:(NSArray<BugsnagError *> *)errors
                    threads:(NSArray<BugsnagThread *> *)threads
                    session:(BugsnagSession *)session;
- (NSDictionary *)toJson;
@end

@interface BugsnagBreadcrumb ()
+ (instancetype)breadcrumbFromDict:(NSDictionary *)dict;
@end

@implementation BugsnagEventDeserializer

- (BugsnagEvent *)deserializeEvent:(NSDictionary *)payload {
    NSLog(@"Received JS payload dispatch: %@", payload);

    BugsnagClient *client = [Bugsnag client];
    BugsnagSession *session = [client.sessionTracker valueForKey:@"runningSession"];
    BugsnagMetadata *metadata = [[BugsnagMetadata alloc] initWithDictionary:payload[@"metadata"]];

    NSDictionary *error = payload[@"errors"][0];
    BugsnagHandledState *handledState = [self deserializeHandledState:payload];
    NSDictionary *user = payload[@"user"];

    BugsnagEvent *event = [[BugsnagEvent alloc] initWithApp:[BugsnagAppWithState appFromJson:payload[@"app"]]
                                                     device:[BugsnagDeviceWithState deviceFromJson:payload[@"device"]]
                                               handledState:handledState
                                                       user:[[BugsnagUser alloc] initWithDictionary:user]
                                                   metadata:metadata
                                                breadcrumbs:[self deserializeBreadcrumbs:payload[@"breadcrumbs"]]
                                                     errors:@[[BugsnagError new]] // TODO populate
                                                    threads:@[] // TODO populate
                                                    session:session];
    event.context = payload[@"context"];
    event.groupingHash = payload[@"groupingHash"];
    event.errors[0].errorClass = error[@"errorClass"];
    event.errors[0].errorMessage = error[@"errorMessage"];

    NSLog(@"Deserialized JS event: %@", [event toJson]);
    return event;
}

- (NSArray *)deserializeBreadcrumbs:(NSArray *)crumbs {
    NSMutableArray *array = [NSMutableArray new];

    if (crumbs != nil) {
        for (NSDictionary *crumb in crumbs) {
            BugsnagBreadcrumb *obj = [BugsnagBreadcrumb breadcrumbFromDict:crumb];
            
            if (obj != nil) {
                [array addObject:obj];
            }
        }
    }
    return array;
}

- (BugsnagHandledState *)deserializeHandledState:(NSDictionary *)payload {
    NSDictionary *severityReason = payload[@"severityReason"];
    NSDictionary *attrs = severityReason[@"attributes"];
    NSString *attrVal;

    if (attrs && [attrs count] > 0) {
        attrVal = [attrs allValues][0];
    }

    NSUInteger reason = [BugsnagHandledState severityReasonFromString:payload[@"severityReason"]];

    BSGSeverity severity = BSGParseSeverity(payload[@"severity"]);
    BOOL unhandled = [payload[@"unhandled"] boolValue];
    return [[BugsnagHandledState alloc] initWithSeverityReason:reason
                                                      severity:severity
                                                     unhandled:unhandled
                                                     attrValue:attrVal];
}

@end
