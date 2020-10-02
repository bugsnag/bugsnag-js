#import "DeviceNativeUnhandledScenario.h"

@implementation DeviceNativeUnhandledScenario

- (void)run: (RCTPromiseResolveBlock)resolve
     reject:(RCTPromiseRejectBlock)reject {
  @throw [[NSException alloc] initWithName:@"NSException" reason:@"DeviceNativeUnhandledScenario" userInfo:nil];
}

@end
