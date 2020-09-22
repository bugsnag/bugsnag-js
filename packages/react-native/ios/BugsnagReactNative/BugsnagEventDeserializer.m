//
//  BugsnagEventDeserializer.m
//  BugsnagReactNative
//
//  Created by Jamie Lynch on 04/05/2020.
//  Copyright © 2020 Bugsnag, Inc. All rights reserved.
//

#import "BugsnagEventDeserializer.h"

#import "BugsnagStacktrace.h"

BSGSeverity BSGParseSeverity(NSString *severity);

@interface Bugsnag ()
+ (id)client;
+ (BugsnagConfiguration *)configuration;
@end

@interface BugsnagClient()
@property id sessionTracker;
@property BugsnagMetadata *metadata;
@end

@interface BugsnagError ()

- (instancetype)initWithErrorClass:(NSString *)errorClass
                      errorMessage:(NSString *)errorMessage
                         errorType:(BSGErrorType)errorType
                        stacktrace:(NSArray<BugsnagStackframe *> *)stacktrace;

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

@interface BugsnagThread ()
+ (instancetype)threadFromJson:(NSDictionary *)json;
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
- (void)attachCustomStacktrace:(NSArray *)frames withType:(NSString *)type;
@end

@interface BugsnagBreadcrumb ()
+ (instancetype)breadcrumbFromDict:(NSDictionary *)dict;
@end

@implementation BugsnagEventDeserializer

- (BugsnagEvent *)deserializeEvent:(NSDictionary *)payload {
    BugsnagClient *client = [Bugsnag client];
    BugsnagSession *session = [client.sessionTracker valueForKey:@"runningSession"];
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
        [event attachCustomStacktrace:error[@"stacktrace"] withType:@"reactnativejs"];
    }
    
    id nativeStack = payload[@"nativeStack"];
    if ([nativeStack isKindOfClass:[NSArray class]] &&
        [nativeStack filteredArrayUsingPredicate:
         [NSPredicate predicateWithFormat:@"NOT SELF isKindOfClass: %@", [NSString class]]].count == 0) {
        NSArray<BugsnagStackframe *> *stackframes = [BugsnagStackframe stackframesWithCallStackSymbols:nativeStack];
        if (stackframes != nil) {
            BugsnagError *nativeError = [[BugsnagError alloc] initWithErrorClass:error[@"errorClass"]
                                                                    errorMessage:error[@"errorMessage"]
                                                                       errorType:BSGErrorTypeCocoa
                                                                      stacktrace:stackframes];
            event.errors = [event.errors arrayByAddingObject:nativeError];
        }
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
    return [[BugsnagHandledState alloc] initWithSeverityReason:reason
                                                      severity:severity
                                                     unhandled:unhandled
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
