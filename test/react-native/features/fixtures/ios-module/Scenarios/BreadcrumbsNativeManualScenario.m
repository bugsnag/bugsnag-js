#import "BreadcrumbsNativeManualScenario.h"

@implementation BreadcrumbsNativeManualScenario

- (void)run {
  [Bugsnag leaveBreadcrumbWithMessage:@"Preference updated"
                           metadata:@{@"from": @"ios"}
                            andType:BSGBreadcrumbTypeState];
  NSException *exception = [[NSException alloc] initWithName:@"NSException" reason:@"BreadcrumbsNativeManualScenario" userInfo:nil];
  [Bugsnag notify:exception];
}

@end
