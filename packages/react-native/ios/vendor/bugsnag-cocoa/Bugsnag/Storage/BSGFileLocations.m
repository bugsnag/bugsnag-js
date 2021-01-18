//
//  BSGFileLocations.m
//  Bugsnag
//
//  Created by Karl Stenerud on 05.01.21.
//  Copyright © 2021 Bugsnag Inc. All rights reserved.
//

#import "BSGFileLocations.h"
#import "BugsnagLogger.h"

static BOOL ensureDirExists(NSString *path) {
    NSFileManager *fileManager = [NSFileManager defaultManager];
    NSError *error = nil;
    if(![fileManager createDirectoryAtPath:path withIntermediateDirectories:YES attributes:nil error:&error]) {
        bsg_log_err(@"Could not create directory %@: %@", path, error);
        return NO;
    }
    return YES;
}

static NSString *rootDirectory(NSString *fsVersion) {
    // Default to an unusable location that will always fail.
    static NSString* defaultRootPath = @"/";
    static NSString* rootPath = @"/";

    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        NSArray *dirs = NSSearchPathForDirectoriesInDomains(NSApplicationSupportDirectory, NSUserDomainMask, YES);
        if ([dirs count] == 0) {
            bsg_log_err(@"Could not locate directory path for NSApplicationSupportDirectory.");
            return;
        }

        if ([dirs[0] length] == 0) {
            bsg_log_err(@"Directory path for NSApplicationSupportDirectory is empty!");
            return;
        }
        rootPath = [NSString stringWithFormat:@"%@/com.bugsnag.Bugsnag/%@/%@",
                    dirs[0],
                    [NSBundle mainBundle].bundleIdentifier,
                    fsVersion];

        // If we can't even create the root dir, all is lost, and no file ops can be allowed.
        if(!ensureDirExists(rootPath)) {
            rootPath = defaultRootPath;
        }
    });

    return rootPath;
}

static NSString *getAndCreateSubdir(NSString *rootPath, NSString *relativePath) {
    NSString *subdirPath = [rootPath stringByAppendingPathComponent:relativePath];
    if (ensureDirExists(subdirPath)) {
        return subdirPath;
    }
    // Make the best of it, just return the root dir.
    return rootPath;
}

@implementation BSGFileLocations

+ (instancetype) current {
    static BSGFileLocations *current = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        current = [BSGFileLocations v1];
    });
    return current;
}

+ (instancetype) v1 {
    NSString *root = rootDirectory(@"v1");
    BSGFileLocations *inst = [[BSGFileLocations alloc] init];
    inst->_sessions = getAndCreateSubdir(root, @"sessions");
    inst->_breadcrumbs = getAndCreateSubdir(root, @"breadcrumbs");
    inst->_kscrashReports = getAndCreateSubdir(root, @"KSCrashReports");
    inst->_kvStore = getAndCreateSubdir(root, @"kvstore");
    inst->_flagHandledCrash = [root stringByAppendingPathComponent:@"bugsnag_handled_crash.txt"];
    inst->_configuration = [root stringByAppendingPathComponent:@"config.json"];
    inst->_metadata = [root stringByAppendingPathComponent:@"metadata.json"];
    inst->_state = [root stringByAppendingPathComponent:@"state.json"];
    inst->_systemState = [root stringByAppendingPathComponent:@"system_state.json"];

    return inst;
}

@end
