//
//  BugsnagClientInternal.h
//  Bugsnag
//
//  Created by Jamie Lynch on 31/03/2020.
//  Copyright © 2020 Bugsnag. All rights reserved.
//

#import <Foundation/Foundation.h>

#import "BugsnagClient.h"

@class BugsnagBreadcrumbs;
@class BugsnagClient;
@class BugsnagSessionTracker;
@class BugsnagConfiguration;
@class BugsnagMetadata;
@class BugsnagNotifier;

@interface BugsnagClient ()

@property(nonatomic, readwrite, retain) BugsnagBreadcrumbs *_Nullable breadcrumbs;
@property(nonatomic, readwrite, retain) BugsnagConfiguration *_Nullable configuration;
@property(nonatomic, readwrite, strong) BugsnagMetadata *_Nonnull state;
@property(nonatomic, readwrite, strong) BugsnagNotifier *_Nonnull notifier;
@property(nonatomic, readwrite, strong) NSLock *_Nonnull metadataLock;
@property(nonatomic, readwrite, strong) BugsnagSessionTracker *_Nonnull sessionTracker;
@property(readonly) BOOL started;

- (void)start;
@end

