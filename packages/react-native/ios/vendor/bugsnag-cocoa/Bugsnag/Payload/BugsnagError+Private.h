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

- (NSDictionary *)toDictionary;

@end

BSGErrorType BSGParseErrorType(NSString *errorType);

NSString *BSGSerializeErrorType(BSGErrorType errorType);

NS_ASSUME_NONNULL_END
