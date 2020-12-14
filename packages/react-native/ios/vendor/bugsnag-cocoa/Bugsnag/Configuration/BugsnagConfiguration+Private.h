//
//  BugsnagConfiguration+Private.h
//  Bugsnag
//
//  Created by Nick Dowell on 26/11/2020.
//  Copyright © 2020 Bugsnag Inc. All rights reserved.
//

#import <Bugsnag/BugsnagConfiguration.h>

NS_ASSUME_NONNULL_BEGIN

@interface BugsnagConfiguration ()

#pragma mark Initializers

/// Initializes the configuration with values previously stored in metadata.
- (instancetype)initWithMetadata:(NSDictionary *)JSONObject NS_DESIGNATED_INITIALIZER;

#pragma mark Properties

/// Meta-information about the state of Bugsnag
@property (retain, nullable) BugsnagMetadata *config;

@property (readonly) NSDictionary<NSString *, id> *errorApiHeaders;

@property (readonly, nullable) BugsnagMetadata *metadata;

@property (readonly, nullable) NSURL *notifyURL;

@property (nonatomic) NSMutableArray<BugsnagOnBreadcrumbBlock> *onBreadcrumbBlocks;

@property (nonatomic) NSMutableArray<BugsnagOnSendErrorBlock> *onSendBlocks;

/// Hooks for modifying sessions before they are sent to Bugsnag. Intended for internal use only by React Native/Unity.
@property (nonatomic) NSMutableArray<BugsnagOnSessionBlock> *onSessionBlocks;

@property (nonatomic) NSMutableSet *plugins;

@property (readonly) BOOL shouldSendReports;

@property (readonly) NSDictionary<NSString *, id> *sessionApiHeaders;

@property (readonly, nullable) NSURL *sessionURL;

#pragma mark Methods

+ (BOOL)isValidApiKey:(NSString *)apiKey;

- (void)deletePersistedUserData;

- (BOOL)shouldRecordBreadcrumbType:(BSGBreadcrumbType)breadcrumbType;

/// Throws an NSInvalidArgumentException if the API key is empty or missing.
/// Logs a warning message if the API key is not in the expected format.
- (void)validate;

@end

NS_ASSUME_NONNULL_END
