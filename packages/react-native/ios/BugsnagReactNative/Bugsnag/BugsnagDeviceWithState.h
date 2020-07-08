//
//  BugsnagDeviceWithState.h
//  Bugsnag
//
//  Created by Jamie Lynch on 01/04/2020.
//  Copyright © 2020 Bugsnag. All rights reserved.
//

#import <Foundation/Foundation.h>

#import "BugsnagDevice.h"

/**
 * Stateful information set by the notifier about the device on which the event occurred can be
 * found on this class. These values can be accessed and amended if necessary.
 */
@interface BugsnagDeviceWithState : BugsnagDevice

/**
 * The number of free bytes of storage available on the device
 */
@property(nonatomic, nullable) NSNumber *freeDisk;

/**
 * The number of free bytes of memory available on the device
 */
@property(nonatomic, nullable) NSNumber *freeMemory;

/**
 * The orientation of the device when the event occurred
 */
@property(nonatomic, nullable) NSString *orientation;

/**
 * The timestamp on the device when the event occurred
 */
@property(nonatomic, nullable) NSDate *time;

@end
