//
//  BugsnagModule.h
//  reactnative
//
//  Created by Alexander Moinet on 24/06/2020.
//  Copyright © 2020 Facebook. All rights reserved.
//

#ifndef BugsnagModule_h
#define BugsnagModule_h

#import <React/RCTBridgeModule.h>

@interface BugsnagModule : NSObject <RCTBridgeModule>

BugsnagConfiguration *createConfiguration(NSDictionary * options);

@end

@interface ConfigFileReader : NSObject
- (instancetype)init;
- (NSString *)loadMazeRunnerAddress;
@end


#endif /* BugsnagModule_h */
