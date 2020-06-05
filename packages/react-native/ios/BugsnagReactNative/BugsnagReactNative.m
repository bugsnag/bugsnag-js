#import "Bugsnag.h"
#import "BugsnagClient.h"
#import "BugsnagReactNative.h"
#import "BugsnagReactNativeEmitter.h"
#import "BugsnagConfigSerializer.h"
#import "BugsnagEventDeserializer.h"

@interface BugsnagClient ()
- (NSDictionary *)collectAppWithState;
- (NSDictionary *)collectDeviceWithState;
- (NSArray *)collectBreadcrumbs;
- (NSArray *)collectThreads;
@property id notifier;
@property id sessionTracker;
@property BugsnagMetadata *metadata;
@end

@interface Bugsnag ()
+ (BugsnagClient *)client;
+ (BOOL)bugsnagStarted;
+ (BugsnagConfiguration *)configuration;
+ (void)updateCodeBundleId:(NSString *)codeBundleId;
+ (void)notifyInternal:(BugsnagEvent *_Nonnull)event
                 block:(BOOL (^_Nonnull)(BugsnagEvent *_Nonnull))block;
+ (void)addRuntimeVersionInfo:(NSString *)info
                      withKey:(NSString *)key;
@end

@interface BugsnagMetadata ()
@end

@interface BugsnagEvent ()
- (instancetype _Nonnull)initWithErrorName:(NSString *_Nonnull)name
                              errorMessage:(NSString *_Nonnull)message
                             configuration:(BugsnagConfiguration *_Nonnull)config
                                  metadata:(BugsnagMetadata *_Nullable)metadata
                              handledState:(BugsnagHandledState *_Nonnull)handledState
                                   session:(BugsnagSession *_Nullable)session;
@end

@interface BugsnagReactNative ()
@property (nonatomic) BugsnagConfigSerializer *configSerializer;
@end

@implementation BugsnagReactNative

RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(configureAsync:(NSDictionary *)readableMap
                         resolve:(RCTPromiseResolveBlock)resolve
                          reject:(RCTPromiseRejectBlock)reject) {
    resolve([self configure:readableMap]);
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(configure:(NSDictionary *)readableMap) {
    self.configSerializer = [BugsnagConfigSerializer new];

    if (![Bugsnag bugsnagStarted]) {
        [NSException raise:@"BugsnagException" format:@"Failed to initialise the Bugsnag Cocoa client, please check you have added [Bugsnag start] in the application:didFinishLaunchingWithOptions: method of your AppDelegate subclass"];
    }
    [self updateNotifierInfo:readableMap];
    [self addRuntimeVersionInfo:readableMap];

    [Bugsnag addOnSendErrorBlock:^BOOL(BugsnagEvent * _Nonnull event) {
        BugsnagError *error;

        if ([event.errors count] > 0) {
            error = event.errors[0];
        }
        return error != nil
                && ![error.errorClass hasPrefix:@"RCTFatalException"]
                && ![error.errorMessage hasPrefix:@"Unhandled JS Exception"];
    }];

    // TODO: use this emitter to inform JS of changes to user, context and metadata
    BugsnagReactNativeEmitter *emitter = [BugsnagReactNativeEmitter new];

    BugsnagConfiguration *config = [Bugsnag configuration];
    return [self.configSerializer serialize:config];
}

RCT_EXPORT_METHOD(updateMetadata:(NSString *)section
                        withData:(NSDictionary *)update) {
    if (update == nil) {
        [Bugsnag clearMetadataFromSection:section];
    } else {
        [Bugsnag addMetadata:update toSection:section];
    }
}

RCT_EXPORT_METHOD(updateContext:(NSString *)context) {
    [Bugsnag setContext:context];
}

RCT_EXPORT_METHOD(updateCodeBundleId:(NSString *)codeBundleId) {
    [Bugsnag updateCodeBundleId:codeBundleId];
}

RCT_EXPORT_METHOD(updateUser:(NSString *)userId
                   withEmail:(NSString *)email
                    withName:(NSString *)name) {
    [Bugsnag setUser:userId withEmail:email andName:name];
}

RCT_EXPORT_METHOD(dispatch:(NSDictionary *)payload
                   resolve:(RCTPromiseResolveBlock)resolve
                    reject:(RCTPromiseRejectBlock)reject) {
    BugsnagEventDeserializer *deserializer = [BugsnagEventDeserializer new];
    BugsnagEvent *event = [deserializer deserializeEvent:payload];

    [Bugsnag notifyInternal:event block:^BOOL(BugsnagEvent * _Nonnull event) {
        NSLog(@"Sending event from JS: %@", event);
        return true;
    }];
    resolve(@{});
}

RCT_EXPORT_METHOD(leaveBreadcrumb:(NSDictionary *)options) {
    NSString *message = options[@"message"];
    if (message != nil) {
        BSGBreadcrumbType type = [self breadcrumbTypeFromString:options[@"type"]];
        NSDictionary *metadata = options[@"metadata"];
        [Bugsnag leaveBreadcrumbWithMessage:message
                                   metadata:metadata
                                    andType:type];
    }
}

RCT_EXPORT_METHOD(startSession) {
    [Bugsnag startSession];
}

RCT_EXPORT_METHOD(pauseSession) {
    [Bugsnag pauseSession];
}

RCT_EXPORT_METHOD(resumeSession) {
    [Bugsnag resumeSession];
}

RCT_EXPORT_METHOD(getPayloadInfo:(NSDictionary *)options
                         resolve:(RCTPromiseResolveBlock)resolve
                          reject:(RCTPromiseRejectBlock)reject) {
    BugsnagClient *client = [Bugsnag client];
    NSMutableDictionary *info = [NSMutableDictionary new];
    info[@"app"] = [client collectAppWithState];
    info[@"device"] = [client collectDeviceWithState];
    info[@"breadcrumbs"] = [client collectBreadcrumbs];
    info[@"threads"] = [client collectThreads];
    resolve(info);
}

- (void)addRuntimeVersionInfo:(NSDictionary *)info {
    NSString *reactNativeVersion = info[@"reactNativeVersion"];
    NSString *engine = info[@"engine"];
    [Bugsnag addRuntimeVersionInfo:reactNativeVersion withKey:@"reactNativeVersion"];
    [Bugsnag addRuntimeVersionInfo:engine withKey:@"engine"];
}

- (BSGBreadcrumbType)breadcrumbTypeFromString:(NSString *)value {
    if ([@"manual" isEqualToString:value]) {
        return BSGBreadcrumbTypeManual;
    } else if ([@"error" isEqualToString:value]) {
        return BSGBreadcrumbTypeError;
    } else if ([@"log" isEqualToString:value]) {
       return BSGBreadcrumbTypeLog;
    } else if ([@"navigation" isEqualToString:value]) {
        return BSGBreadcrumbTypeNavigation;
    } else if ([@"process" isEqualToString:value]) {
        return BSGBreadcrumbTypeProcess;
    } else if ([@"request" isEqualToString:value]) {
        return BSGBreadcrumbTypeRequest;
    } else if ([@"state" isEqualToString:value]) {
        return BSGBreadcrumbTypeState;
    } else if ([@"user" isEqualToString:value]) {
        return BSGBreadcrumbTypeUser;
    } else {
        return BSGBreadcrumbTypeManual; // return placeholder value
    }
}

- (void)updateNotifierInfo:(NSDictionary *)info {
    NSString *jsVersion = info[@"notifierVersion"];
    id notifier = [Bugsnag client].notifier;
    [notifier setValue:jsVersion forKey:@"version"];
    [notifier setValue:@"Bugsnag React Native" forKey:@"name"];
    [notifier setValue: @"https://github.com/bugsnag/bugsnag-js" forKey:@"url"];
    
    NSMutableArray *deps = [NSMutableArray arrayWithObject:[NSClassFromString(@"BugsnagNotifier") new]];
    [notifier setValue:deps forKey:@"dependencies"];
}

@end
