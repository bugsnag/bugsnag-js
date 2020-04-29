//
//  BugsnagErrorTypes.h
//  Bugsnag
//
//  Created by Jamie Lynch on 22/04/2020.
//  Copyright © 2020 Bugsnag. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface BugsnagErrorTypes : NSObject

/**
 * Determines whether Out of Memory events should be reported to bugsnag.
 *
 * This flag is true by default.
 */
@property BOOL ooms;

/**
 * Determines whether NSExceptions should be reported to bugsnag.
 *
 * This flag is true by default.
 */
@property BOOL unhandledExceptions;

/**
 * Determines whether signals should be reported to bugsnag.
 *
 * This flag is true by default.
 */
@property BOOL signals;

/**
 * Determines whether C errors should be reported to bugsnag.
 *
 * This flag is true by default.
 */
@property BOOL cppExceptions;

/**
 * Determines whether Mach Exceptions should be reported to bugsnag.
 *
 * This flag is true by default.
 */
@property BOOL machExceptions;

/**
 * Sets whether Bugsnag should automatically capture and report unhandled promise rejections.
 * This only applies to React Native apps.
 * By default, this value is true.
 */
@property BOOL unhandledRejections;

@end

