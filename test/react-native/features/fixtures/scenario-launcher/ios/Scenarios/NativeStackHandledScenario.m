#import "NativeStackHandledScenario.h"

@implementation NativeStackHandledScenario

- (void)run: (RCTPromiseResolveBlock)resolve
     reject:(RCTPromiseRejectBlock)reject {
  reject(@"NativeError", @"NativeStackHandledScenario", [NSError errorWithDomain:@"com.example" code:408 userInfo:nil]);
}

@end
