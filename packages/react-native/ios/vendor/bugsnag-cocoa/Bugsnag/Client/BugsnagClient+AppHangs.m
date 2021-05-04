//
//  BugsnagClient+AppHangs.m
//  Bugsnag
//
//  Created by Nick Dowell on 08/03/2021.
//  Copyright © 2021 Bugsnag Inc. All rights reserved.
//

#import "BugsnagClient+AppHangs.h"

#import "BSGEventUploader.h"
#import "BSGFileLocations.h"
#import "BSGJSONSerialization.h"
#import "BSG_KSSystemInfo.h"
#import "BugsnagBreadcrumbs.h"
#import "BugsnagError+Private.h"
#import "BugsnagEvent+Private.h"
#import "BugsnagHandledState.h"
#import "BugsnagLogger.h"
#import "BugsnagSession+Private.h"
#import "BugsnagSessionTracker.h"
#import "BugsnagThread+Private.h"

@implementation BugsnagClient (AppHangs)

- (void)startAppHangDetector {
    [NSFileManager.defaultManager removeItemAtPath:BSGFileLocations.current.appHangEvent error:nil];
    
    self.appHangDetector = [[BSGAppHangDetector alloc] init];
    [self.appHangDetector startWithDelegate:self];
}

- (void)appHangDetectedWithThreads:(nonnull NSArray<BugsnagThread *> *)threads {
    NSDictionary *systemInfo = [BSG_KSSystemInfo systemInfo];
    
    NSString *message = [NSString stringWithFormat:@"The app's main thread failed to respond to an event within %d milliseconds",
                         (int)self.configuration.appHangThresholdMillis];
    
    BugsnagError *error =
    [[BugsnagError alloc] initWithErrorClass:@"App Hang"
                                errorMessage:message
                                   errorType:BSGErrorTypeCocoa
                                  stacktrace:threads.firstObject.stacktrace];
    
    BugsnagHandledState *handledState =
    [[BugsnagHandledState alloc] initWithSeverityReason:AppHang
                                               severity:BSGSeverityWarning
                                              unhandled:NO
                                    unhandledOverridden:NO
                                              attrValue:nil];
    
    self.appHangEvent =
    [[BugsnagEvent alloc] initWithApp:[self generateAppWithState:systemInfo]
                               device:[self generateDeviceWithState:systemInfo]
                         handledState:handledState
                                 user:self.configuration.user
                             metadata:[self.metadata deepCopy]
                          breadcrumbs:self.breadcrumbs.breadcrumbs ?: @[]
                               errors:@[error]
                              threads:threads
                              session:self.sessionTracker.runningSession];
    
    self.appHangEvent.context = self.context;
    
    NSError *writeError = nil;
    NSDictionary *json = [self.appHangEvent toJsonWithRedactedKeys:self.configuration.redactedKeys];
    if (![BSGJSONSerialization writeJSONObject:json toFile:BSGFileLocations.current.appHangEvent options:0 error:&writeError]) {
        bsg_log_err(@"Could not write app_hang.json: %@", error);
    }
}

- (void)appHangEnded {
    NSError *error = nil;
    if (![NSFileManager.defaultManager removeItemAtPath:BSGFileLocations.current.appHangEvent error:&error]) {
        bsg_log_err(@"Could not delete app_hang.json: %@", error);
    }
    
    const BOOL fatalOnly = self.configuration.appHangThresholdMillis == BugsnagAppHangThresholdFatalOnly;
    if (!fatalOnly && self.appHangEvent) {
        [self notifyInternal:(BugsnagEvent * _Nonnull)self.appHangEvent block:nil];
    }
    self.appHangEvent = nil;
}

- (nullable BugsnagEvent *)loadFatalAppHangEvent {
    NSError *error = nil;
    NSDictionary *json = [BSGJSONSerialization JSONObjectWithContentsOfFile:BSGFileLocations.current.appHangEvent options:0 error:&error];
    if (!json) {
        if (!(error.domain == NSCocoaErrorDomain && error.code == NSFileReadNoSuchFileError)) {
            bsg_log_err(@"Could not read app_hang.json: %@", error);
        }
        return nil;
    }
    
    BugsnagEvent *event = [[BugsnagEvent alloc] initWithJson:json];
    if (!event) {
        bsg_log_err(@"Could not parse app_hang.json");
        return nil;
    }
    
    // Update event to reflect that the app hang was fatal.
    event.errors.firstObject.errorMessage = @"The app was terminated while unresponsive";
    // Cannot set event.severity directly because that sets severityReason.type to "userCallbackSetSeverity"
    event.handledState = [[BugsnagHandledState alloc] initWithSeverityReason:AppHang
                                                                    severity:BSGSeverityError
                                                                   unhandled:YES
                                                         unhandledOverridden:NO
                                                                   attrValue:nil];
    event.session.unhandledCount++;
    
    return event;
}

@end
