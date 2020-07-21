#import "AppNativeUnhandledScenario.h"

@implementation AppNativeUnhandledScenario

- (void)run {
  @throw [[NSException alloc] initWithName:@"NSException" reason:@"AppNativeUnhandledScenario" userInfo:nil];
}

@end
