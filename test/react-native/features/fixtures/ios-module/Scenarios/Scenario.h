//
// Created by Jamie Lynch on 23/03/2018.
// Copyright (c) 2018 Bugsnag. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <Bugsnag/Bugsnag.h>
#import <React/RCTBridgeModule.h>

NS_ASSUME_NONNULL_BEGIN

@interface Scenario : NSObject

+ (Scenario *)createScenarioNamed:(NSString *)className;

- (instancetype)init;

/**
 * Executes the test case
 */
- (void)run:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject;

@end

@interface ConfigFileReader : NSObject
- (instancetype)init;
- (NSString *)loadMazeRunnerAddress;
@end

NS_ASSUME_NONNULL_END
