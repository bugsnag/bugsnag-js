#import "StartSessionScenario.h"

@implementation StartSessionScenario

- (void)run: (RCTPromiseResolveBlock)resolve
     reject:(RCTPromiseRejectBlock)reject {
  [Bugsnag startSession];
}

@end
