#import "StartSessionScenario.h"

@implementation StartSessionScenario

- (void)run {
  [Bugsnag startSession];
}

@end
