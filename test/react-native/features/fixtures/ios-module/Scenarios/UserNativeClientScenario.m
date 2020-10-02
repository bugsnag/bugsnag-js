#import "UserNativeClientScenario.h"

@implementation UserNativeClientScenario

- (void)run: (RCTPromiseResolveBlock)resolve
     reject:(RCTPromiseRejectBlock)reject {
  [Bugsnag setUser:@"123" withEmail:@"bug@sn.ag" andName:@"Bug Snag"];
  @throw [[NSException alloc] initWithName:@"NSException" reason:@"UserNativeClientScenario" userInfo:nil];
}

@end
