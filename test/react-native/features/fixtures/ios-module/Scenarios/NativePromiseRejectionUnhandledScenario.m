#import "NativePromiseRejectionUnhandledScenario.h"

@implementation NativePromiseRejectionUnhandledScenario

- (void)run: (RCTPromiseResolveBlock)resolve
     reject:(RCTPromiseRejectBlock)reject {
  reject(@"NativeError", @"NativePromiseRejectionUnhandledScenario", [NSError errorWithDomain:@"com.example" code:408 userInfo:nil]);
}

@end
