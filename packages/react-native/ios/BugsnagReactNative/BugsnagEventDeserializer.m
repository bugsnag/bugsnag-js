//
//  BugsnagEventDeserializer.m
//  BugsnagReactNative
//
//  Created by Jamie Lynch on 04/05/2020.
//  Copyright © 2020 Bugsnag, Inc. All rights reserved.
//

#import "BugsnagEventDeserializer.h"

#import "BugsnagInternals.h"
#import <Bugsnag/BugsnagStacktrace.h>

@implementation BugsnagEventDeserializer

- (BugsnagEvent *)deserializeEvent:(NSDictionary *)payload {
    BugsnagMetadata *metadata = [[BugsnagMetadata alloc] initWithDictionary:payload[@"metadata"]];

    BugsnagHandledState *handledState = [self deserializeHandledState:payload];
    NSDictionary *user = payload[@"user"];
    NSDictionary *correlation = payload[@"correlation"];

    BugsnagEvent *event = [[BugsnagEvent alloc] initWithApp:[BugsnagAppWithState appFromJson:payload[@"app"]]
                                                     device:[BugsnagDeviceWithState deviceFromJson:payload[@"device"]]
                                               handledState:handledState
                                                       user:[[BugsnagUser alloc] initWithDictionary:user]
                                                   metadata:metadata
                                                breadcrumbs:[self deserializeBreadcrumbs:payload[@"breadcrumbs"]]
                                                     errors:[self deserializeErrors:payload[@"errors"]]
                                                    threads:[self deserializeThreads:payload[@"threads"]]
                                                    session:nil /* set by -[BugsnagClient notifyInternal:block:] */];
    event.context = payload[@"context"];
    event.groupingHash = payload[@"groupingHash"];
    event.groupingDiscriminator = payload[@"groupingDiscriminator"];

    [event setCorrelationTraceId:correlation[@"traceId"] spanId:correlation[@"spanId"]];

    if (payload[@"apiKey"]) {
        event.apiKey = payload[@"apiKey"];
    }
    
    NSArray *featureFlags = payload[@"featureFlags"];
    if (featureFlags != nil) {
        for (NSDictionary *flag in featureFlags) {
            NSString *name = flag[@"featureFlag"];
            
            if(name != nil) {
                [event addFeatureFlagWithName:name variant:flag[@"variant"]];
            }
        }
    }

    return event;
}

- (NSArray<BugsnagError *> *)deserializeErrors:(NSArray *)errors {
    NSMutableArray *array = [NSMutableArray new];
    for (NSDictionary *error in errors) {
        BugsnagError *errorObj = [BugsnagError new];
        errorObj.errorClass = error[@"errorClass"];
        errorObj.errorMessage = error[@"errorMessage"];
        NSArray<NSDictionary *> *stacktrace = error[@"stacktrace"];
        NSArray<NSString *> *nativeStack = error[@"nativeStack"];
        if (nativeStack) {
            NSMutableArray<NSDictionary *> *mixedStack = [NSMutableArray array];
            for (BugsnagStackframe *frame in [BugsnagStackframe stackframesWithCallStackSymbols:nativeStack]) {
                frame.type = BugsnagStackframeTypeCocoa;
                [frame symbolicateIfNeeded];
                [mixedStack addObject:[frame toDictionary]];
            }
            [mixedStack addObjectsFromArray:stacktrace];
            stacktrace = mixedStack;
        }

        errorObj.stacktrace = [BugsnagStacktrace stacktraceFromJson:stacktrace].trace;
        errorObj.type = BSGErrorTypeReactNativeJs;
        [array addObject:errorObj];
    }

    return array;
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
