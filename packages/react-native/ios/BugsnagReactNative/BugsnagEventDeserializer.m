//
//  BugsnagEventDeserializer.m
//  BugsnagReactNative
//
//  Created by Jamie Lynch on 04/05/2020.
//  Copyright © 2020 Bugsnag, Inc. All rights reserved.
//

#import "BugsnagEventDeserializer.h"

#import "Bugsnag+Private.h"
#import "BugsnagAppWithState+Private.h"
#import "BugsnagBreadcrumb+Private.h"
#import "BugsnagClient+Private.h"
#import "BugsnagDeviceWithState+Private.h"
#import "BugsnagError+Private.h"
#import "BugsnagEvent+Private.h"
#import "BugsnagHandledState.h"
#import "BugsnagSessionTracker+Private.h"
#import "BugsnagStackframe+Private.h"
#import "BugsnagStacktrace.h"
#import "BugsnagThread+Private.h"
#import "BugsnagUser+Private.h"

@implementation BugsnagEventDeserializer

- (BugsnagEvent *)deserializeEvent:(NSDictionary *)payload {
    BugsnagClient *client = [Bugsnag client];
    BugsnagSession *session = client.sessionTracker.runningSession;
    BugsnagMetadata *metadata = [[BugsnagMetadata alloc] initWithDictionary:payload[@"metadata"]];

    BugsnagHandledState *handledState = [self deserializeHandledState:payload];
    NSDictionary *user = payload[@"user"];

    BugsnagEvent *event = [[BugsnagEvent alloc] initWithApp:[BugsnagAppWithState appFromJson:payload[@"app"]]
                                                     device:[BugsnagDeviceWithState deviceFromJson:payload[@"device"]]
                                               handledState:handledState
                                                       user:[[BugsnagUser alloc] initWithDictionary:user]
                                                   metadata:metadata
                                                breadcrumbs:[self deserializeBreadcrumbs:payload[@"breadcrumbs"]]
                                                     errors:@[[BugsnagError new]]
                                                    threads:[self deserializeThreads:payload[@"threads"]]
                                                    session:session];
    event.context = payload[@"context"];
    event.groupingHash = payload[@"groupingHash"];

    if (payload[@"apiKey"]) {
        event.apiKey = payload[@"apiKey"];
    }

    NSDictionary *error = payload[@"errors"][0];

    if (error != nil) {
        event.errors[0].errorClass = error[@"errorClass"];
        event.errors[0].errorMessage = error[@"errorMessage"];
        NSArray<NSDictionary *> *stacktrace = error[@"stacktrace"];
        NSArray<NSString *> *nativeStack = payload[@"nativeStack"];
        if (nativeStack) {
            NSMutableArray<NSDictionary *> *mixedStack = [NSMutableArray array];
            for (BugsnagStackframe *frame in [BugsnagStackframe stackframesWithCallStackSymbols:nativeStack]) {
                frame.type = BugsnagStackframeTypeCocoa;
                [mixedStack addObject:[frame toDictionary]];
            }
            [mixedStack addObjectsFromArray:stacktrace];
            stacktrace = mixedStack;
        }
        [event attachCustomStacktrace:stacktrace withType:@"reactnativejs"];
    }

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

    NSString *severityType = [payload valueForKeyPath:@"severityReason.type"];
    NSUInteger reason = [BugsnagHandledState severityReasonFromString:severityType];

    BSGSeverity severity = BSGParseSeverity(payload[@"severity"]);
    BOOL unhandled = [payload[@"unhandled"] boolValue];
    BOOL unhandledOverridden = [severityReason[@"unhandledOverridden"] boolValue];
    return [[BugsnagHandledState alloc] initWithSeverityReason:reason
                                                      severity:severity
                                                     unhandled:unhandled
                                           unhandledOverridden:unhandledOverridden
                                                     attrValue:attrVal];
}

- (NSArray<BugsnagThread *> *)deserializeThreads:(NSArray *)threads {
    NSMutableArray *array = [NSMutableArray new];

    if (threads != nil) {
        for (NSDictionary *thread in threads) {
            BugsnagThread *obj = [BugsnagThread threadFromJson:thread];

            if (obj != nil) {
                [array addObject:obj];
            }
        }
    }
    return array;
}

@end
