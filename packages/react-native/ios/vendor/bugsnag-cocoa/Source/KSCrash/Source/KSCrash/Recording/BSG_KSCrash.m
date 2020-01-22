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

#import "BSG_KSCrashAdvanced.h"

#import "BSG_KSCrashC.h"
#import "BSG_KSCrashCallCompletion.h"
#import "BSG_KSJSONCodecObjC.h"
#import "BSG_KSSingleton.h"
#import "BSG_KSSystemCapabilities.h"
#import "NSError+BSG_SimpleConstructor.h"

//#define BSG_KSLogger_LocalLevel TRACE
#import "BSG_KSLogger.h"

#if BSG_KSCRASH_HAS_UIKIT
#import <UIKit/UIKit.h>
#endif

// ============================================================================
#pragma mark - Default Constants -
// ============================================================================

/** The directory under "Caches" to store the crash reports. */
#ifndef BSG_KSCRASH_DefaultReportFilesDirectory
#define BSG_KSCRASH_DefaultReportFilesDirectory @"KSCrashReports"
#endif

// ============================================================================
#pragma mark - Constants -
// ============================================================================

#define BSG_kCrashLogFilenameSuffix "-CrashLog.txt"
#define BSG_kCrashStateFilenameSuffix "-CrashState.json"

// ============================================================================
#pragma mark - Globals -
// ============================================================================

@interface BSG_KSCrash ()

@property(nonatomic, readwrite, retain) NSString *bundleName;
@property(nonatomic, readwrite, retain) NSString *nextCrashID;
@property(nonatomic, readonly, retain) NSString *crashReportPath;
@property(nonatomic, readonly, retain) NSString *recrashReportPath;
@property(nonatomic, readonly, retain) NSString *stateFilePath;

// Mirrored from BSG_KSCrashAdvanced.h to provide ivars
@property(nonatomic, readwrite, retain) id<BSG_KSCrashReportFilter> sink;
@property(nonatomic, readwrite, retain) NSString *logFilePath;
@property(nonatomic, readwrite, retain)
    BSG_KSCrashReportStore *crashReportStore;
@property(nonatomic, readwrite, assign) BSGReportCallback onCrash;
@property(nonatomic, readwrite, assign) bool printTraceToStdout;
@property(nonatomic, readwrite, assign) int maxStoredReports;

@end

@implementation BSG_KSCrash

// ============================================================================
#pragma mark - Properties -
// ============================================================================

@synthesize sink = _sink;
@synthesize userInfo = _userInfo;
@synthesize deleteBehaviorAfterSendAll = _deleteBehaviorAfterSendAll;
@synthesize handlingCrashTypes = _handlingCrashTypes;
@synthesize printTraceToStdout = _printTraceToStdout;
@synthesize onCrash = _onCrash;
@synthesize crashReportStore = _crashReportStore;
@synthesize bundleName = _bundleName;
@synthesize logFilePath = _logFilePath;
@synthesize nextCrashID = _nextCrashID;
@synthesize introspectMemory = _introspectMemory;
@synthesize maxStoredReports = _maxStoredReports;
@synthesize suspendThreadsForUserReported = _suspendThreadsForUserReported;
@synthesize reportWhenDebuggerIsAttached = _reportWhenDebuggerIsAttached;
@synthesize threadTracingEnabled = _threadTracingEnabled;
@synthesize writeBinaryImagesForUserReported =
    _writeBinaryImagesForUserReported;

// ============================================================================
#pragma mark - Lifecycle -
// ============================================================================

IMPLEMENT_EXCLUSIVE_SHARED_INSTANCE(BSG_KSCrash)

- (id)init {
    return [self
        initWithReportFilesDirectory:BSG_KSCRASH_DefaultReportFilesDirectory];
}

- (id)initWithReportFilesDirectory:(NSString *)reportFilesDirectory {
    if ((self = [super init])) {
        self.bundleName = [[NSBundle mainBundle] infoDictionary][@"CFBundleName"];

        NSString *storePath = [BugsnagFileStore findReportStorePath:reportFilesDirectory];

        if (!storePath) {
            BSG_KSLOG_ERROR(
                    @"Failed to initialize crash handler. Crash reporting disabled.");
            return nil;
        }

        self.nextCrashID = [NSUUID UUID].UUIDString;
        self.crashReportStore = [BSG_KSCrashReportStore storeWithPath:storePath];
        self.deleteBehaviorAfterSendAll = BSG_KSCDeleteAlways;
        self.introspectMemory = YES;
        self.maxStoredReports = 5;

        self.suspendThreadsForUserReported = YES;
        self.reportWhenDebuggerIsAttached = NO;
        self.threadTracingEnabled = YES;
        self.writeBinaryImagesForUserReported = YES;
    }
    return self;
}

// ============================================================================
#pragma mark - API -
// ============================================================================

- (void)setUserInfo:(NSDictionary *)userInfo {
    NSError *error = nil;
    NSData *userInfoJSON = nil;
    if (userInfo != nil) {
        userInfoJSON = [self
            nullTerminated:[BSG_KSJSONCodec encode:userInfo
                                           options:BSG_KSJSONEncodeOptionSorted
                                             error:&error]];
        if (error != NULL) {
            BSG_KSLOG_ERROR(@"Could not serialize user info: %@", error);
            return;
        }
    }

    _userInfo = userInfo;
    bsg_kscrash_setUserInfoJSON([userInfoJSON bytes]);
}

- (void)setHandlingCrashTypes:(BSG_KSCrashType)handlingCrashTypes {
    _handlingCrashTypes = bsg_kscrash_setHandlingCrashTypes(handlingCrashTypes);
}

- (void)setPrintTraceToStdout:(bool)printTraceToStdout {
    _printTraceToStdout = printTraceToStdout;
    bsg_kscrash_setPrintTraceToStdout(printTraceToStdout);
}

- (void)setOnCrash:(BSGReportCallback)onCrash {
    _onCrash = onCrash;
    bsg_kscrash_setCrashNotifyCallback(onCrash);
}

- (void)setIntrospectMemory:(bool)introspectMemory {
    _introspectMemory = introspectMemory;
    bsg_kscrash_setIntrospectMemory(introspectMemory);
}

- (void)setSuspendThreadsForUserReported:(BOOL)suspendThreadsForUserReported {
    _suspendThreadsForUserReported = suspendThreadsForUserReported;
    bsg_kscrash_setSuspendThreadsForUserReported(suspendThreadsForUserReported);
}

- (void)setReportWhenDebuggerIsAttached:(BOOL)reportWhenDebuggerIsAttached {
    _reportWhenDebuggerIsAttached = reportWhenDebuggerIsAttached;
    bsg_kscrash_setReportWhenDebuggerIsAttached(reportWhenDebuggerIsAttached);
}

- (void)setThreadTracingEnabled:(BOOL)threadTracingEnabled {
    _threadTracingEnabled = threadTracingEnabled;
    bsg_kscrash_setThreadTracingEnabled(threadTracingEnabled);
}

- (void)setWriteBinaryImagesForUserReported:
    (BOOL)writeBinaryImagesForUserReported {
    _writeBinaryImagesForUserReported = writeBinaryImagesForUserReported;
    bsg_kscrash_setWriteBinaryImagesForUserReported(
        writeBinaryImagesForUserReported);
}

- (NSString *)crashReportPath {
    return [self.crashReportStore pathToFileWithId:self.nextCrashID];
}

- (NSString *)recrashReportPath {
    return [self.crashReportStore pathToRecrashReportWithID:self.nextCrashID];
}

- (NSString *)stateFilePath {
    NSString *stateFilename = [NSString
        stringWithFormat:@"%@" BSG_kCrashStateFilenameSuffix, self.bundleName];
    return [self.crashReportStore.path
        stringByAppendingPathComponent:stateFilename];
}

- (BOOL)install {
    _handlingCrashTypes = bsg_kscrash_install(
        [self.crashReportPath UTF8String], [self.recrashReportPath UTF8String],
        [self.stateFilePath UTF8String], [self.nextCrashID UTF8String]);
    if (self.handlingCrashTypes == 0) {
        return false;
    }

#if BSG_KSCRASH_HAS_UIKIT
    NSNotificationCenter *nCenter = [NSNotificationCenter defaultCenter];
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
    [nCenter addObserver:self
                selector:@selector(applicationWillTerminate)
                    name:UIApplicationWillTerminateNotification
                  object:nil];
#endif

    return true;
}

- (void)sendAllReportsWithCompletion:
    (BSG_KSCrashReportFilterCompletion)onCompletion {
    [self.crashReportStore pruneFilesLeaving:self.maxStoredReports];

    NSDictionary *reports = [self allReportsByFilename];

    BSG_KSLOG_INFO(@"Sending %d crash reports", [reports count]);

    [self sendReports:reports
         onCompletion:^(NSUInteger sentReportCount, BOOL completed,
                        NSError *error) {
           BSG_KSLOG_DEBUG(@"Process finished with completion: %d", completed);
           if (error != nil) {
               BSG_KSLOG_ERROR(@"Failed to send reports: %@", error);
           }
           if ((self.deleteBehaviorAfterSendAll == BSG_KSCDeleteOnSucess &&
                completed) ||
               self.deleteBehaviorAfterSendAll == BSG_KSCDeleteAlways) {
               [self deleteAllReports];
           }
           bsg_kscrash_i_callCompletion(onCompletion, sentReportCount,
                                        completed, error);
         }];
}

- (void)deleteAllReports {
    [self.crashReportStore deleteAllFiles];
}

- (void)reportUserException:(NSString *)name
                     reason:(NSString *)reason
          originalException:(NSException *)exception
               handledState:(NSDictionary *)handledState
                   appState:(NSDictionary *)appState
          callbackOverrides:(NSDictionary *)overrides
                   metadata:(NSDictionary *)metadata
                     config:(NSDictionary *)config
               discardDepth:(int)depth
           terminateProgram:(BOOL)terminateProgram {
    const char *cName = [name cStringUsingEncoding:NSUTF8StringEncoding];
    const char *cReason = [reason cStringUsingEncoding:NSUTF8StringEncoding];
    NSArray *addresses = [exception callStackReturnAddresses];
    NSUInteger numFrames = [addresses count];
    uintptr_t *callstack = malloc(numFrames * sizeof(*callstack));
    for (NSUInteger i = 0; i < numFrames; i++) {
        callstack[i] = [addresses[i] unsignedLongValue];
    }
    if (numFrames > 0) {
        depth = 0; // reset depth if the stack does not need to be generated
    }
    bsg_kscrash_reportUserException(cName, cReason,
                                    callstack, numFrames,
                                    [handledState[@"currentSeverity"] UTF8String],
                                    [self encodeAsJSONString:handledState],
                                    [self encodeAsJSONString:overrides],
                                    [self encodeAsJSONString:metadata],
                                    [self encodeAsJSONString:appState],
                                    [self encodeAsJSONString:config],
                                    depth,
                                    terminateProgram);

    free(callstack);
}

// ============================================================================
#pragma mark - Advanced API -
// ============================================================================

#define BSG_SYNTHESIZE_CRASH_STATE_PROPERTY(TYPE, NAME)                        \
    -(TYPE)NAME {                                                              \
        return bsg_kscrashstate_currentState()->NAME;                          \
    }

BSG_SYNTHESIZE_CRASH_STATE_PROPERTY(NSTimeInterval,
                                    activeDurationSinceLastCrash)
BSG_SYNTHESIZE_CRASH_STATE_PROPERTY(NSTimeInterval,
                                    backgroundDurationSinceLastCrash)
BSG_SYNTHESIZE_CRASH_STATE_PROPERTY(int, launchesSinceLastCrash)
BSG_SYNTHESIZE_CRASH_STATE_PROPERTY(int, sessionsSinceLastCrash)
BSG_SYNTHESIZE_CRASH_STATE_PROPERTY(NSTimeInterval, activeDurationSinceLaunch)
BSG_SYNTHESIZE_CRASH_STATE_PROPERTY(NSTimeInterval,
                                    backgroundDurationSinceLaunch)
BSG_SYNTHESIZE_CRASH_STATE_PROPERTY(int, sessionsSinceLaunch)
BSG_SYNTHESIZE_CRASH_STATE_PROPERTY(BOOL, crashedLastLaunch)

- (NSUInteger)reportCount {
    return [self.crashReportStore fileCount];
}

- (NSString *)crashReportsPath {
    return self.crashReportStore.path;
}

- (void)sendReports:(NSDictionary <NSString *, NSDictionary *> *)reports
       onCompletion:(BSG_KSCrashReportFilterCompletion)onCompletion {
    if ([reports count] == 0) {
        bsg_kscrash_i_callCompletion(onCompletion, 0, YES, nil);
        return;
    }

    if (self.sink == nil) {
        bsg_kscrash_i_callCompletion(
            onCompletion, 0, NO,
            [NSError bsg_errorWithDomain:[[self class] description]
                                    code:0
                             description:@"No sink set. Crash reports not sent."]);
        return;
    }

    [self.sink filterReports:reports
                onCompletion:^(NSUInteger sentReportCount, BOOL completed,
                               NSError *error) {
                  bsg_kscrash_i_callCompletion(onCompletion, sentReportCount,
                                               completed, error);
                }];
}

- (NSArray *)allReports {
    return [self.crashReportStore allFiles];
}

- (NSDictionary <NSString *, NSDictionary *> *)allReportsByFilename {
    return [self.crashReportStore allFilesByName];
}

- (BOOL)redirectConsoleLogsToFile:(NSString *)fullPath
                        overwrite:(BOOL)overwrite {
    if (bsg_kslog_setLogFilename([fullPath UTF8String], overwrite)) {
        self.logFilePath = fullPath;
        return YES;
    }
    return NO;
}

- (BOOL)redirectConsoleLogsToDefaultFile {
    NSString *logFilename = [NSString
        stringWithFormat:@"%@" BSG_kCrashLogFilenameSuffix, self.bundleName];
    NSString *logFilePath =
        [self.crashReportStore.path stringByAppendingPathComponent:logFilename];
    if (![self redirectConsoleLogsToFile:logFilePath overwrite:YES]) {
        BSG_KSLOG_ERROR(@"Could not redirect logs to %@", logFilePath);
        return NO;
    }
    return YES;
}

// ============================================================================
#pragma mark - Utility -
// ============================================================================


- (NSMutableData *)nullTerminated:(NSData *)data {
    if (data == nil) {
        return NULL;
    }
    NSMutableData *mutable = [NSMutableData dataWithData:data];
    [mutable appendBytes:"\0" length:1];
    return mutable;
}

- (const char *)encodeAsJSONString:(id)object {
    NSError *error = nil;
    NSData *jsonData = [BSG_KSJSONCodec encode:object options:0 error:&error];
    if (jsonData == nil || error != nil) {
        BSG_KSLOG_ERROR(@"Error encoding object to JSON: %@", error);
        // we can still record other useful information from the report
        return NULL;
    }
    NSString *jsonString =
    [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
    return [jsonString cStringUsingEncoding:NSUTF8StringEncoding];
}

// ============================================================================
#pragma mark - Callbacks -
// ============================================================================

- (void)applicationDidBecomeActive {
    bsg_kscrashstate_notifyAppActive(true);
}

- (void)applicationWillResignActive {
    bsg_kscrashstate_notifyAppActive(false);
}

- (void)applicationDidEnterBackground {
    bsg_kscrashstate_notifyAppInForeground(false);
}

- (void)applicationWillEnterForeground {
    bsg_kscrashstate_notifyAppInForeground(true);
}

- (void)applicationWillTerminate {
    bsg_kscrashstate_notifyAppTerminate();
}

@end

//! Project version number for BSG_KSCrashFramework.
const double BSG_KSCrashFrameworkVersionNumber = 1.813;

//! Project version string for BSG_KSCrashFramework.
const unsigned char BSG_KSCrashFrameworkVersionString[] = "1.8.13";
