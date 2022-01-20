#import "NativeFeatureFlagsScenario.h"

@implementation NativeFeatureFlagsScenario

- (void)run: (RCTPromiseResolveBlock)resolve
     reject:(RCTPromiseRejectBlock)reject {

  [Bugsnag clearFeatureFlagWithName:@"should_not_be_reported_1"];
  [Bugsnag clearFeatureFlagWithName:@"should_not_be_reported_2"];
  [Bugsnag clearFeatureFlagWithName:@"should_not_be_reported_3"];

  [Bugsnag addFeatureFlagWithName:@"native_flag"];
}

@end
