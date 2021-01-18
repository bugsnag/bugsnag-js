//
//  BugsnagClient+Private.h
//  Bugsnag
//
//  Created by Nick Dowell on 26/11/2020.
//  Copyright © 2020 Bugsnag Inc. All rights reserved.
//

#import <Bugsnag/BugsnagClient.h>

@class BugsnagBreadcrumbs;
@class BugsnagConfiguration;
@class BugsnagCrashSentry;
@class BugsnagErrorReportApiClient;
@class BugsnagMetadata;
@class BugsnagNotifier;
@class BugsnagPluginClient;
@class BugsnagSessionTracker;
@class BugsnagSystemState;

NS_ASSUME_NONNULL_BEGIN

@interface BugsnagClient ()

#pragma mark Properties

@property (nonatomic) BOOL appDidCrashLastLaunch;

@property (nullable, retain, nonatomic) BugsnagBreadcrumbs *breadcrumbs;

@property (nullable, nonatomic) NSString *codeBundleId;

@property (readonly) NSString *configMetadataFile;

@property (nullable) NSDictionary *configMetadataFromLastLaunch;

@property (nullable, retain, nonatomic) BugsnagConfiguration *configuration;

@property (strong, nonatomic) BugsnagCrashSentry *crashSentry;

@property (strong, nonatomic) BugsnagErrorReportApiClient *errorReportApiClient;

@property NSMutableDictionary *extraRuntimeInfo;

#if TARGET_OS_IOS
@property (strong, nonatomic) NSString *lastOrientation;
#endif

@property (strong, nonatomic) BugsnagMetadata *metadata; // Used in BugsnagReactNative

@property (readonly) NSString *metadataFile;

@property (nullable) NSDictionary *metadataFromLastLaunch;

@property (strong, nonatomic) BugsnagNotifier *notifier; // Used in BugsnagReactNative

@property (strong, nonatomic) BugsnagPluginClient *pluginClient;

@property (strong, nonatomic) BugsnagSessionTracker *sessionTracker; // Used in BugsnagReactNative

@property (readonly, nonatomic) BOOL started;

@property (strong, nonatomic) BugsnagMetadata *state;

@property (strong, nonatomic) NSMutableArray *stateEventBlocks;

@property (readonly) NSString *stateMetadataFile;

@property (nullable) NSDictionary *stateMetadataFromLastLaunch;

@property (strong, nonatomic) BugsnagSystemState *systemState;

@property (nonatomic) BugsnagUser *user;

#pragma mark Methods

- (void)addBreadcrumbWithBlock:(void (^)(BugsnagBreadcrumb *))block;

- (void)addRuntimeVersionInfo:(NSString *)info withKey:(NSString *)key;

- (NSDictionary *)collectAppWithState; // Used in BugsnagReactNative

- (NSArray *)collectBreadcrumbs; // Used in BugsnagReactNative

- (NSDictionary *)collectDeviceWithState; // Used in BugsnagReactNative

- (NSArray *)collectThreads:(BOOL)unhandled; // Used in BugsnagReactNative

- (void)notifyInternal:(BugsnagEvent *)event block:(BugsnagOnErrorBlock)block;

- (BOOL)shouldReportOOM;

- (void)start;

@end

NS_ASSUME_NONNULL_END
