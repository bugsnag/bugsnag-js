#import "AppNativeHandledScenario.h"

@implementation AppNativeHandledScenario

- (void)run {
  NSException *exception = [[NSException alloc] initWithName:@"NSException" reason:@"AppNativeHandledScenario" userInfo:nil];
  [Bugsnag notify:exception];
}

@end
