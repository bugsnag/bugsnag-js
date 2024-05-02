#import "ResumeSessionScenario.h"

@implementation ResumeSessionScenario

- (void)run: (RCTPromiseResolveBlock)resolve
     reject:(RCTPromiseRejectBlock)reject {
  [Bugsnag resumeSession];
}

@end
