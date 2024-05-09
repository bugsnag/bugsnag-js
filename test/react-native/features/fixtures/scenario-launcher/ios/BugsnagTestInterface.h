#import <React/RCTBridgeModule.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import <BugsnagTestInterfaceSpec/BugsnagTestInterfaceSpec.h>
#endif

@interface BugsnagTestInterface: NSObject <RCTBridgeModule>

- (void)startBugsnag:(NSDictionary *)options
             resolve:(RCTPromiseResolveBlock)resolve
              reject:(RCTPromiseRejectBlock)reject;

- (void)runScenario:(NSString *)scenario
            resolve:(RCTPromiseResolveBlock)resolve
             reject:(RCTPromiseRejectBlock)reject;

- (void)clearPersistentData;

@end

#ifdef RCT_NEW_ARCH_ENABLED
@interface BugsnagTestInterface () <NativeBugsnagTestInterfaceSpec>
@end
#endif
