//
// Created by Jamie Lynch on 23/03/2018.
// Copyright (c) 2018 Bugsnag. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <Bugsnag/Bugsnag.h>

@interface Scenario : NSObject

+ (Scenario *_Nonnull)createScenarioNamed:(NSString *_Nonnull)className;

- (instancetype _Nonnull)init;

/**
 * Executes the test case
 */
- (void)run;

@end
