#import "NativePromiseRejectionHandledScenario.h"

@implementation NativePromiseRejectionHandledScenario

- (void)run: (RCTPromiseResolveBlock)resolve
     reject:(RCTPromiseRejectBlock)reject {
  reject(@"NativeError", @"NativePromiseRejectionHandledScenario", [NSError errorWithDomain:@"com.example" code:408 userInfo:nil]);
}

@end
