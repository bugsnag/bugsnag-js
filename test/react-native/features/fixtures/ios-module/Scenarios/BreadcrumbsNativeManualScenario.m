#import "BreadcrumbsNativeManualScenario.h"

@implementation BreadcrumbsNativeManualScenario

- (void)run: (RCTPromiseResolveBlock)resolve
     reject:(RCTPromiseRejectBlock)reject {
  [Bugsnag leaveBreadcrumbWithMessage:@"oh native crumbs"
                           metadata:@{@"from": @"ios"}
                            andType:BSGBreadcrumbTypeState];
  NSException *exception = [[NSException alloc] initWithName:@"NSException" reason:@"BreadcrumbsNativeManualScenario" userInfo:nil];
  [Bugsnag notify:exception];
}

@end
