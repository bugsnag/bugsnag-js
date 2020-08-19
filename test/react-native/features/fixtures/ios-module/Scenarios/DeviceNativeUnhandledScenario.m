#import "DeviceNativeUnhandledScenario.h"

@implementation DeviceNativeUnhandledScenario

- (void)run {
  @throw [[NSException alloc] initWithName:@"NSException" reason:@"DeviceNativeUnhandledScenario" userInfo:nil];
}

@end
