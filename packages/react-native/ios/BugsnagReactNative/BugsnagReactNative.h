#import <Foundation/Foundation.h>

#import <React/RCTBridgeModule.h>
#import <React/RCTBridge.h>

@class BugsnagConfiguration;

@interface BugsnagReactNative: NSObject<RCTBridgeModule>

- (NSDictionary *)configure;

- (void)updateMetadata:(NSString *)section
              withData:(NSDictionary *)update;

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

- (void)getPayloadInfo:(RCTPromiseResolveBlock)resolve
                reject:(RCTPromiseRejectBlock)reject;

- (void)leaveBreadcrumb:(NSDictionary *)options;

@end
