#import "NativeStackUnhandledScenario.h"

@implementation NativeStackUnhandledScenario

- (void)run: (RCTPromiseResolveBlock)resolve
     reject:(RCTPromiseRejectBlock)reject {
  reject(@"NativeError", @"NativeStackUnhandledScenario", [NSError errorWithDomain:@"com.example" code:408 userInfo:nil]);
}

@end
