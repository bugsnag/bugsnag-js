//
// Created by Jamie Lynch on 23/03/2018.
// Copyright (c) 2018 Bugsnag. All rights reserved.
//
#import <objc/runtime.h>

#import "Scenario.h"

@implementation Scenario

+ (Scenario *)createScenarioNamed:(NSString *)className {
    Class clz = NSClassFromString(className);

    if (clz == nil) { // swift class
        clz = NSClassFromString([NSString stringWithFormat:@"reactnative.%@", className]);
    }

    NSAssert(clz != nil, @"Failed to find class named '%@'", className);

    // TODO: Why does this check fail?
    // BOOL implementsRun = method_getImplementation(class_getInstanceMethod([Scenario class], @selector(run))) !=
    // method_getImplementation(class_getInstanceMethod(clz, @selector(run)));

    // NSAssert(implementsRun, @"Class '%@' does not implement the run method", className);

    id obj = [clz alloc];

    NSAssert([obj isKindOfClass:[Scenario class]], @"Class '%@' is not a subclass of Scenario", className);

    return [(Scenario *)obj init];
}

- (instancetype)init {
    return self;
}

- (void)run: (RCTPromiseResolveBlock)resolve
     reject:(RCTPromiseRejectBlock)reject {
}

@end
