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
#import "BugsnagSink.h"
#import "BugsnagConfiguration.h"
#import "Bugsnag.h"

NSUInteger const BSG_MAX_STORED_REPORTS = 12;

@implementation BugsnagCrashSentry

- (void)install:(BugsnagConfiguration *)config
      apiClient:(BugsnagErrorReportApiClient *)apiClient
        onCrash:(BSGReportCallback)onCrash
{
    BugsnagSink *sink = [[BugsnagSink alloc] initWithApiClient:apiClient];
    [BSG_KSCrash sharedInstance].sink = sink;
    [BSG_KSCrash sharedInstance].introspectMemory = YES;
    [BSG_KSCrash sharedInstance].deleteBehaviorAfterSendAll =
        BSG_KSCDeleteOnSuccess;
    [BSG_KSCrash sharedInstance].onCrash = onCrash;
    [BSG_KSCrash sharedInstance].maxStoredReports = BSG_MAX_STORED_REPORTS;
    
    // User reported events are *always* handled
    BSG_KSCrashType crashTypes = BSG_KSCrashTypeUserReported;
    
    // If Bugsnag is autodetecting errors then the types of event detected is configurable
    // (otherwise it's just the user reported events)
    if (config.autoDetectErrors) {
        BSGErrorType errorTypes = [config enabledErrorTypes];
        // Translate the relevant BSGErrorTypes bitfield into the equivalent BSG_KSCrashType one
        crashTypes = crashTypes | [self mapKSToBSGCrashTypes:errorTypes];
    }
    
    bsg_kscrash_setHandlingCrashTypes(crashTypes);
    
    if (![[BSG_KSCrash sharedInstance] install])
        bsg_log_err(@"Failed to install crash handler. No exceptions will be reported!");

    [sink.apiClient flushPendingData];
}

/**
 * Map the BSGErrorType bitfield of reportable events to the equivalent KSCrash one.
 * OOMs are dealt with exclusively in the Bugsnag layer so omitted from consideration here.
 * User reported events should always be included and so also not dealt with here.
 *
 * @param bsgCrashMask The BSGErrorType bitfield
 * @returns A BSG_KSCrashType equivalent (with the above caveats) to the input
 */
- (BSG_KSCrashType)mapKSToBSGCrashTypes:(BSGErrorType)bsgCrashMask
{
    BSG_KSCrashType crashType;
    crashType = (bsgCrashMask & BSGErrorTypesNSExceptions ? BSG_KSCrashTypeNSException   : 0)
              | (bsgCrashMask & BSGErrorTypesCPP          ? BSG_KSCrashTypeCPPException  : 0)
              | (bsgCrashMask & BSGErrorTypesSignals      ? BSG_KSCrashTypeSignal        : 0)
              | (bsgCrashMask & BSGErrorTypesMach         ? BSG_KSCrashTypeMachException : 0);
    return crashType;
}

- (void)reportUserException:(NSString *)reportName
                     reason:(NSString *)reportMessage
          originalException:(NSException *)ex
               handledState:(NSDictionary *)handledState
                   appState:(NSDictionary *)appState
          callbackOverrides:(NSDictionary *)overrides
                   metadata:(NSDictionary *)metadata
                     config:(NSDictionary *)config
               discardDepth:(int)depth
{
    [[BSG_KSCrash sharedInstance] reportUserException:reportName
                                               reason:reportMessage
                                    originalException:ex
                                         handledState:handledState
                                             appState:appState
                                    callbackOverrides:overrides
                                             metadata:metadata
                                               config:config
                                         discardDepth:depth
                                     terminateProgram:NO];
}

@end
