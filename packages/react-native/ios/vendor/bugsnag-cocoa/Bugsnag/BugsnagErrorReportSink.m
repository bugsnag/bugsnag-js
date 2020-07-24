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

#import "BugsnagErrorReportSink.h"
#import "Bugsnag.h"
#import "BugsnagLogger.h"
#import "BugsnagCollections.h"
#import "BugsnagClient.h"
#import "BugsnagClientInternal.h"
#import "BugsnagKeys.h"
#import "BugsnagNotifier.h"
#import "BSG_KSSystemInfo.h"
#import "Private.h"

// This is private in Bugsnag, but really we want package private so define
// it here.
@interface Bugsnag ()
+ (BugsnagClient *)client;
@end

@interface BugsnagNotifier ()
- (NSDictionary *)toDict;
@end

@interface BugsnagEvent ()
- (NSDictionary *_Nonnull)toJson;
- (BOOL)shouldBeSent;
- (instancetype _Nonnull)initWithKSReport:(NSDictionary *_Nonnull)report;
@property NSSet<NSString *> *redactedKeys;
@end

@interface BugsnagConfiguration ()
@property(nonatomic, readwrite, strong) NSMutableArray *onSendBlocks;
- (NSDictionary *_Nonnull)errorApiHeaders;
- (NSDictionary *_Nonnull)sessionApiHeaders;
@property(readonly, retain, nullable) NSURL *sessionURL;
@property(readonly, retain, nullable) NSURL *notifyURL;
@end

@interface BugsnagErrorReportSink ()
@property NSMutableSet<NSString *> *activeRequests;
@end

@implementation BugsnagErrorReportSink

- (instancetype)initWithApiClient:(BugsnagErrorReportApiClient *)apiClient {
    if (self = [super init]) {
        self.apiClient = apiClient;
        self.activeRequests = [NSMutableSet new];
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

- (void)finishActiveRequest:(NSString *)requestId
                    success:(BOOL)success
                      error:(NSError *)error
                      block:(BSGOnErrorSentBlock)block {
    block(requestId, success, error);
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
    BugsnagConfiguration *configuration = [Bugsnag configuration];

    // run user callbacks on events before enqueueing any requests, as
    // this way events can be discarded quickly. This frees up disk
    // space for any events which are captured in the meantime.
    for (NSString *fileKey in keys) {
        NSDictionary *report = ksCrashReports[fileKey];
        BugsnagEvent *event = [[BugsnagEvent alloc] initWithKSReport:report];
        event.redactedKeys = configuration.redactedKeys;

        if ([event shouldBeSent] && [self runOnSendBlocks:configuration event:event]) {
            storedEvents[fileKey] = event;
        } else { // delete the report as the user has discarded it
            [self finishActiveRequest:fileKey success:true error:nil block:block];
        }
    }
    [self deliverStoredEvents:storedEvents configuration:configuration block:block];
}

- (void)deliverStoredEvents:(NSMutableDictionary<NSString *, BugsnagEvent *> *)storedEvents
              configuration:(BugsnagConfiguration *)configuration
                      block:(BSGOnErrorSentBlock)block {
    for (NSString *filename in storedEvents) {
        BugsnagEvent *event = storedEvents[filename];
        NSDictionary *requestPayload = [self prepareEventPayload:event];

        NSMutableDictionary *apiHeaders = [[configuration errorApiHeaders] mutableCopy];
        BSGDictSetSafeObject(apiHeaders, event.apiKey, BSGHeaderApiKey);
        [self.apiClient sendItems:1
                      withPayload:requestPayload
                            toURL:configuration.notifyURL
                          headers:apiHeaders
                     onCompletion:^(NSUInteger reportCount, BOOL success, NSError *error) {
                         [self finishActiveRequest:filename success:success error:error block:block];
                     }];
    }
}

- (BOOL)runOnSendBlocks:(BugsnagConfiguration *)configuration
                  event:(BugsnagEvent *)event {
    for (BugsnagOnSendErrorBlock onSendErrorBlock in configuration.onSendBlocks) {
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
    NSMutableDictionary *data = [[NSMutableDictionary alloc] init];
    BSGDictSetSafeObject(data, [[Bugsnag client].notifier toDict], BSGKeyNotifier);
    BSGDictSetSafeObject(data, event.apiKey, BSGKeyApiKey);
    BSGDictSetSafeObject(data, @"4.0", @"payloadVersion");
    BSGDictSetSafeObject(data, @[[event toJson]], BSGKeyEvents);
    return data;
}

@end
