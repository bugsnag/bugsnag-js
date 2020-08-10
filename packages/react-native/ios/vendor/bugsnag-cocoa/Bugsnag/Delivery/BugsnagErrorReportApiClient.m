//
//  BugsnagErrorReportApiClient.m
//  Pods
//
//  Created by Jamie Lynch on 11/08/2017.
//
//

#import "BugsnagErrorReportApiClient.h"
#import "Bugsnag.h"
#import "BugsnagLogger.h"
#import "BugsnagClient.h"
#import "BugsnagErrorReportSink.h"
#import "BugsnagKeys.h"

@interface BSGDeliveryOperation : NSOperation
@end

@implementation BugsnagErrorReportApiClient

- (NSOperation *)deliveryOperation {
    return [BSGDeliveryOperation new];
}

@end

@implementation BSGDeliveryOperation

- (void)main {
    @autoreleasepool {
        @try {
            [[BSG_KSCrash sharedInstance] sendAllReports];
        } @catch (NSException *e) {
            bsg_log_err(@"Could not send error report: %@", e);
        }
    }
}
@end
