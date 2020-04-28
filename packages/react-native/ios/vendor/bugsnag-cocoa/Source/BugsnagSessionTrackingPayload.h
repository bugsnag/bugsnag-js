//
//  BugsnagSessionTrackingPayload.h
//  Bugsnag
//
//  Created by Jamie Lynch on 27/11/2017.
//  Copyright © 2017 Bugsnag. All rights reserved.
//

#import <Foundation/Foundation.h>

#import "BugsnagSession.h"

@class BugsnagConfiguration;

@interface BugsnagSessionTrackingPayload : NSObject

- (instancetype)initWithSessions:(NSArray<BugsnagSession *> *)sessions
                          config:(BugsnagConfiguration *)config
                    codeBundleId:(NSString *)codeBundleId;

- (NSMutableDictionary *)toJson;

@property NSArray<BugsnagSession *> *sessions;

@end
