#import <Foundation/Foundation.h>

#import <React/RCTBridgeModule.h>
#import <React/RCTBridge.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import <BugsnagReactNativeSpec/BugsnagReactNativeSpec.h>

#import "BugsnagReactNativeEmitter.h"
#endif

@class BugsnagConfiguration;

@interface BugsnagReactNative: NSObject<RCTBridgeModule>

- (void)configureAsync:(NSDictionary *)readableMap
               resolve:(RCTPromiseResolveBlock)resolve
                reject:(RCTPromiseRejectBlock)reject;

- (NSDictionary *)configure:(NSDictionary *)readableMap;

- (void)updateCodeBundleId:(NSString *)codeBundleId;

- (void)addMetadata:(NSString *)section
           withData:(NSDictionary *)data;

- (void)clearMetadata:(NSString *)section
              withKey:(NSDictionary *)key;

- (void)updateContext:(NSString *)context;

- (void)updateUser:(NSString *)userId
         withEmail:(NSString *)email
          withName:(NSString *)name;

- (void)startSession;
- (void)pauseSession;
- (void)resumeSession;
- (void)resumeSessionOnStartup;

- (void)addFeatureFlags:(NSArray *)readableArray;
- (void)addFeatureFlag:(NSString *)name
           withVariant:(NSString *)variant;
- (void)clearFeatureFlag:(NSString *)name;
- (void)clearFeatureFlags;

- (void)dispatch:(NSDictionary *)payload
         resolve:(RCTPromiseResolveBlock)resolve
          reject:(RCTPromiseRejectBlock)reject;

- (void)getPayloadInfo:(NSDictionary *)payloadInfo
               resolve:(RCTPromiseResolveBlock)resolve
                reject:(RCTPromiseRejectBlock)reject;

- (void)leaveBreadcrumb:(NSDictionary *)options;

@end

#ifdef RCT_NEW_ARCH_ENABLED
@interface BugsnagReactNativeEmitter () <NativeBugsnagSpec>
@end
#endif
