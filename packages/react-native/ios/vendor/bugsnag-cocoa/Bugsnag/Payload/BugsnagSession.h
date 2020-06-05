//
//  BugsnagSession.h
//  Bugsnag
//
//  Created by Jamie Lynch on 24/11/2017.
//  Copyright © 2017 Bugsnag. All rights reserved.
//

#import <Foundation/Foundation.h>

#import "BugsnagUser.h"
#import "BugsnagApp.h"
#import "BugsnagDevice.h"

@interface BugsnagSession : NSObject

@property NSString *_Nonnull id;
@property NSDate *_Nonnull startedAt;
@property(readonly) BugsnagApp *_Nonnull app;
@property(readonly) BugsnagDevice *_Nonnull device;

// =============================================================================
// MARK: - User
// =============================================================================

/**
 * The current user
 */
@property(readonly, retain, nonnull) BugsnagUser *user;

/**
 *  Set user metadata
 *
 *  @param userId ID of the user
 *  @param name   Name of the user
 *  @param email  Email address of the user
 */
- (void)setUser:(NSString *_Nullable)userId
      withEmail:(NSString *_Nullable)email
        andName:(NSString *_Nullable)name;

@end
