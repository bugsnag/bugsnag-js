#import <Foundation/Foundation.h>

#import <React/RCTBridgeModule.h>
#import <React/RCTBridge.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import <BugsnagReactNativeSpec/BugsnagReactNativeSpec.h>

#import "BugsnagReactNativeEmitter.h"
#endif

// BSG_VOID_LIKE sets the correct return type for 'void-like' methods that are
// synchronous in the new architecture (return id) and asynchronous in the old architecture (void)
#ifdef RCT_NEW_ARCH_ENABLED
#define BSG_VOID_LIKE id
#else
#define BSG_VOID_LIKE void
#endif

@class BugsnagConfiguration;

@interface BugsnagReactNative: NSObject<RCTBridgeModule>

- (void)configureAsync:(NSDictionary *)readableMap
               resolve:(RCTPromiseResolveBlock)resolve
                reject:(RCTPromiseRejectBlock)reject;

- (NSDictionary *)configure:(NSDictionary *)readableMap;

- (BSG_VOID_LIKE)updateCodeBundleId:(NSString *)codeBundleId;

- (BSG_VOID_LIKE)addMetadata:(NSString *)section
           withData:(NSDictionary *)data;

- (BSG_VOID_LIKE)clearMetadata:(NSString *)section
              withKey:(NSDictionary *)key;

- (BSG_VOID_LIKE)updateContext:(NSString *)context;

- (BSG_VOID_LIKE)updateUser:(NSString *)userId
         withEmail:(NSString *)email
          withName:(NSString *)name;

- (BSG_VOID_LIKE)startSession;
- (BSG_VOID_LIKE)pauseSession;
- (BSG_VOID_LIKE)resumeSession;
- (BSG_VOID_LIKE)resumeSessionOnStartup;

- (BSG_VOID_LIKE)addFeatureFlags:(NSArray *)readableArray;
- (BSG_VOID_LIKE)addFeatureFlag:(NSString *)name
           withVariant:(NSString *)variant;
- (BSG_VOID_LIKE)clearFeatureFlag:(NSString *)name;
- (BSG_VOID_LIKE)clearFeatureFlags;

- (NSNumber *)dispatch:(NSDictionary *)payload;

- (void)dispatchAsync:(NSDictionary *)payload
         resolve:(RCTPromiseResolveBlock)resolve
          reject:(RCTPromiseRejectBlock)reject;

- (NSDictionary *)getPayloadInfo:(NSDictionary *)payloadInfo;

- (void)getPayloadInfoAsync:(NSDictionary *)payloadInfo
               resolve:(RCTPromiseResolveBlock)resolve
                reject:(RCTPromiseRejectBlock)reject;

- (BSG_VOID_LIKE)leaveBreadcrumb:(NSDictionary *)options;

@end

#ifdef RCT_NEW_ARCH_ENABLED
@interface BugsnagReactNativeEmitter () <NativeBugsnagSpec>
@end
#endif
