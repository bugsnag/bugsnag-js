//
//  BugsnagClient+Private.h
//  Bugsnag
//
//  Created by Nick Dowell on 26/11/2020.
//  Copyright © 2020 Bugsnag Inc. All rights reserved.
//

#import <Bugsnag/BugsnagClient.h>

#import "BugsnagMetadata+Private.h" // For BugsnagObserverBlock

@class BSGAppHangDetector;
@class BSGEventUploader;
@class BugsnagAppWithState;
@class BugsnagBreadcrumbs;
@class BugsnagConfiguration;
@class BugsnagDeviceWithState;
@class BugsnagMetadata;
@class BugsnagNotifier;
@class BugsnagSessionTracker;
@class BugsnagSystemState;

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSInteger, BSGClientObserverEvent) {
    BSGClientObserverAddFeatureFlag,    // value: BugsnagFeatureFlag
    BSGClientObserverClearFeatureFlag,  // value: NSString
    BSGClientObserverUpdateContext,     // value: NSString
    BSGClientObserverUpdateMetadata,    // value: BugsnagMetadata
    BSGClientObserverUpdateUser,        // value: BugsnagUser
};

typedef void (^ BSGClientObserver)(BSGClientObserverEvent event, _Nullable id value);

@interface BugsnagClient ()

#pragma mark Properties

@property (nonatomic) BOOL appDidCrashLastLaunch;

@property (nonatomic) BSGAppHangDetector *appHangDetector;

@property (nullable, nonatomic) BugsnagEvent *appHangEvent;

@property (nullable, retain, nonatomic) BugsnagBreadcrumbs *breadcrumbs;

@property (nullable, nonatomic) NSString *codeBundleId;

@property (retain, nonatomic) BugsnagConfiguration *configuration;

/// The App hang or OOM event that caused the last launch to crash.
@property (nullable, nonatomic) BugsnagEvent *eventFromLastLaunch;

@property (strong, nonatomic) BSGEventUploader *eventUploader;

@property (nonatomic) NSMutableDictionary *extraRuntimeInfo;

@property (strong, nonatomic) BugsnagMetadata *metadata; // Used in BugsnagReactNative

@property (readonly, nonatomic) BugsnagNotifier *notifier; // Used in BugsnagReactNative

@property (strong, nonatomic) BugsnagSessionTracker *sessionTracker; // Used in BugsnagReactNative

@property (nonatomic) BOOL started;

/// State related metadata
///
/// Upon change this is automatically persisted to disk, making it available when contructing OOM payloads.
/// Is it also added to KSCrashReports under `user.state` by `BSSerializeDataCrashHandler()`.
///
/// Example contents:
///
/// {
///     "app": {
///         "codeBundleId": "com.example.app",
///     },
///     "client": {
///         "context": "MyViewController",
///     },
///     "user": {
///         "id": "abc123",
///         "name": "bob"
///     }
/// }
@property (strong, nonatomic) BugsnagMetadata *state;

@property (strong, nonatomic) NSMutableArray *stateEventBlocks;

@property (strong, nonatomic) BugsnagSystemState *systemState;

@property (nonatomic) BugsnagUser *user;

@property (nullable, nonatomic) BSGClientObserver observer; // Used in BugsnagReactNative

#pragma mark Methods

- (void)addBreadcrumbWithBlock:(void (^)(BugsnagBreadcrumb *))block;

- (void)addRuntimeVersionInfo:(NSString *)info withKey:(NSString *)key;

- (NSDictionary *)collectAppWithState; // Used in BugsnagReactNative

- (NSArray *)collectBreadcrumbs; // Used in BugsnagReactNative

- (NSDictionary *)collectDeviceWithState; // Used in BugsnagReactNative

- (NSArray *)collectThreads:(BOOL)unhandled; // Used in BugsnagReactNative

- (BugsnagAppWithState *)generateAppWithState:(NSDictionary *)systemInfo;

- (BugsnagDeviceWithState *)generateDeviceWithState:(NSDictionary *)systemInfo;

- (void)notifyInternal:(BugsnagEvent *)event block:(nullable BugsnagOnErrorBlock)block;

- (void)start;

@end

NS_ASSUME_NONNULL_END
