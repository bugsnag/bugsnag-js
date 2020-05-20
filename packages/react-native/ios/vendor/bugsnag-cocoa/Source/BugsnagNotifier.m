//
//  BugsnagNotifier.m
//  Bugsnag
//
//  Created by Jamie Lynch on 29/04/2020.
//  Copyright © 2020 Bugsnag. All rights reserved.
//

#import "BugsnagNotifier.h"

@implementation BugsnagNotifier

- (instancetype)init {
    if (self = [super init]) {

        self.name =
#if TARGET_OS_TV
        @"tvOS Bugsnag Notifier";
#elif TARGET_IPHONE_SIMULATOR || TARGET_OS_IPHONE
        @"iOS Bugsnag Notifier";
#elif TARGET_OS_MAC
        @"OSX Bugsnag Notifier";
#else
        @"Bugsnag Objective-C";
#endif
        self.version = @"5.23.2";
        self.url = @"https://github.com/bugsnag/bugsnag-cocoa";
        self.dependencies = [NSMutableArray new];
    }
    return self;
}

- (NSDictionary *)toDict {
    NSMutableDictionary *dict = [NSMutableDictionary new];
    dict[@"name"] = self.name;
    dict[@"version"] = self.version;
    dict[@"url"] = self.url;

    if ([self.dependencies count] > 0) {
        NSMutableArray *values = [NSMutableArray new];
        dict[@"dependencies"] = values;

        for (BugsnagNotifier *notifier in self.dependencies) {
            [values addObject:[notifier toDict]];
        }
    }
    return dict;
}

@end
