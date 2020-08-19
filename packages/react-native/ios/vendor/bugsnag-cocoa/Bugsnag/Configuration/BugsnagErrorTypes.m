//
//  BugsnagErrorTypes.m
//  Bugsnag
//
//  Created by Jamie Lynch on 22/04/2020.
//  Copyright © 2020 Bugsnag. All rights reserved.
//

#import "BugsnagErrorTypes.h"

@implementation BugsnagErrorTypes

- (instancetype)init {
    if (self = [super init]) {
        _unhandledExceptions = true;
        _signals = true;
        _cppExceptions = true;
        _machExceptions = true;
        _unhandledRejections = true;

#if DEBUG
        _ooms = false;
#else
        _ooms = true;
#endif
    }
    return self;
}

@end
