//
//  BugsnagCrashSentry.m
//  Pods
//
//  Created by Jamie Lynch on 11/08/2017.
//
//

#import "BSG_KSCrashAdvanced.h"
#import "BSG_KSCrashC.h"

#import "BugsnagCrashSentry.h"
#import "BugsnagLogger.h"
#import "BugsnagErrorReportSink.h"
#import "BugsnagConfiguration.h"
#import "Bugsnag.h"
#import "BugsnagErrorTypes.h"

NSUInteger const BSG_MAX_STORED_REPORTS = 12;

@implementation BugsnagCrashSentry

- (void)install:(BugsnagConfiguration *)config
      apiClient:(BugsnagErrorReportApiClient *)apiClient
        onCrash:(BSGReportCallback)onCrash
{
    BugsnagErrorReportSink *sink = [[BugsnagErrorReportSink alloc] initWithApiClient:apiClient];
    BSG_KSCrash *ksCrash = [BSG_KSCrash sharedInstance];
    ksCrash.sink = sink;
    ksCrash.introspectMemory = YES;
    ksCrash.onCrash = onCrash;
    ksCrash.maxStoredReports = BSG_MAX_STORED_REPORTS;

    // overridden elsewhere for handled errors, so we can assume that this only
    // applies to unhandled errors
    ksCrash.threadTracingEnabled = config.sendThreads != BSGThreadSendPolicyNever;

    // User reported events are *always* handled
    BSG_KSCrashType crashTypes = BSG_KSCrashTypeUserReported;
    
    // If Bugsnag is autodetecting errors then the types of event detected is configurable
    // (otherwise it's just the user reported events)
    if (config.autoDetectErrors) {
        // Translate the relevant BSGErrorTypes bitfield into the equivalent BSG_KSCrashType one
        crashTypes = crashTypes | [self mapKSToBSGCrashTypes:config.enabledErrorTypes];
    }
    
    bsg_kscrash_setHandlingCrashTypes(crashTypes);
    
    if ((![ksCrash install])) {
        bsg_log_err(@"Failed to install crash handler. No exceptions will be reported!");
    }

    [sink.apiClient flushPendingData];
}

/**
 * Map the BSGErrorType bitfield of reportable events to the equivalent KSCrash one.
 * OOMs are dealt with exclusively in the Bugsnag layer so omitted from consideration here.
 * User reported events should always be included and so also not dealt with here.
 *
 * @param errorTypes The enabled error types
 * @returns A BSG_KSCrashType equivalent (with the above caveats) to the input
 */
- (BSG_KSCrashType)mapKSToBSGCrashTypes:(BugsnagErrorTypes *)errorTypes
{
    return (BSG_KSCrashType) ((errorTypes.unhandledExceptions ? BSG_KSCrashTypeNSException : 0)
                    | (errorTypes.cppExceptions ? BSG_KSCrashTypeCPPException : 0)
                    | (errorTypes.signals ? BSG_KSCrashTypeSignal : 0)
                    | (errorTypes.machExceptions ? BSG_KSCrashTypeMachException : 0));
}

- (void)reportUserException:(NSString *)reportName
                     reason:(NSString *)reportMessage
               handledState:(NSDictionary *)handledState
                   appState:(NSDictionary *)appState
          callbackOverrides:(NSDictionary *)overrides
             eventOverrides:(NSDictionary *)eventOverrides
                   metadata:(NSDictionary *)metadata
                     config:(NSDictionary *)config {
    [[BSG_KSCrash sharedInstance] reportUserException:reportName
                                               reason:reportMessage
                                         handledState:handledState
                                             appState:appState
                                    callbackOverrides:overrides
                                       eventOverrides:eventOverrides
                                             metadata:metadata
                                               config:config];
}

@end
