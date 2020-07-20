#import "UnhandledNativeErrorScenario.h"

@implementation UnhandledNativeErrorScenario

- (void)run {
  @throw [[NSException alloc] initWithName:@"NSException" reason:@"UnhandledNativeErrorScenario" userInfo:nil];
}

@end
