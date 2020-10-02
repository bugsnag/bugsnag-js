#import "PauseSessionScenario.h"

@implementation PauseSessionScenario

- (void)run: (RCTPromiseResolveBlock)resolve
     reject:(RCTPromiseRejectBlock)reject {
  [Bugsnag pauseSession];
}

@end
