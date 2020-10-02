#import "MetadataNativeScenario.h"

@implementation MetadataNativeScenario

- (void)run: (RCTPromiseResolveBlock)resolve
     reject:(RCTPromiseRejectBlock)reject {
  NSException *exception = [[NSException alloc] initWithName:@"NSException" reason:@"MetadataNativeScenario" userInfo:nil];
  [Bugsnag addMetadata:@"set via client" withKey:@"some_more_data" toSection:@"nativedata"];
  [Bugsnag notify:exception block:^BOOL(BugsnagEvent *event) {
    [event addMetadata:@"set via event" withKey:@"even_more_data" toSection:@"nativedata"];
    return YES;
  }];

}

@end
