//
//  BSGCachesDirectory.h
//  Bugsnag
//
//  Created by Karl Stenerud on 11.09.20.
//  Copyright © 2020 Bugsnag Inc. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface BSGCachesDirectory : NSObject

+ (NSString *)cachesDirectory;

/**
 * Get a subdir relative to the caches directory. If the relative path doesn't exist, it will be created.
 * This method will report errors but will not crash; if the path is invalid, it will return the caches path.
 */
+ (NSString *)getSubdirPath:(NSString *)relativePath;

@end

NS_ASSUME_NONNULL_END
