#import "Scenario.h"

#import <React/RCTAssert.h>

@interface RCTFatalScenario : Scenario

@end

@implementation RCTFatalScenario

- (void)run:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  RCTFatal([NSError errorWithDomain:@"MyErrorDomain" code:1 userInfo:@{
    NSLocalizedDescriptionKey: @"Should not be discarded by BugsnagReactNativePlugin's OnSendErrorBlock"}]);
}

@end
