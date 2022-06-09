//
//  BSGInternalErrorReporter.h
//  Bugsnag
//
//  Created by Nick Dowell on 06/05/2021.
//  Copyright © 2021 Bugsnag Inc. All rights reserved.
//

#import <Foundation/Foundation.h>

#import "BSGDefines.h"

@class BugsnagAppWithState;
@class BugsnagConfiguration;
@class BugsnagDeviceWithState;
@class BugsnagEvent;
@class BugsnagNotifier;

NS_ASSUME_NONNULL_BEGIN

/// Returns a concise desription of the error including its domain, code, and debug description or localizedDescription.
BSG_PRIVATE NSString *_Nullable BSGErrorDescription(NSError *_Nullable error);

// MARK: -

@protocol BSGInternalErrorReporterDataSource <NSObject>

@property (readonly, nonatomic) BugsnagConfiguration *configuration;

- (BugsnagAppWithState *)generateAppWithState:(NSDictionary *)systemInfo;

- (BugsnagDeviceWithState *)generateDeviceWithState:(NSDictionary *)systemInfo;

@end

// MARK: -

@interface BSGInternalErrorReporter : NSObject

@property (class, nullable, nonatomic) BSGInternalErrorReporter *sharedInstance;

/// Runs the block immediately if sharedInstance exists, otherwise runs the block once sharedInstance has been created.
+ (void)performBlock:(void (^)(BSGInternalErrorReporter *))block;

- (instancetype)initWithDataSource:(id<BSGInternalErrorReporterDataSource>)dataSource NS_DESIGNATED_INITIALIZER;

- (instancetype)init UNAVAILABLE_ATTRIBUTE;

/// Reports an error to Bugsnag's internal bugsnag-cocoa project dashboard.
/// @param errorClass The class of error which occurred. This field is used to group the errors together so should not contain any contextual
/// information that would prevent correct grouping. This would ordinarily be the Exception name when dealing with an exception.
/// @param context The context to associate with this event. Errors are grouped by errorClass:context
/// @param message The error message associated with the error. Usually this will contain some information about this specific instance of the error
/// and is not used to group the errors.
/// @param diagnostics JSON compatible information to include in the `BugsnagDiagnostics` metadata section.
- (void)reportErrorWithClass:(NSString *)errorClass
                     context:(nullable NSString *)context
                     message:(nullable NSString *)message
                 diagnostics:(nullable NSDictionary<NSString *, id> *)diagnostics;

- (void)reportException:(NSException *)exception
            diagnostics:(nullable NSDictionary<NSString *, id> *)diagnostics
           groupingHash:(nullable NSString *)groupingHash;

- (void)reportRecrash:(NSDictionary *)recrashReport;

// Private

- (nullable BugsnagEvent *)eventWithErrorClass:(NSString *)errorClass
                                       context:(nullable NSString *)context
                                       message:(nullable NSString *)message
                                   diagnostics:(nullable NSDictionary<NSString *, id> *)diagnostics;

- (nullable BugsnagEvent *)eventWithException:(NSException *)exception
                                  diagnostics:(nullable NSDictionary<NSString *, id> *)diagnostics
                                 groupingHash:(nullable NSString *)groupingHash;

- (nullable BugsnagEvent *)eventWithRecrashReport:(NSDictionary *)recrashReport;

- (nullable NSURLRequest *)requestForEvent:(BugsnagEvent *)event error:(NSError * __autoreleasing *)errorPtr;

@end

NS_ASSUME_NONNULL_END
