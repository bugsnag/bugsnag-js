#import "HandledNativeErrorScenario.h"

@implementation HandledNativeErrorScenario

- (void)run {
  NSException *exception = [[NSException alloc] initWithName:@"NSException" reason:@"HandledNativeErrorScenario" userInfo:nil];
  [Bugsnag notify:exception];
}

@end
