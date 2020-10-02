#import "ContextNativeCustomScenario.h"

@implementation ContextNativeCustomScenario

- (void)run: (RCTPromiseResolveBlock)resolve
     reject:(RCTPromiseRejectBlock)reject {
  NSException *exception = [[NSException alloc] initWithName:@"NSException" reason:@"ContextNativeCustomScenario" userInfo:nil];
  [Bugsnag notify:exception];
  [NSThread sleepForTimeInterval:0.5];
  [Bugsnag setContext:@"context-native"];
  exception = [[NSException alloc] initWithName:@"NSException" reason:@"ContextNativeCustomScenario2" userInfo:nil];
  [Bugsnag notify:exception];
}

@end
