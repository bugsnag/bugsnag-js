//
//  BSGCrashSentry.m
//  Bugsnag
//
//  Created by Jamie Lynch on 11/08/2017.
//
//

#import "BSGCrashSentry.h"

#import "BSGDefines.h"
#import "BSGFileLocations.h"
#import "BSG_KSCrash.h"
#import "BSG_KSCrashC.h"
#import "BSG_KSMach.h"
#import "BugsnagConfiguration.h"
#import "BugsnagErrorTypes.h"
#import "BugsnagLogger.h"

void BSGCrashSentryInstall(BugsnagConfiguration *config, BSG_KSReportWriteCallback onCrash) {
    BSG_KSCrash *ksCrash = [BSG_KSCrash sharedInstance];

    bsg_kscrash_setCrashNotifyCallback(onCrash);

#if BSG_HAVE_MACH_THREADS
    // overridden elsewhere for handled errors, so we can assume that this only
    // applies to unhandled errors
    bsg_kscrash_setThreadTracingEnabled(config.sendThreads != BSGThreadSendPolicyNever);
#endif

    BSG_KSCrashType crashTypes = 0;
    if (config.autoDetectErrors) {
        if (bsg_ksmachisBeingTraced()) {
            bsg_log_info(@"Unhandled errors will not be reported because a debugger is attached");
        } else {
            crashTypes = BSG_KSCrashTypeFromBugsnagErrorTypes(config.enabledErrorTypes);
        }
    }

    // In addition to installing crash handlers, -[BSG_KSCrash install:] initializes various
    // subsystems that Bugsnag relies on, so needs to be called even if autoDetectErrors is disabled.
    if ((![ksCrash install:crashTypes directory:[BSGFileLocations current].kscrashReports] && crashTypes)) {
        bsg_log_err(@"Failed to install crash handlers; no exceptions or crashes will be reported");
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
BSG_KSCrashType BSG_KSCrashTypeFromBugsnagErrorTypes(BugsnagErrorTypes *errorTypes) {
    return ((errorTypes.unhandledExceptions ?   BSG_KSCrashTypeNSException : 0)     |
            (errorTypes.cppExceptions ?         BSG_KSCrashTypeCPPException : 0)    |
#if !TARGET_OS_WATCH
            (errorTypes.signals ?               BSG_KSCrashTypeSignal : 0)          |
            (errorTypes.machExceptions ?        BSG_KSCrashTypeMachException : 0)   |
#endif
            0);
}
