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
@end

@implementation BugsnagEventDeserializer

- (BugsnagEvent *)deserializeEvent:(NSDictionary *)payload {
    NSLog(@"Received JS payload dispatch: %@", payload);

    BugsnagClient *client = [Bugsnag client];
    BugsnagSession *session = [client.sessionTracker valueForKey:@"runningSession"];
    BugsnagMetadata *metadata = client.metadata;

    NSDictionary *error = payload[@"errors"][0];
    BugsnagEvent *event = [[BugsnagEvent alloc] initWithErrorName:error[@"errorClass"]
                              errorMessage:error[@"errorMessage"]
                             configuration:[Bugsnag configuration]
                                  metadata:metadata
                              handledState:nil
                                   session:session];
    return event;
}

@end
