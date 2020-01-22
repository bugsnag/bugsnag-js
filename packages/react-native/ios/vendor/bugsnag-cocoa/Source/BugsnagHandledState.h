//
//  BugsnagHandledState.h
//  Bugsnag
//
//  Created by Jamie Lynch on 21/09/2017.
//  Copyright © 2017 Bugsnag. All rights reserved.
//

#import "BugsnagCrashReport.h"
#import <Foundation/Foundation.h>

typedef NS_ENUM(NSUInteger, SeverityReasonType) {
    UnhandledException,
    Signal,
    HandledError,
    HandledException,
    UserSpecifiedSeverity,
    UserCallbackSetSeverity,
    PromiseRejection,
    LogMessage,
    LikelyOutOfMemory,
};

@interface BugsnagHandledState : NSObject

@property(nonatomic, readonly) BOOL unhandled;
@property(nonatomic, readonly) SeverityReasonType severityReasonType;
@property(nonatomic, readonly) BSGSeverity originalSeverity;
@property(nonatomic) BSGSeverity currentSeverity;
@property(nonatomic, readonly) SeverityReasonType calculateSeverityReasonType;
@property(nonatomic, readonly, strong) NSString *attrValue;
@property(nonatomic, readonly, strong) NSString *attrKey;

+ (NSString *)stringFromSeverityReason:(SeverityReasonType)severityReason;
+ (SeverityReasonType)severityReasonFromString:(NSString *)string;

+ (instancetype)handledStateWithSeverityReason:
    (SeverityReasonType)severityReason;

+ (instancetype)handledStateWithSeverityReason:
                    (SeverityReasonType)severityReason
                                      severity:(BSGSeverity)severity
                                     attrValue:(NSString *)attrValue;

- (instancetype)initWithSeverityReason:(SeverityReasonType)severityReason
                              severity:(BSGSeverity)severity
                             unhandled:(BOOL)unhandled
                             attrValue:(NSString *)attrValue;

- (NSDictionary *)toJson;

- (instancetype)initWithDictionary:(NSDictionary *)dict;

@end
