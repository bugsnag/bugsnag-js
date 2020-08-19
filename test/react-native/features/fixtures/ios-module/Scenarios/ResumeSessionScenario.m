#import "ResumeSessionScenario.h"

@implementation ResumeSessionScenario

- (void)run {
  [Bugsnag resumeSession];
}

@end
