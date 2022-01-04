//
//  BugsnagFeatureFlag.h
//  Bugsnag
//
//  Created by Nick Dowell on 11/11/2021.
//  Copyright © 2021 Bugsnag Inc. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface BugsnagFeatureFlag : NSObject

+ (instancetype)flagWithName:(NSString *)name;

+ (instancetype)flagWithName:(NSString *)name variant:(nullable NSString *)variant;

@property (readonly, nonatomic) NSString *name;

@property (nullable, readonly, nonatomic) NSString *variant;

@end

NS_ASSUME_NONNULL_END
