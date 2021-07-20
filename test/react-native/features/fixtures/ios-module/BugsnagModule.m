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

@implementation BugsnagModule

RCT_EXPORT_MODULE(BugsnagTestInterface);

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
  NSDictionary *endpointsIn = options[@"endpoints"];
  NSString *notifyEndpoint = endpointsIn[@"notify"];
  NSString *sessionsEndpoint = endpointsIn[@"sessions"];
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
    [config setEnabledBreadcrumbTypes:[NSSet setWithArray:options[@"enabledBreadcrumbTypes"]]];
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
