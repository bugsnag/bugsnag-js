//
//  BugsnagStackframe.h
//  Bugsnag
//
//  Created by Jamie Lynch on 01/04/2020.
//  Copyright © 2020 Bugsnag. All rights reserved.
//

#import <Foundation/Foundation.h>

/**
 * Represents a single stackframe from a stacktrace.
 */
@interface BugsnagStackframe : NSObject

/**
 * The method name of the stackframe
 */
@property(nullable) NSString *method;

/**
 * The Mach-O file used by the stackframe
 */
@property(nullable) NSString *machoFile;

/**
 * A UUID identifying the Mach-O file used by the stackframe
 */
@property(nullable) NSString *machoUuid;

/**
 * The stack frame address
 */
@property(nullable) NSNumber *frameAddress;

/**
 * The VM address of the Mach-O file
 */
@property(nullable) NSNumber *machoVmAddress;

/**
 * The address of the stackframe symbol
 */
@property(nullable) NSNumber *symbolAddress;

/**
 * The load address of the Mach-O file
 */
@property(nullable) NSNumber *machoLoadAddress;

/**
 * Whether the frame was within the program counter
 */
@property BOOL isPc;

/**
 * Whether the frame was within the link register
 */
@property BOOL isLr;

/**
 * Returns an array of stackframe objects representing the provided call stack strings.
 *
 * The call stack strings should follow the format used by `[NSThread callStackSymbols]` and `backtrace_symbols()`.
 */
+ (NSArray<BugsnagStackframe *> *_Nullable)stackframesWithCallStackSymbols:(NSArray<NSString *> *_Nonnull)callStackSymbols;

@end
