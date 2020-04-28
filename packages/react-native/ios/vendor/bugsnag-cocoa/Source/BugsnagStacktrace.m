//
//  BugsnagStacktrace.m
//  Bugsnag
//
//  Created by Jamie Lynch on 06/04/2020.
//  Copyright © 2020 Bugsnag. All rights reserved.
//

#import "BugsnagStacktrace.h"
#import "BugsnagStackframe.h"

@interface BugsnagStackframe ()
+ (BugsnagStackframe *)frameFromDict:(NSDictionary *)dict
                          withImages:(NSArray *)binaryImages;
- (NSDictionary *)toDictionary;
@end

@interface BugsnagStacktrace ()
@property NSMutableArray<BugsnagStackframe *> *trace;
@end

@implementation BugsnagStacktrace

- (instancetype)initWithTrace:(NSArray<NSDictionary *> *)trace
                 binaryImages:(NSArray<NSDictionary *> *)binaryImages {
    if (self = [super init]) {
        self.trace = [NSMutableArray new];

        for (NSDictionary *obj in trace) {
            BugsnagStackframe *frame = [BugsnagStackframe frameFromDict:obj withImages:binaryImages];

            if (frame != nil && [self.trace count] < 200) {
                [self.trace addObject:frame];
            }
        }
    }
    return self;
}

- (NSArray *)toArray {
    NSMutableArray *array = [NSMutableArray new];
    for (BugsnagStackframe *frame in self.trace) {
        [array addObject:[frame toDictionary]];
    }
    return array;
}

@end
