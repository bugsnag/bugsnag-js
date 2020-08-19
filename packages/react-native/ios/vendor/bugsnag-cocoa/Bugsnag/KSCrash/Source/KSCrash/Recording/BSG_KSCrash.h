//
//  BSG_KSCrash.h
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

#import <Foundation/Foundation.h>

#import "BugsnagErrorReportSink.h"
#import "BSGOnErrorSentBlock.h"
#import "BSG_KSCrashReportWriter.h"
#import "BSG_KSCrashType.h"
#import "BugsnagConfiguration.h"

/**
 * Reports any crashes that occur in the application.
 *
 * The crash reports will be located in $APP_HOME/Library/Caches/KSCrashReports
 */
@interface BSG_KSCrash : NSObject

/** A dictionary containing any info you'd like to appear in crash reports. Must
 * contain only JSON-safe data: NSString for keys, and NSDictionary, NSArray,
 * NSString, NSDate, and NSNumber for values.
 *
 * Default: nil
 */
@property(nonatomic, readwrite, retain) NSDictionary *userInfo;

/** The crash types that are being handled.
 * Note: This value may change once BSG_KSCrash is installed if some handlers
 *       fail to install.
 */
@property(nonatomic, readwrite, assign) BSG_KSCrashType handlingCrashTypes;

/** If YES, introspect memory contents during a crash.
 * Any Objective-C objects or C strings near the stack pointer or referenced by
 * cpu registers or exceptions will be recorded in the crash report, along with
 * their contents.
 *
 * Default: YES
 */
@property(nonatomic, readwrite, assign) bool introspectMemory;

/** Get the singleton instance of the crash reporter.
 */
+ (BSG_KSCrash *)sharedInstance;

/** Install the crash reporter.
 * The reporter will record crashes, but will not send any crash reports unless
 * sink is set.
 *
 * @return YES if the reporter successfully installed.
 */
- (BOOL)install;

/** Send any outstanding crash reports to the current sink.
 * It will only attempt to send the most recent 5 reports. All others will be
 * deleted. Once the reports are successfully sent to the server, they may be
 * deleted locally.
 *
 * Note: property "sink" MUST be set or else this method will call the block
 *       with an error.
 */
- (void)sendAllReports;

/** Report a custom, user defined exception.
 * This can be useful when dealing with scripting languages.
 *
 * If terminateProgram is true, all sentries will be uninstalled and the
 * application will terminate with an abort().
 *
 * @param name The exception name (for namespacing exception types).
 * @param reason A description of why the exception occurred
 * @param handledState The severity, reason, and handled-ness of the report
 * @param appState breadcrumbs and other app environmental info
 * @param overrides Report fields overridden by callbacks, collated in the
 *        final report
 * @param eventOverrides the Bugsnag Error Payload, for handled errors only
 * @param metadata additional information to attach to the report
 * @param config delivery options
 */
- (void)reportUserException:(NSString *)name
                     reason:(NSString *)reason
               handledState:(NSDictionary *)handledState
                   appState:(NSDictionary *)appState
          callbackOverrides:(NSDictionary *)overrides
             eventOverrides:(NSDictionary *)eventOverrides
                   metadata:(NSDictionary *)metadata
                     config:(NSDictionary *)config;

/**
 * Collects a trace of all the threads running in application, if the user has
 * configured this behaviour, and serializes them into an array of BugsnagThread.
 *
 * @param exc the exception to record
 * @param depth the number of frames to discard from the main thread's stacktrace
 * @param recordAllThreads whether all threads should be recorded or just the
 * main thread's stacktrace
 * @return an array of BugsnagThread
 */
- (NSArray<BugsnagThread *> *)captureThreads:(NSException *)exc
                                       depth:(int)depth
                            recordAllThreads:(BOOL)recordAllThreads;

/**
 * Collects information about the application's foreground state (duration in foreground/background)
 */
- (NSDictionary *)captureAppStats;

/** If YES, reports will be sent even if a debugger is attached
 *
 * Default: NO
 */
@property(nonatomic, readwrite, assign) BOOL reportWhenDebuggerIsAttached;

/**
* The methodology used for tracing threads.
 */
@property(nonatomic, readwrite, assign) BOOL threadTracingEnabled;

/**
 * If YES, binary images will be collected for each report.
 */
@property(nonatomic, readwrite, assign) BOOL writeBinaryImagesForUserReported;

@end

//! Project version number for BSG_KSCrashFramework.
FOUNDATION_EXPORT const double BSG_KSCrashFrameworkVersionNumber;

//! Project version string for BSG_KSCrashFramework.
FOUNDATION_EXPORT const unsigned char BSG_KSCrashFrameworkVersionString[];
