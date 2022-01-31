//
//  BugsnagNotifier.m
//  Bugsnag
//
//  Created by Jamie Lynch on 29/04/2020.
//  Copyright © 2020 Bugsnag. All rights reserved.
//

#import "BugsnagPlatformConditional.h"

#import "BugsnagNotifier.h"

@implementation BugsnagNotifier

- (instancetype)init {
    if ((self = [super init])) {
#if BSG_PLATFORM_TVOS
        _name = @"tvOS Bugsnag Notifier";
#elif BSG_PLATFORM_IOS
        _name = @"iOS Bugsnag Notifier";
#elif BSG_PLATFORM_OSX
        _name = @"OSX Bugsnag Notifier";
#else
        _name = @"Bugsnag Objective-C";
#endif
        _version = @"6.16.1";
        _url = @"https://github.com/bugsnag/bugsnag-cocoa";
        _dependencies = @[];
    }
    return self;
}

- (instancetype)initWithName:(NSString *)name
                     version:(NSString *)version
                         url:(NSString *)url
                dependencies:(NSArray<BugsnagNotifier *> *)dependencies {
    if ((self = [super init])) {
        _name = [name copy];
        _version = [version copy];
        _url = [url copy];
        _dependencies = [dependencies copy];
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
