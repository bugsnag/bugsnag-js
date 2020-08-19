//
//  BugsnagConfigSerializer.h
//  BugsnagReactNative
//
//  Created by Jamie Lynch on 16/03/2020.
//  Copyright © 2020 Bugsnag, Inc. All rights reserved.
//

#import <Foundation/Foundation.h>

#import "Bugsnag.h"

NS_ASSUME_NONNULL_BEGIN

@interface BugsnagConfigSerializer : NSObject

- (NSDictionary *)serialize:(BugsnagConfiguration *)config;

@end

NS_ASSUME_NONNULL_END
