/**
 * Exposes non-public interfaces between the components of the library for
 * internal use
 */
#ifndef BUGSNAG_PRIVATE_H
#define BUGSNAG_PRIVATE_H

#import "BSG_RFC3339DateTool.h"
#import "Bugsnag.h"
#import "BugsnagBreadcrumb.h"
#import "BugsnagBreadcrumbs.h"
#import "BugsnagKeys.h"
#import "BugsnagLogger.h"
#import "BugsnagMetadataInternal.h"
#import "BugsnagPlatformConditional.h"

@class BugsnagConfiguration;

#pragma mark -

@interface BugsnagConfiguration ()

/// Throws an NSInvalidArgumentException if the API key is empty or missing.
/// Logs a warning message if the API key is not in the expected format.
- (void)validate;

@end

#pragma mark -

@interface BugsnagBreadcrumb ()

- (NSDictionary *_Nullable)objectValue;

@end

#pragma mark -

@interface BugsnagBreadcrumbs ()
/**
 * Reads and return breadcrumb data currently stored on disk
 */
- (NSArray *_Nullable)cachedBreadcrumbs;

@end

#pragma mark -

@interface Bugsnag ()

/** Get the current Bugsnag configuration.
 *
 * This method returns nil if called before +startWithApiKey: or
 * +startWithConfiguration:, and otherwise returns the current
 * configuration for Bugsnag.
 *
 * @return The configuration, or nil.
 */
+ (BugsnagConfiguration *_Nullable)configuration;

@end

#endif // BUGSNAG_PRIVATE_H
