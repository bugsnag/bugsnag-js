//
//  BugsnagEventDeserializer.h
//  BugsnagReactNative
//
//  Created by Jamie Lynch on 04/05/2020.
//  Copyright © 2020 Bugsnag, Inc. All rights reserved.
//

#import <Foundation/Foundation.h>

#import "Bugsnag.h"

NS_ASSUME_NONNULL_BEGIN

@interface BugsnagEventDeserializer : NSObject

- (BugsnagEvent *)deserializeEvent:(NSDictionary *)payload;

@end

NS_ASSUME_NONNULL_END
