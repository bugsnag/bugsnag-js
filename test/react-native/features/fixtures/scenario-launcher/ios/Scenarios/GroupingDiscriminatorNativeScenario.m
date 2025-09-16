#import "GroupingDiscriminatorNativeScenario.h"

@implementation GroupingDiscriminatorNativeScenario

- (void)run: (RCTPromiseResolveBlock)resolve
     reject:(RCTPromiseRejectBlock)reject {
  NSException *exception = [[NSException alloc] initWithName:@"NSException" reason:@"GroupingDiscriminatorScenarioNative" userInfo:nil];
  [Bugsnag notify:exception];
  [NSThread sleepForTimeInterval:0.5];
  [Bugsnag setGroupingDiscriminator:@"grouping-discriminator-from-native"];
  // JS layer will be automatically notified via the BugsnagReactNativeEmitter
  // when setGroupingDiscriminator is called, which triggers BSGClientObserverUpdateGroupingDiscriminator
}

@end
