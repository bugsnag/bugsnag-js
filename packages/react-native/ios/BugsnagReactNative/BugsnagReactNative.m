#import "Bugsnag.h"
#import "BugsnagReactNative.h"
#import "BugsnagReactNativeEmitter.h"

@interface Bugsnag ()
+ (id)client;
+ (BOOL)bugsnagStarted;
+ (BugsnagConfiguration *)configuration;
+ (void)updateCodeBundleId:(NSString *)codeBundleId;
@end

@implementation BugsnagReactNative

RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(configureAsync:(NSDictionary *)readableMap
                         resolve:(RCTPromiseResolveBlock)resolve
                          reject:(RCTPromiseRejectBlock)reject) {
    resolve([self configure:readableMap]);
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(configure:(NSDictionary *)readableMap) {
    if (![Bugsnag bugsnagStarted]) {
        // TODO: fail loudly here
        return nil;
    }

    // TODO: use this emitter to inform JS of changes to user, context and metadata
    BugsnagReactNativeEmitter *emitter = [BugsnagReactNativeEmitter new];

    // TODO: convert the entire config into a map
    BugsnagConfiguration *config = [Bugsnag configuration];
    return @{
        @"apiKey": [config apiKey],
        @"releaseStage": [config releaseStage],
    };
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
    resolve(@{});
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

@end
