//
//  BugsnagError+Private.h
//  Bugsnag
//
//  Created by Nick Dowell on 23/11/2020.
//  Copyright © 2020 Bugsnag Inc. All rights reserved.
//

#import <Bugsnag/BugsnagError.h>

NS_ASSUME_NONNULL_BEGIN

@class BugsnagThread;

@interface BugsnagError ()

- (instancetype)initWithEvent:(NSDictionary *)event errorReportingThread:(nullable BugsnagThread *)thread;

- (instancetype)initWithErrorClass:(NSString *)errorClass
                      errorMessage:(NSString *)errorMessage
                         errorType:(BSGErrorType)errorType
                        stacktrace:(nullable NSArray<BugsnagStackframe *> *)stacktrace;

+ (BugsnagError *)errorFromJson:(NSDictionary *)json;

/// Parses the `__crash_info` message and updates the `errorClass` and `errorMessage` as appropriate.
- (void)updateWithCrashInfoMessage:(NSString *)crashInfoMessage;

- (NSDictionary *)toDictionary;

@end

NSString *BSGParseErrorClass(NSDictionary *error, NSString *errorType);

NSString *BSGParseErrorMessage(NSDictionary *report, NSDictionary *error, NSString *errorType);

BSGErrorType BSGParseErrorType(NSString *errorType);

NSString *BSGSerializeErrorType(BSGErrorType errorType);

NS_ASSUME_NONNULL_END
