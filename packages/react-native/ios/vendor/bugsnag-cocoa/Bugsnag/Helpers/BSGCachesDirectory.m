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

+ (NSString*) cachesDirectory {
    static NSString* cachesPath = nil;

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

@end
