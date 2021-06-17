//
//  BSGAppHangDetector.m
//  Bugsnag
//
//  Created by Nick Dowell on 01/03/2021.
//  Copyright © 2021 Bugsnag Inc. All rights reserved.
//

#import "BSGAppHangDetector.h"

#import <Bugsnag/BugsnagConfiguration.h>
#import <Bugsnag/BugsnagErrorTypes.h>

#import "BSG_KSCrashState.h"
#import "BSG_KSMach.h"
#import "BSG_KSSystemInfo.h"
#import "BugsnagCollections.h"
#import "BugsnagLogger.h"
#import "BugsnagThread+Private.h"

#if TARGET_OS_IOS
#import "BSGUIKit.h"
#endif


@interface BSGAppHangDetector ()

@property (nonatomic) CFRunLoopObserverRef observer;

@end


@implementation BSGAppHangDetector

- (void)dealloc {
    if (_observer) {
        CFRunLoopRemoveObserver(CFRunLoopGetMain(), _observer, kCFRunLoopCommonModes);
    }
}

- (void)startWithDelegate:(id<BSGAppHangDetectorDelegate>)delegate {
    if (self.observer) {
        bsg_log_err(@"Attempted to call %s more than once", __PRETTY_FUNCTION__);
        return;
    }
    
    BugsnagConfiguration *configuration = delegate.configuration;
    if (!configuration.enabledErrorTypes.appHangs) {
        return;
    }
    
    if (NSProcessInfo.processInfo.environment[@"XCTestConfigurationFilePath"]) {
        // Disable functionality during unit testing to avoid crashes that can occur due to there
        // being many leaked BugsnagClient instances and BSGAppHangDetectors running while global
        // shared data structures are being reinitialized.
        return;
    }
    
    const BOOL fatalOnly = configuration.appHangThresholdMillis == BugsnagAppHangThresholdFatalOnly;
    const BOOL recordAllThreads = configuration.sendThreads == BSGThreadSendPolicyAlways;
    const NSTimeInterval threshold = fatalOnly ? 2.0 : (double)configuration.appHangThresholdMillis / 1000.0;
    
    bsg_log_debug(@"Starting App Hang detector with threshold = %g seconds", threshold);
    
    dispatch_queue_t backgroundQueue;
    __block dispatch_semaphore_t semaphore;
    __weak typeof(delegate) weakDelegate = delegate;
    
    backgroundQueue = dispatch_queue_create("com.bugsnag.app-hang-detector", DISPATCH_QUEUE_SERIAL);
    
    void (^ observerBlock)(CFRunLoopObserverRef, CFRunLoopActivity) =
    ^(__attribute__((unused)) CFRunLoopObserverRef observer, CFRunLoopActivity activity) {
        // "Inside the event processing loop after the run loop wakes up, but before processing the event that woke it up"
        if (activity == kCFRunLoopAfterWaiting) {
            if (!semaphore) {
                semaphore = dispatch_semaphore_create(0);
            }
            dispatch_time_t now = dispatch_time(DISPATCH_TIME_NOW, 0);
            // Using dispatch_after prevents our queue showing up in Instruments' Time Profiler until there is a hang.
            // Schedule block slightly ahead of time to work around dispatch_after's leeway.
            dispatch_time_t after = dispatch_time(now, (int64_t)((threshold * 0.95) * NSEC_PER_SEC));
            dispatch_time_t timeout = dispatch_time(now, (int64_t)(threshold * NSEC_PER_SEC));
            dispatch_after(after, backgroundQueue, ^{
                if (dispatch_semaphore_wait(semaphore, timeout) != 0) {
                    if (bsg_ksmachisBeingTraced()) {
                        bsg_log_debug("Ignoring app hang because debugger is attached");
                        dispatch_semaphore_wait(semaphore, DISPATCH_TIME_FOREVER);
                        return;
                    }
                    
                    if (!bsg_kscrashstate_currentState()->applicationIsInForeground) {
                        bsg_log_debug(@"Ignoring app hang because app is in the background");
                        dispatch_semaphore_wait(semaphore, DISPATCH_TIME_FOREVER);
                        return;
                    }
                    
                    bsg_log_info("App hang detected");
                    
                    // Record the date and state before performing any operations like symbolication or loading
                    // breadcrumbs from disk that could introduce delays and lead to misleading event contents.
                    
                    NSDate *date = [NSDate date];
                    NSDictionary *systemInfo = [BSG_KSSystemInfo systemInfo];
                    
                    NSArray<BugsnagThread *> *threads = nil;
                    if (recordAllThreads) {
                        threads = [BugsnagThread allThreads:YES callStackReturnAddresses:NSThread.callStackReturnAddresses];
                        // By default the calling thread is marked as "Error reported from this thread", which is not correct case for app hangs.
                        [threads enumerateObjectsUsingBlock:^(BugsnagThread * _Nonnull thread, NSUInteger idx,
                                                              __attribute__((unused)) BOOL * _Nonnull stop) {
                            thread.errorReportingThread = idx == 0;
                        }];
                    } else {
                        threads = BSGArrayWithObject([BugsnagThread mainThread]);
                    }
                    
                    __strong typeof(weakDelegate) strongDelegate = weakDelegate;
                    
                    [strongDelegate appHangDetectedAtDate:date withThreads:threads systemInfo:systemInfo];
                    
                    dispatch_semaphore_wait(semaphore, DISPATCH_TIME_FOREVER);
                    bsg_log_info("App hang has ended");
                    
                    [strongDelegate appHangEnded];
                }
            });
        }
        
        // "Inside the event processing loop before the run loop sleeps, waiting for a source or timer to fire"
        if (activity == kCFRunLoopBeforeWaiting) {
            if (semaphore) {
                dispatch_semaphore_signal(semaphore);
            }
        }
    };
    
    // A high `order` is required to ensure our observer runs after others that may introduce an app hang.
    // Once such culprit is -[UITableView tableView:didSelectRowAtIndexPath:] which is run in a
    // _afterCACommitHandler, which is invoked via a CFRunLoopObserver.
    CFIndex order = INT_MAX;
    self.observer = CFRunLoopObserverCreateWithHandler(NULL, kCFRunLoopAfterWaiting | kCFRunLoopBeforeWaiting, true, order, observerBlock);
    
    CFRunLoopMode runLoopMode = CFRunLoopCopyCurrentMode(CFRunLoopGetCurrent());
    // The run loop mode will be NULL if called before the run loop has started; e.g. in a +load method.
    if (runLoopMode) {
        // If we are already in the run loop (e.g. in app delegate) start monitoring immediately so that app hangs during app launch are detected.
        observerBlock(self.observer, kCFRunLoopAfterWaiting);
        CFRelease(runLoopMode);
    }
    
    CFRunLoopAddObserver(CFRunLoopGetMain(), self.observer, kCFRunLoopCommonModes);
}

@end
