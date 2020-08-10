#import "PauseSessionScenario.h"

@implementation PauseSessionScenario

- (void)run {
  [Bugsnag pauseSession];
}

@end
