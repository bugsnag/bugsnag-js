//
//  BugsnagThread.h
//  Bugsnag
//
//  Created by Jamie Lynch on 01/04/2020.
//  Copyright © 2020 Bugsnag. All rights reserved.
//

#import <Foundation/Foundation.h>

typedef NS_OPTIONS(NSUInteger, BSGThreadType) {
    BSGThreadTypeCocoa NS_SWIFT_NAME(cocoa) = 0,
    BSGThreadTypeReactNativeJs = 1 << 1
};

@class BugsnagStackframe;
@class BugsnagStacktrace;

/**
 * A representation of thread information recorded as part of a BugsnagEvent.
 */
@interface BugsnagThread : NSObject

/**
 * A unique ID which identifies this thread
 */
@property(nullable) NSString *id;

/**
 * The name which identifies this thread
 */
@property(nullable) NSString *name;

/**
 * Whether this thread was the thread that triggered the captured error
 */
@property(readonly) BOOL errorReportingThread;

/**
 * Sets a representation of this thread's stacktrace
 */
@property(nonnull) NSArray<BugsnagStackframe *> *stacktrace;

/**
 * Determines the type of thread based on the originating platform
 * (intended for internal use only)
 */
@property BSGThreadType type;

@end
