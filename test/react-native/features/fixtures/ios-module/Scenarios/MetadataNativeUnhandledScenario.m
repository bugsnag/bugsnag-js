#import "MetadataNativeUnhandledScenario.h"

@implementation MetadataNativeUnhandledScenario

- (void)run {
  NSException *exception = [[NSException alloc] initWithName:@"NSException" reason:@"MetadataNativeUnhandledScenario" userInfo:nil];
  [Bugsnag addMetadata:@"set via client" withKey:@"some_more_data" toSection:@"nativedata"];
  @throw exception;

}

@end
