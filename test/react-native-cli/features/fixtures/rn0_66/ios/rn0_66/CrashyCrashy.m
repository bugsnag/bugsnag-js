//
//  CrashyCrashy.m
//  BugsnagReactNativeExample
//
//  Created by Christian Schlensker on 1/3/17.
//  Copyright © 2017 Bugsnag. All rights reserved.
//

#import "CrashyCrashy.h"
#import <React/RCTBridgeModule.h>
#import <Bugsnag/Bugsnag.h>

@implementation CrashyCrashy
RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(generateCrash)
{
  NSArray *items = [NSArray new];
  NSLog(@"This item does not exist: %@", items[42]);
}

RCT_REMAP_METHOD(generatePromiseRejection, resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
{
  reject(@"iOSReject", @"Oops - rejected promise from iOS!", [NSError errorWithDomain:@"com.example" code:562 userInfo:nil]);
}

RCT_EXPORT_METHOD(handledError)
{
  [Bugsnag notifyError:[NSError errorWithDomain:@"com.example" code:408 userInfo:nil]];
}

@end
