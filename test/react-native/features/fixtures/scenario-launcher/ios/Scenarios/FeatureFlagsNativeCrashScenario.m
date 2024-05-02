#import "FeatureFlagsNativeCrashScenario.h"

@implementation FeatureFlagsNativeCrashScenario

- (void)run: (RCTPromiseResolveBlock)resolve
     reject:(RCTPromiseRejectBlock)reject {

  [Bugsnag clearFeatureFlagWithName:@"should_not_be_reported_1"];
  [Bugsnag clearFeatureFlagWithName:@"should_not_be_reported_2"];
  [Bugsnag clearFeatureFlagWithName:@"should_not_be_reported_3"];

  @throw [[NSException alloc] initWithName:@"NSException" reason:@"FeatureFlagsNativeCrashScenario" userInfo:nil];
}

@end
