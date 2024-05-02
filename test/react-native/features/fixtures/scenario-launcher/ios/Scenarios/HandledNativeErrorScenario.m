#import "HandledNativeErrorScenario.h"

@implementation HandledNativeErrorScenario

- (void)run: (RCTPromiseResolveBlock)resolve
     reject:(RCTPromiseRejectBlock)reject {
  NSException *exception = [[NSException alloc] initWithName:@"NSException" reason:@"HandledNativeErrorScenario" userInfo:nil];
  [Bugsnag notify:exception];
}

@end
