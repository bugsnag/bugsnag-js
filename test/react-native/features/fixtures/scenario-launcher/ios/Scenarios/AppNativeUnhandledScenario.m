#import "AppNativeUnhandledScenario.h"

@implementation AppNativeUnhandledScenario

- (void)run: (RCTPromiseResolveBlock)resolve
     reject:(RCTPromiseRejectBlock)reject {
  @throw [[NSException alloc] initWithName:@"NSException" reason:@"AppNativeUnhandledScenario" userInfo:nil];
}

- (void)runSync {
  @throw [[NSException alloc] initWithName:@"NSException" reason:@"AppNativeUnhandledScenario" userInfo:nil];
}

@end
