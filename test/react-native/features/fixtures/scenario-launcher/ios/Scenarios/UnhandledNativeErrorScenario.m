#import "UnhandledNativeErrorScenario.h"

@implementation UnhandledNativeErrorScenario

- (void)run: (RCTPromiseResolveBlock)resolve
     reject:(RCTPromiseRejectBlock)reject {
  @throw [[NSException alloc] initWithName:@"NSException" reason:@"UnhandledNativeErrorScenario" userInfo:nil];
}

- (void)runSync {
  @throw [[NSException alloc] initWithName:@"NSException" reason:@"UnhandledNativeErrorScenario" userInfo:nil];
}

@end
