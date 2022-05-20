//
//  BSGFileLocations.m
//  Bugsnag
//
//  Created by Karl Stenerud on 05.01.21.
//  Copyright © 2021 Bugsnag Inc. All rights reserved.
//

#import "BSGFileLocations.h"

#import "BSGInternalErrorReporter.h"
#import "BugsnagLogger.h"

static void ReportInternalError(NSString *errorClass, NSError *error) {
    NSString *file = @(__FILE__).lastPathComponent;
    NSString *message = BSGErrorDescription(error);
    NSString *groupingHash = [NSString stringWithFormat:@"%@: %@: %@ %ld", file, errorClass, error.domain, (long)error.code];
    [BSGInternalErrorReporter performBlock:^(BSGInternalErrorReporter *reporter) {
        [reporter reportErrorWithClass:errorClass message:message diagnostics:error.userInfo groupingHash:groupingHash];
    }];
}

static BOOL ensureDirExists(NSString *path) {
    NSFileManager *fileManager = [NSFileManager defaultManager];
    NSError *error = nil;
    if(![fileManager createDirectoryAtPath:path withIntermediateDirectories:YES attributes:nil error:&error]) {
        bsg_log_err(@"Could not create directory %@: %@", path, error);
        static dispatch_once_t onceToken;
        dispatch_once(&onceToken, ^{
            ReportInternalError(@"Could not create directory", error);
        });
        return NO;
    }
    return YES;
}

static NSString *rootDirectory(NSString *fsVersion) {
    // Default to an unusable location that will always fail.
    static NSString* rootPath = @"/";

    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
#if TARGET_OS_TV
        // On tvOS, locations outside the caches directory are not writable, so fall back to using that.
        // https://developer.apple.com/library/archive/documentation/General/Conceptual/AppleTV_PG/index.html#//apple_ref/doc/uid/TP40015241
        NSSearchPathDirectory directory = NSCachesDirectory;
#else
        NSSearchPathDirectory directory = NSApplicationSupportDirectory;
#endif
        NSError *error = nil;
        NSURL *url = [NSFileManager.defaultManager URLForDirectory:directory inDomain:NSUserDomainMask appropriateForURL:nil create:NO error:&error];
        if (!url) {
            bsg_log_err(@"Could not locate directory for storage: %@", error);
            return;
        }

        rootPath = [NSString stringWithFormat:@"%@/com.bugsnag.Bugsnag/%@/%@",
                    url.path,
                    // Processes that don't have an Info.plist have no bundleIdentifier
                    NSBundle.mainBundle.bundleIdentifier ?: NSProcessInfo.processInfo.processName,
                    fsVersion];

        ensureDirExists(rootPath);
    });

    return rootPath;
}

static NSString *getAndCreateSubdir(NSString *rootPath, NSString *relativePath) {
    NSString *subdirPath = [rootPath stringByAppendingPathComponent:relativePath];
    ensureDirExists(subdirPath);
    return subdirPath;
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
    return [[BSGFileLocations alloc] initWithVersion1];
}

- (instancetype)initWithVersion1 {
    if ((self = [super init])) {
        NSString *root = rootDirectory(@"v1");
        _events = getAndCreateSubdir(root, @"events");
        _sessions = getAndCreateSubdir(root, @"sessions");
        _breadcrumbs = getAndCreateSubdir(root, @"breadcrumbs");
        _kscrashReports = getAndCreateSubdir(root, @"KSCrashReports");
        _appHangEvent = [root stringByAppendingPathComponent:@"app_hang.json"];
        _flagHandledCrash = [root stringByAppendingPathComponent:@"bugsnag_handled_crash.txt"];
        _configuration = [root stringByAppendingPathComponent:@"config.json"];
        _metadata = [root stringByAppendingPathComponent:@"metadata.json"];
        _runContext = [root stringByAppendingPathComponent:@"run_context"];
        _state = [root stringByAppendingPathComponent:@"state.json"];
        _systemState = [root stringByAppendingPathComponent:@"system_state.json"];
    }
    return self;
}

@end
