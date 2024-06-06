#import "BugsnagReactNative.h"

#import "BugsnagInternals.h"
#import "BugsnagReactNativeEmitter.h"
#import "BugsnagConfigSerializer.h"
#import "BugsnagEventDeserializer.h"

#ifdef RCT_NEW_ARCH_ENABLED
#import <BugsnagReactNativeSpec/BugsnagReactNativeSpec.h>
#endif

// BSG_EXPORT_METHOD exposes methods as blocking synchronous methods in the new architecture and
// as asynchronous methods in the old architecture.
//
// Methods written in BSG_EXPORT_METHOD must be ended using BSG_EXPORT_RETURN so that the correct
// return type is used. (void for asynchronous and id for synchronous methods)
//
// Note that this should only be used for methods that are marked as void in JS. Methods that return
// a value or a promise should be exposed as synchronous or asynchronous explicitly in both architectures.
#ifdef RCT_NEW_ARCH_ENABLED
#define BSG_EXPORT_METHOD RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD
#define BSG_EXPORT_RETURN return nil;
#else
#define BSG_EXPORT_METHOD RCT_EXPORT_METHOD
#define BSG_EXPORT_RETURN return;
#endif

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

    if (![Bugsnag isStarted]) {
        [NSException raise:@"BugsnagException" format:@"Failed to initialise the Bugsnag Cocoa client, please check you have added [Bugsnag start] in the application:didFinishLaunchingWithOptions: method of your AppDelegate subclass"];
    }
    [self updateNotifierInfo:readableMap];
    [self addRuntimeVersionInfo:readableMap];

    BugsnagConfiguration *config = Bugsnag.client.configuration;
    return [self.configSerializer serialize:config];
}

BSG_EXPORT_METHOD(addMetadata:(NSString *)section
                     withData:(NSDictionary *)data) {
    [Bugsnag addMetadata:data toSection:section];
    BSG_EXPORT_RETURN
}

BSG_EXPORT_METHOD(clearMetadata:(NSString *)section
                     withKey:(NSString *)key) {
    if (key == nil) {
        [Bugsnag clearMetadataFromSection:section];
    } else {
        [Bugsnag clearMetadataFromSection:section withKey:key];
    }
    BSG_EXPORT_RETURN
}

BSG_EXPORT_METHOD(updateContext:(NSString *)context) {
    [Bugsnag setContext:context];
    BSG_EXPORT_RETURN
}

BSG_EXPORT_METHOD(updateCodeBundleId:(NSString *)codeBundleId) {
    Bugsnag.client.codeBundleId = codeBundleId; 
    BSG_EXPORT_RETURN
}

BSG_EXPORT_METHOD(updateUser:(NSString *)userId
                   withEmail:(NSString *)email
                    withName:(NSString *)name) {
    [Bugsnag setUser:userId withEmail:email andName:name];
    BSG_EXPORT_RETURN
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(dispatch:(NSDictionary *)payload) {
    BugsnagEventDeserializer *deserializer = [BugsnagEventDeserializer new];
    BugsnagEvent *event = [deserializer deserializeEvent:payload];

    [Bugsnag.client notifyInternal:event block:^BOOL(BugsnagEvent * _Nonnull event) {
        NSLog(@"Sending event from JS: %@", event);
        return true;
    }];
    return [NSNumber numberWithBool:YES];
}

RCT_EXPORT_METHOD(dispatchAsync:(NSDictionary *)payload
                   resolve:(RCTPromiseResolveBlock)resolve
                    reject:(RCTPromiseRejectBlock)reject) {
    resolve([self dispatch:payload]);
}

BSG_EXPORT_METHOD(leaveBreadcrumb:(NSDictionary *)options) {
    NSString *message = options[@"message"];
    if (message != nil) {
        BSGBreadcrumbType type = BSGBreadcrumbTypeFromString(options[@"type"]);
        NSDictionary *metadata = options[@"metadata"];
        [Bugsnag leaveBreadcrumbWithMessage:message
                                   metadata:metadata
                                    andType:type];
    }
    BSG_EXPORT_RETURN
}

BSG_EXPORT_METHOD(startSession) {
    [Bugsnag startSession];
    BSG_EXPORT_RETURN
}

BSG_EXPORT_METHOD(pauseSession) {
    [Bugsnag pauseSession];
    BSG_EXPORT_RETURN
}

BSG_EXPORT_METHOD(resumeSession) {
    [Bugsnag resumeSession];
    BSG_EXPORT_RETURN
}

BSG_EXPORT_METHOD(resumeSessionOnStartup) {
    [Bugsnag resumeSession];
    BSG_EXPORT_RETURN
}

BSG_EXPORT_METHOD(addFeatureFlags:(NSArray *)readableArray) {
    NSMutableArray *array = [NSMutableArray new];
    if(readableArray == nil) {
        for(NSDictionary *feature in readableArray) {
            NSString *name = feature[@"name"];
            NSString *variant = feature[@"variant"];

            BugsnagFeatureFlag *featureFlag = [BugsnagFeatureFlag flagWithName:name variant:variant];
            if(featureFlag != nil) {
                [array addObject:featureFlag];
            }
        }
    }

    [Bugsnag addFeatureFlags:array];
    BSG_EXPORT_RETURN
}

BSG_EXPORT_METHOD(addFeatureFlag:(NSString *)name
                     withVariant:(NSString *)variant) {
    if(name != nil) {
        [Bugsnag addFeatureFlagWithName:name variant:variant];
    }
    BSG_EXPORT_RETURN
}

BSG_EXPORT_METHOD(clearFeatureFlag:(NSString *)name) {
    if(name != nil) {
        [Bugsnag clearFeatureFlagWithName:name];
    }
    BSG_EXPORT_RETURN
}

BSG_EXPORT_METHOD(clearFeatureFlags) {
    [Bugsnag clearFeatureFlags];
    BSG_EXPORT_RETURN
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(getPayloadInfo:(NSDictionary *)options) {
    BugsnagClient *client = [Bugsnag client];
    NSMutableDictionary *info = [NSMutableDictionary new];
    NSDictionary *systemInfo = BSGGetSystemInfo();
    info[@"app"] = [[client generateAppWithState:systemInfo] toDict];
    info[@"device"] = [[client generateDeviceWithState:systemInfo] toDictionary];
    info[@"breadcrumbs"] = ({
        NSMutableArray *array = [NSMutableArray new];
        for (BugsnagBreadcrumb *crumb in [client breadcrumbs]) {
            NSMutableDictionary *json = [[crumb objectValue] mutableCopy];
            if (!json) {
                continue;
            }
            // JSON is serialized as 'name', we want as 'message' when passing to RN
            json[@"message"] = json[@"name"];
            json[@"name"] = nil;
            json[@"metadata"] = json[@"metaData"];
            json[@"metaData"] = nil;
            [array addObject:json];
        }
        array;
    });
    info[@"threads"] = ({
        NSArray *callStack = NSThread.callStackReturnAddresses;
        if (callStack.count) { // discard `-[BugsnagReactNative getPayloadInfo:resolve:reject:]`
            callStack = [callStack subarrayWithRange:NSMakeRange(1, callStack.count - 1)];
        }
        BOOL unhandled = [options[@"unhandled"] boolValue];
        BSGThreadSendPolicy policy = client.configuration.sendThreads;
        BOOL recordAllThreads = policy == BSGThreadSendPolicyAlways
               || (unhandled && policy == BSGThreadSendPolicyUnhandledOnly);
        NSArray<BugsnagThread *> *threads = [BugsnagThread allThreads:recordAllThreads callStackReturnAddresses:callStack];
        [BugsnagThread serializeThreads:threads];
    });
    return info;
}

RCT_EXPORT_METHOD(getPayloadInfoAsync:(NSDictionary *)options
                         resolve:(RCTPromiseResolveBlock)resolve
                          reject:(RCTPromiseRejectBlock)reject) {
    resolve([self getPayloadInfo:options]);
}

- (void)addRuntimeVersionInfo:(NSDictionary *)info {
    NSString *reactNativeVersion = info[@"reactNativeVersion"];
    NSString *engine = info[@"engine"];
    BugsnagClient *client = [Bugsnag client];
    [client addRuntimeVersionInfo:reactNativeVersion withKey:@"reactNative"];
    [client addRuntimeVersionInfo:engine withKey:@"reactNativeJsEngine"];
}

- (void)updateNotifierInfo:(NSDictionary *)info {
    Bugsnag.client.notifier.name = @"Bugsnag React Native";
    Bugsnag.client.notifier.version = info[@"notifierVersion"];
    Bugsnag.client.notifier.url = @"https://github.com/bugsnag/bugsnag-js";
    Bugsnag.client.notifier.dependencies = @[[[BugsnagNotifier alloc] init]];
}


#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
  (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeBugsnagSpecJSI>(params);
}
#endif

@end
