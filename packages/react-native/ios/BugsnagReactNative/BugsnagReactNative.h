#import <Foundation/Foundation.h>

#import <React/RCTBridgeModule.h>
#import <React/RCTBridge.h>

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

- (void)dispatch:(NSDictionary *)payload
         resolve:(RCTPromiseResolveBlock)resolve
          reject:(RCTPromiseRejectBlock)reject;

- (void)getPayloadInfo:(NSDictionary *)payloadInfo
               resolve:(RCTPromiseResolveBlock)resolve
                reject:(RCTPromiseRejectBlock)reject;

- (void)leaveBreadcrumb:(NSDictionary *)options;

@end
