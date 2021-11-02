//
// Created by Jamie Lynch on 30/11/2017.
// Copyright (c) 2017 Bugsnag. All rights reserved.
//

#import <Foundation/Foundation.h>

#import <Bugsnag/BugsnagSession.h>

#import "BugsnagFileStore.h"

@interface BugsnagSessionFileStore : BugsnagFileStore
+ (BugsnagSessionFileStore *)storeWithPath:(NSString *)path
                      maxPersistedSessions:(NSUInteger)maxPersistedSessions;

- (void)write:(BugsnagSession *)session;

@end
