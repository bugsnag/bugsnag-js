//
//  BugsnagSink.m
//
//  Created by Conrad Irwin on 2014-10-01.
//
//  Copyright (c) 2014 Bugsnag, Inc. All rights reserved.
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

#import "BugsnagErrorReportSink+Private.h"

#import "BSG_KSSystemInfo.h"
#import "Bugsnag+Private.h"
#import "BugsnagClient+Private.h"
#import "BugsnagCollections.h"
#import "BugsnagConfiguration+Private.h"
#import "BugsnagErrorReportApiClient.h"
#import "BugsnagEvent+Private.h"
#import "BugsnagKeys.h"
#import "BugsnagLogger.h"
#import "BugsnagNotifier.h"

@interface BugsnagErrorReportSink ()
@property NSMutableSet<NSString *> *activeRequests;
@end

@implementation BugsnagErrorReportSink

- (instancetype)initWithApiClient:(BugsnagErrorReportApiClient *)apiClient
                    configuration:(BugsnagConfiguration *)configuration
                         notifier:(BugsnagNotifier *)notifier {
    if ((self = [super init])) {
        _apiClient = apiClient;
        _activeRequests = [NSMutableSet new];
        _configuration = configuration;
        _notifier = notifier;
    }
    return self;
}

/**
 * Returns a list of filenames which have no ongoing request and need to be delivered to the error reporting API.
 *
 * To prevent duplicate reports filenames are recorded in an internal collection when they are
 * in the process of being sent in a request. This method adds any unqueued files to this internal collection.
 * Once the request has complete the filename should be removed via a separate method.
 */
- (NSArray<NSString *> *)prepareNewRequests:(NSArray<NSString *> *)allRequests {
    NSMutableArray *newRequests = [allRequests mutableCopy];
    @synchronized (self.activeRequests) {
        NSArray *enqueuedRequests = [self.activeRequests allObjects];
        [newRequests removeObjectsInArray:enqueuedRequests];
        [self.activeRequests addObjectsFromArray:newRequests];
    }
    return newRequests;
}

- (void)finishActiveRequest:(nonnull NSString *)requestId
                  completed:(BOOL)completed
                      error:(NSError *)error
                      block:(nonnull BSGOnErrorSentBlock)block {
    block(requestId, completed, error);
    @synchronized (self.activeRequests) {
        [self.activeRequests removeObject:requestId];
    }
}

- (void)sendStoredReports:(NSDictionary <NSString *, NSDictionary *> *)ksCrashReports
                withBlock:(BSGOnErrorSentBlock)block {
                    
    // 1. check whether filenames are in the dictionary, if so add them
    // 2. If not, add them and enqueue a request
    // 3. If so, ignore them and perform no action
    // 4. When a request has completed and deleted the file, remove the files from the dictionary
    NSArray<NSString *> *keys = [self prepareNewRequests:[ksCrashReports allKeys]];
    NSMutableDictionary<NSString *, BugsnagEvent *>* storedEvents = [NSMutableDictionary new];

    // run user callbacks on events before enqueueing any requests, as
    // this way events can be discarded quickly. This frees up disk
    // space for any events which are captured in the meantime.
    for (NSString *fileKey in keys) {
        NSDictionary *report = ksCrashReports[fileKey];
        BugsnagEvent *event = [[BugsnagEvent alloc] initWithKSReport:report];
        event.redactedKeys = self.configuration.redactedKeys;
        
        NSString *errorClass = event.errors.firstObject.errorClass;
        if ([self.configuration shouldDiscardErrorClass:errorClass]) {
            bsg_log_info(@"Discarding event because errorClass \"%@\" matched configuration.discardClasses", errorClass);
            [self finishActiveRequest:fileKey completed:YES error:nil block:block];
            continue;
        }
        
        if (self.configuration.shouldSendReports && [event shouldBeSent] && [self runOnSendBlocksForEvent:event]) {
            storedEvents[fileKey] = event;
        } else { // delete the report as the user has discarded it
            [self finishActiveRequest:fileKey completed:YES error:nil block:block];
        }
    }
    [self deliverStoredEvents:storedEvents block:block];
}

- (void)deliverStoredEvents:(NSMutableDictionary<NSString *, BugsnagEvent *> *)storedEvents block:(BSGOnErrorSentBlock)block {
    for (NSString *filename in storedEvents) {
        BugsnagEvent *event = storedEvents[filename];
        NSDictionary *requestPayload = [self prepareEventPayload:event];

        NSMutableDictionary *apiHeaders = [self.configuration.errorApiHeaders mutableCopy];
        apiHeaders[BugsnagHTTPHeaderNameApiKey] = event.apiKey;
        apiHeaders[BugsnagHTTPHeaderNameStacktraceTypes] = [event.stacktraceTypes componentsJoinedByString:@","];
        [self.apiClient sendJSONPayload:requestPayload headers:apiHeaders toURL:self.configuration.notifyURL
                      completionHandler:^(BugsnagApiClientDeliveryStatus status, NSError *error) {
            BOOL completed = status == BugsnagApiClientDeliveryStatusDelivered || status == BugsnagApiClientDeliveryStatusUndeliverable;
            [self finishActiveRequest:filename completed:completed error:error block:block];
        }];
    }
}

- (BOOL)runOnSendBlocksForEvent:(BugsnagEvent *)event {
    for (BugsnagOnSendErrorBlock onSendErrorBlock in self.configuration.onSendBlocks) {
        @try {
            if (!onSendErrorBlock(event)) {
                return false;
            }
        } @catch (NSException *exception) {
            bsg_log_err(@"Error from onSend callback: %@", exception);
        }
    }
    return true;
}

/**
 * Generates an Error Reporting API payload that can be sent to Bugsnag.
 * @param event a single BugsnagEvent
 * @return an Error Reporting API payload represented as a serializable dictionary
 */
- (NSDictionary *)prepareEventPayload:(BugsnagEvent *)event {
    if (!event.app.type) {
        // Use current value for crashes from older notifier versions that didn't persist config.appType
        event.app.type = self.configuration.appType;
    }
    if (!event.apiKey) {
        event.apiKey = self.configuration.apiKey;
    }
    NSMutableDictionary *data = [[NSMutableDictionary alloc] init];
    data[BSGKeyNotifier] = [self.notifier toDict];
    data[BSGKeyApiKey] = event.apiKey;
    data[BSGKeyPayloadVersion] = @"4.0";
    data[BSGKeyEvents] = @[[event toJson]];
    return data;
}

@end
