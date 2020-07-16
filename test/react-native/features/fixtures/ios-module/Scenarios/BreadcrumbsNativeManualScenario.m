#import "BreadcrumbsNativeManualScenario.h"

@implementation BreadcrumbsNativeManualScenario

- (void)run {
  [Bugsnag leaveBreadcrumb(@"oh native crumbs")]
  NSException * exception = [[NSException alloc] initWithName:@"NSException" reason:@"BreadcrumbsNativeManualScenario" userInfo:nil];
  [Bugsnag notify:exception];
}

@end
