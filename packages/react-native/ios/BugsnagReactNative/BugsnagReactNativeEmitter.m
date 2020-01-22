#import "BugsnagReactNativeEmitter.h"

@implementation BugsnagReactNativeEmitter

RCT_EXPORT_MODULE();

- (NSArray<NSString *> *)supportedEvents {
  return @[@"bugsnag::sync"];
}

- (void)onChange {
  [self sendEventWithName:@"bugsnag::sync" body:@{@"type": @"TEST_UPDATE", @"data": @"TESTING_123"}];
}

@end
