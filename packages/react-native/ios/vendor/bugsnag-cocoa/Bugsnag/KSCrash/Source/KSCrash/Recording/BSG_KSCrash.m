//
//  BSG_KSCrash.m
//
//  Created by Karl Stenerud on 2012-01-28.
//
//  Copyright (c) 2012 Karl Stenerud. All rights reserved.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall remain in place
// in this source code.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
//

#import "BSG_KSCrash.h"

#import "BSG_KSCrashC.h"
#import "BSG_KSCrashIdentifier.h"
#import "BSGDefines.h"
#import "BSGAppKit.h"
#import "BSGUIKit.h"
#import "BSGWatchKit.h"

// ============================================================================
#pragma mark - Constants -
// ============================================================================

#define BSG_kCrashStateFilenameSuffix "-CrashState.json"

@implementation BSG_KSCrash

+ (BSG_KSCrash *)sharedInstance {
    static id sharedInstance;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        bsg_kscrash_init();
        sharedInstance = [[self alloc] init];
    });
    return sharedInstance;
}

- (BSG_KSCrashType)install:(BSG_KSCrashType)crashTypes directory:(NSString *)directory {
    bsg_kscrash_generate_report_initialize(directory.fileSystemRepresentation);
    NSString *nextCrashID = [NSUUID UUID].UUIDString;
    char *crashReportPath = bsg_kscrash_generate_report_path(nextCrashID.UTF8String, false);
    char *recrashReportPath = bsg_kscrash_generate_report_path(nextCrashID.UTF8String, true);
    NSString *stateFilePrefix = [[NSBundle mainBundle] infoDictionary][@"CFBundleName"]
    /* Not all processes have an Info.plist */ ?: NSProcessInfo.processInfo.processName;
    NSString *stateFilePath = [directory stringByAppendingPathComponent:
                               [stateFilePrefix stringByAppendingString:@BSG_kCrashStateFilenameSuffix]];
    
    bsg_kscrash_setHandlingCrashTypes(crashTypes);
    
    BSG_KSCrashType installedCrashTypes = bsg_kscrash_install(
        crashReportPath, recrashReportPath,
        [stateFilePath UTF8String], [nextCrashID UTF8String]);
    
    free(crashReportPath);
    free(recrashReportPath);
    
    NSNotificationCenter *nCenter = [NSNotificationCenter defaultCenter];
#if BSG_HAVE_APPKIT
    // MacOS "active" serves the same purpose as "foreground" in iOS
    [nCenter addObserver:self
                selector:@selector(applicationDidEnterBackground)
                    name:NSApplicationDidResignActiveNotification
                  object:nil];
    [nCenter addObserver:self
                selector:@selector(applicationWillEnterForeground)
                    name:NSApplicationDidBecomeActiveNotification
                  object:nil];
#elif BSG_HAVE_WATCHKIT
    [nCenter addObserver:self
                selector:@selector(applicationDidBecomeActive)
                    name:WKApplicationDidBecomeActiveNotification
                  object:nil];
    [nCenter addObserver:self
                selector:@selector(applicationWillResignActive)
                    name:WKApplicationWillResignActiveNotification
                  object:nil];
    [nCenter addObserver:self
                selector:@selector(applicationDidEnterBackground)
                    name:WKApplicationDidEnterBackgroundNotification
                  object:nil];
    [nCenter addObserver:self
                selector:@selector(applicationWillEnterForeground)
                    name:WKApplicationWillEnterForegroundNotification
                  object:nil];
#else
    [nCenter addObserver:self
                selector:@selector(applicationDidBecomeActive)
                    name:UIApplicationDidBecomeActiveNotification
                  object:nil];
    [nCenter addObserver:self
                selector:@selector(applicationWillResignActive)
                    name:UIApplicationWillResignActiveNotification
                  object:nil];
    [nCenter addObserver:self
                selector:@selector(applicationDidEnterBackground)
                    name:UIApplicationDidEnterBackgroundNotification
                  object:nil];
    [nCenter addObserver:self
                selector:@selector(applicationWillEnterForeground)
                    name:UIApplicationWillEnterForegroundNotification
                  object:nil];
#endif

    return installedCrashTypes;
}

// ============================================================================
#pragma mark - Callbacks -
// ============================================================================

- (void)applicationDidBecomeActive {
    bsg_kscrashstate_notifyAppInForeground(true);
}

- (void)applicationWillResignActive {
    bsg_kscrashstate_notifyAppInForeground(true);
}

- (void)applicationDidEnterBackground {
    bsg_kscrashstate_notifyAppInForeground(false);
}

- (void)applicationWillEnterForeground {
    bsg_kscrashstate_notifyAppInForeground(true);
}

@end

//! Project version number for BSG_KSCrashFramework.
//const double BSG_KSCrashFrameworkVersionNumber = 1.813;

//! Project version string for BSG_KSCrashFramework.
//const unsigned char BSG_KSCrashFrameworkVersionString[] = "1.8.13";
