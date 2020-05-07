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

@interface BugsnagEvent ()
- (instancetype _Nonnull)initWithErrorName:(NSString *_Nonnull)name
                              errorMessage:(NSString *_Nonnull)message
                             configuration:(BugsnagConfiguration *_Nonnull)config
                                  metadata:(BugsnagMetadata *_Nullable)metadata
                              handledState:(BugsnagHandledState *_Nonnull)handledState
                                   session:(BugsnagSession *_Nullable)session;
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
    BugsnagMetadata *metadata = client.metadata;

    NSDictionary *error = payload[@"errors"][0];
    BugsnagHandledState *handledState = [self deserializeHandledState:payload];

    BugsnagEvent *event = [[BugsnagEvent alloc] initWithErrorName:error[@"errorClass"]
                              errorMessage:error[@"errorMessage"]
                             configuration:[Bugsnag configuration]
                                  metadata:metadata
                              handledState:handledState
                                   session:session];
    event.breadcrumbs = [self deserializeBreadcrumbs:payload[@"breadcrumbs"]];
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
