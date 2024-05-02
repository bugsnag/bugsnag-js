#import "DeviceNativeHandledScenario.h"

@implementation DeviceNativeHandledScenario

- (void)run: (RCTPromiseResolveBlock)resolve
     reject:(RCTPromiseRejectBlock)reject {
  NSException *exception = [[NSException alloc] initWithName:@"NSException" reason:@"DeviceNativeHandledScenario" userInfo:nil];
  [Bugsnag notify:exception];
}

@end
