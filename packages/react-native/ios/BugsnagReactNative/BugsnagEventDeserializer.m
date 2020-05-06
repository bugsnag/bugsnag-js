//
//  BugsnagEventDeserializer.m
//  BugsnagReactNative
//
//  Created by Jamie Lynch on 04/05/2020.
//  Copyright © 2020 Bugsnag, Inc. All rights reserved.
//

#import "BugsnagEventDeserializer.h"

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
    BugsnagMetadata *metadata = [[BugsnagMetadata alloc] initWithDictionary:payload[@"metadata"]];

    NSDictionary *error = payload[@"errors"][0];
    BugsnagEvent *event = [[BugsnagEvent alloc] initWithErrorName:error[@"errorClass"]
                              errorMessage:error[@"errorMessage"]
                             configuration:[Bugsnag configuration]
                                  metadata:metadata
                              handledState:nil
                                   session:session];
    event.breadcrumbs = [self deserializeBreadcrumbs:payload[@"breadcrumbs"]];
    event.context = payload[@"context"];
    event.groupingHash = payload[@"groupingHash"];
    NSDictionary *user = payload[@"user"];

    if (user) {
        [event setUser:user[@"id"] withEmail:user[@"email"] andName:user[@"name"]];
    }

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

@end
