//
//  BugsnagBreadcrumbs.h
//  Bugsnag
//
//  Created by Jamie Lynch on 26/03/2020.
//  Copyright © 2020 Bugsnag. All rights reserved.
//

#import <Foundation/Foundation.h>

#import "BugsnagBreadcrumb.h"
#import "BugsnagConfiguration.h"

typedef void (^BSGBreadcrumbConfiguration)(BugsnagBreadcrumb *_Nonnull);

@interface BugsnagBreadcrumbs : NSObject

- (instancetype _Nonnull)initWithConfiguration:(BugsnagConfiguration *_Nonnull)config;

/**
 * Path where breadcrumbs are persisted on disk
 */
@property (nonatomic, readonly, strong, nullable) NSString *cachePath;

/**
 * Store a new breadcrumb with a provided message.
 */
- (void)addBreadcrumb:(NSString *_Nonnull)breadcrumbMessage;

/**
 *  Store a new breadcrumb configured via block.
 *
 *  @param block configuration block
 */
- (void)addBreadcrumbWithBlock:
    (void (^_Nonnull)(BugsnagBreadcrumb *_Nonnull))block;

/**
 * Generates an array of dictionaries representing the current buffer of breadcrumbs.
 */
- (NSArray *_Nonnull)arrayValue;

/**
 * Returns an array containing the current buffer of breadcrumbs.
 */
- (NSArray<BugsnagBreadcrumb *> *_Nonnull)getBreadcrumbs;

/**
 * The types of breadcrumbs which will be automatically captured.
 * By default, this is all types.
 */
@property BSGEnabledBreadcrumbType enabledBreadcrumbTypes;

@end
