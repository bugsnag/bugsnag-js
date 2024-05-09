#import "AppNativeHandledScenario.h"

@implementation AppNativeHandledScenario

- (void)run: (RCTPromiseResolveBlock)resolve
     reject:(RCTPromiseRejectBlock)reject {
  NSException *exception = [[NSException alloc] initWithName:@"NSException" reason:@"AppNativeHandledScenario" userInfo:nil];
  [Bugsnag notify:exception];
}

@end
