//
//  BugsnagModule.m
//  reactnative
//
//  Created by Alexander Moinet on 24/06/2020.
//  Copyright © 2020 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>

#import <Bugsnag/Bugsnag.h>
#import "BugsnagModule.h"
#import "Scenario.h"
#import "reactnative-swift.h"

@implementation BugsnagModule

RCT_EXPORT_MODULE(BugsnagTestInterface);

RCT_EXPORT_METHOD(clearPersistentData)
{
  NSLog(@"%s", __PRETTY_FUNCTION__);
  [NSUserDefaults.standardUserDefaults removePersistentDomainForName:NSBundle.mainBundle.bundleIdentifier];
  NSString *appSupportDir = NSSearchPathForDirectoriesInDomains(NSApplicationSupportDirectory, NSUserDomainMask, YES).firstObject;
  NSString *rootDir = [appSupportDir stringByAppendingPathComponent:@"com.bugsnag.Bugsnag"];
  NSError *error = nil;
  if (![NSFileManager.defaultManager removeItemAtPath:rootDir error:&error] &&
      ![error.domain isEqualToString:NSCocoaErrorDomain] && error.code != NSFileNoSuchFileError) {
    NSLog(@"%@", error);
  }
}

RCT_EXPORT_METHOD(runScenario:(NSString *)scenario
                      resolve:(RCTPromiseResolveBlock)resolve
                        reject:(RCTPromiseRejectBlock)reject)
{
  Scenario *targetScenario = [Scenario createScenarioNamed:scenario];
  [targetScenario run:resolve reject:reject];
  resolve(nil);
}

RCT_EXPORT_METHOD(startBugsnag:(NSDictionary *)options
                       resolve:(RCTPromiseResolveBlock)resolve
                        reject:(RCTPromiseRejectBlock)reject)
{
  BugsnagConfiguration *scenarioConfig = createConfiguration(options);
  [Bugsnag startWithConfiguration:scenarioConfig];
  resolve(nil);
}

@end

BugsnagConfiguration *createConfiguration(NSDictionary * options) {
  NSLog(@"Received configuration options:");
  for (id key in options) {
      NSLog(@"key: %@, value: %@ \n", key, [options objectForKey:key]);
  }
  BugsnagConfiguration *config = [[BugsnagConfiguration alloc] initWithApiKey:options[@"apiKey"]];
  NSString *notifyEndpoint;
  NSString *sessionsEndpoint;
  if (options[@"endpoints"] != nil && options[@"endpoints"][@"notify"] != nil && options[@"endpoints"][@"sessions"] != nil) {
    NSDictionary *endpointsIn = options[@"endpoints"];
    notifyEndpoint = endpointsIn[@"notify"];
    sessionsEndpoint = endpointsIn[@"sessions"];
  } else {
    NSString *baseAddress = @"bs-local.com:9339";
    notifyEndpoint = [NSString stringWithFormat:@"http://%@/notify", baseAddress];
    sessionsEndpoint = [NSString stringWithFormat:@"http://%@/sessions", baseAddress];
  }
  NSLog(@"Notify endpoint set to: %@\n", notifyEndpoint);
  NSLog(@"Sessions endpoint set to: %@\n", sessionsEndpoint);
  BugsnagEndpointConfiguration *endpoints = [[BugsnagEndpointConfiguration alloc] initWithNotify:notifyEndpoint sessions:sessionsEndpoint];
  
  [config setEndpoints:endpoints];
  [config setAutoTrackSessions:[[options objectForKey:@"autoTrackSessions"]boolValue]];
  config.enabledErrorTypes.ooms = NO; // Set by default, will add an override as required
  if (options[@"appVersion"] != nil) {
    [config setAppVersion:options[@"appVersion"]];
  }
  if (options[@"appType"] != nil) {
    [config setAppType:options[@"appType"]];
  }
  if (options[@"releaseStage"] != nil) {
    [config setReleaseStage:options[@"releaseStage"]];
  }
  if (options[@"enabledReleaseStages"] != nil) {
    [config setEnabledReleaseStages:[NSSet setWithArray:options[@"enabledReleaseStages"]]];
  }
  if (options[@"enabledBreadcrumbTypes"] && ![options[@"enabledBreadcrumbTypes"] isEqual:[NSNull null]]) {
    BSGEnabledBreadcrumbType types = BSGEnabledBreadcrumbTypeNone;

    for (NSString *const type in options[@"enabledBreadcrumbTypes"]) {
      NSString *lcType = [type lowercaseString];
      NSLog(@"Enabling breadcrumb type: %@", lcType);

      if ([lcType isEqualToString:@"navigation"]) {
        types |= BSGEnabledBreadcrumbTypeNavigation;
      } else if ([lcType isEqualToString:@"request"]) {
        types |= BSGEnabledBreadcrumbTypeRequest;
      } else if ([lcType isEqualToString:@"process"]) {
        types |= BSGEnabledBreadcrumbTypeProcess;
      } else if ([lcType isEqualToString:@"log"]) {
        types |= BSGEnabledBreadcrumbTypeLog;
      } else if ([lcType isEqualToString:@"user"]) {
        types |= BSGEnabledBreadcrumbTypeUser;
      } else if ([lcType isEqualToString:@"state"]) {
        types |= BSGEnabledBreadcrumbTypeState;
      } else if ([lcType isEqualToString:@"error"]) {
        types |= BSGEnabledBreadcrumbTypeError;
      }
    }
    [config setEnabledBreadcrumbTypes:types];
  }
  if (options[@"configMetaData"] != nil) {
    NSDictionary *configMetaData = options[@"configMetaData"];
    [config addMetadata:configMetaData toSection:@"nativedata"];
  }
  if (options[@"redactedKeys"] != nil) {
    NSArray * redactedKeys = options[@"redactedKeys"];
    config.redactedKeys = [NSSet setWithArray:redactedKeys];
  }
  return config;
}
