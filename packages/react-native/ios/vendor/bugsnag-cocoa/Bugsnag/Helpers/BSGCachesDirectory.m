//
//  BSGCachesDirectory.m
//  Bugsnag
//
//  Created by Karl Stenerud on 11.09.20.
//  Copyright © 2020 Bugsnag Inc. All rights reserved.
//

#import "BSGCachesDirectory.h"
#import "BSG_KSLogger.h"

@implementation BSGCachesDirectory

static NSString* g_cachesPath = nil;

+ (NSString *)cachesDirectory {
    // Default to an unusable location that will always fail.
    static NSString* cachesPath = @"/";

    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        NSArray *dirs = NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES);
        if ([dirs count] == 0) {
            BSG_KSLOG_ERROR(@"Could not locate cache directory path.");
            return;
        }

        if ([dirs[0] length] == 0) {
            BSG_KSLOG_ERROR(@"Could not locate cache directory path.");
            return;
        }
        cachesPath = dirs[0];
    });

    return cachesPath;
}

+ (NSString *)getSubdirPath:(NSString *)relativePath {
    NSString *cachesDir = [self cachesDirectory];
    NSString *subdirPath = [cachesDir stringByAppendingPathComponent:relativePath];
    
    NSFileManager *fileManager = [NSFileManager defaultManager];
    NSError *error = nil;
    if(![fileManager createDirectoryAtPath:subdirPath withIntermediateDirectories:YES attributes:nil error:&error]) {
        BSG_KSLOG_ERROR(@"Could not create caches subdir %@: %@", subdirPath, error);
        // Make the best of it, just return the top-level caches dir.
        return cachesDir;
    }
    return subdirPath;
}

@end
