//
//  BugsnagSessionInternal.h
//  Bugsnag
//
//  Created by Jamie Lynch on 16/04/2020.
//  Copyright © 2020 Bugsnag. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "BugsnagSession.h"

@class BugsnagUser;

@interface BugsnagSession ()

- (_Nonnull instancetype)initWithId:(NSString *_Nonnull)sessionId
                          startDate:(NSDate *_Nonnull)startDate
                               user:(BugsnagUser *_Nullable)user
                       autoCaptured:(BOOL)autoCaptured
                                app:(BugsnagApp *_Nonnull)app
                             device:(BugsnagDevice *_Nonnull)device;

- (_Nonnull instancetype)initWithDictionary:(NSDictionary *_Nonnull)dict;

- (_Nonnull instancetype)initWithId:(NSString *_Nonnull)sessionId
                          startDate:(NSDate *_Nonnull)startDate
                               user:(BugsnagUser *_Nullable)user
                       handledCount:(NSUInteger)handledCount
                     unhandledCount:(NSUInteger)unhandledCount
                                app:(BugsnagApp *_Nonnull)app
                             device:(BugsnagDevice *_Nonnull)device;

@end
