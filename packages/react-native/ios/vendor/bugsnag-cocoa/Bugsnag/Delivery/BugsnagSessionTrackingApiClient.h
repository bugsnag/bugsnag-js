//
// Created by Jamie Lynch on 30/11/2017.
// Copyright (c) 2017 Bugsnag. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "BugsnagApiClient.h"

@class BugsnagConfiguration;
@class BugsnagNotifier;
@class BugsnagSessionFileStore;

@interface BugsnagSessionTrackingApiClient : BugsnagApiClient

- (instancetype)initWithConfig:(BugsnagConfiguration *)configuration queueName:(NSString *)queueName notifier:(BugsnagNotifier *)notifier;

/**
 * Asynchronously delivers sessions written to the store
 *
 * @param store The store containing the sessions to deliver
 */
- (void)deliverSessionsInStore:(BugsnagSessionFileStore *)store;

@property (copy) NSString *codeBundleId;

@property BugsnagNotifier *notifier;

@end
