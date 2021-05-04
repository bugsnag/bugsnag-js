//
//  BugsnagCrashSentry.m
//  Pods
//
//  Created by Jamie Lynch on 11/08/2017.
//
//


#import "BugsnagCrashSentry.h"

#import "BSGFileLocations.h"
#import "BSG_KSCrashAdvanced.h"
#import "BSG_KSCrashC.h"
#import "Bugsnag.h"
#import "BugsnagConfiguration.h"
#import "BugsnagErrorTypes.h"
#import "BugsnagLogger.h"

@implementation BugsnagCrashSentry

- (void)install:(BugsnagConfiguration *)config onCrash:(BSGReportCallback)onCrash
{
    BSG_KSCrash *ksCrash = [BSG_KSCrash sharedInstance];
    ksCrash.introspectMemory = NO;
    ksCrash.onCrash = onCrash;
    ksCrash.maxStoredReports = (int)config.maxPersistedEvents;

    // overridden elsewhere for handled errors, so we can assume that this only
    // applies to unhandled errors
    ksCrash.threadTracingEnabled = config.sendThreads != BSGThreadSendPolicyNever;

    // User reported events do not go through KSCrash
    BSG_KSCrashType crashTypes = 0;
    
    // If Bugsnag is autodetecting errors then the types of event detected is configurable
    // (otherwise it's just the user reported events)
    if (config.autoDetectErrors) {
        // Translate the relevant BSGErrorTypes bitfield into the equivalent BSG_KSCrashType one
        crashTypes = crashTypes | [self mapKSToBSGCrashTypes:config.enabledErrorTypes];
    }
    
    bsg_kscrash_setHandlingCrashTypes(crashTypes);
    
    if ((![ksCrash install:[BSGFileLocations current].kscrashReports])) {
        bsg_log_err(@"Failed to install crash handler. No exceptions will be reported!");
    }
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

@end
