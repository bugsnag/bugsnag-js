//
//  BugsnagPluginClient.m
//  Bugsnag
//
//  Created by Jamie Lynch on 12/03/2020.
//  Copyright © 2020 Bugsnag. All rights reserved.
//

#import "Bugsnag.h"
#import "BugsnagPluginClient.h"
#import "BugsnagPlugin.h"
#import "BugsnagLogger.h"

@interface Bugsnag ()
+ (BugsnagClient *)client;
@end

@interface BugsnagPluginClient ()
@property NSSet<id<BugsnagPlugin>> *plugins;
@end

@implementation BugsnagPluginClient

- (instancetype _Nonnull)initWithPlugins:(NSMutableSet<id<BugsnagPlugin>> *_Nonnull)plugins {
    if (self = [super init]) {
        _plugins = [NSSet setWithSet:plugins];
    }
    return self;
}

- (void)loadPlugins {
    for (id<BugsnagPlugin> plugin in self.plugins) {
        @try {
            [plugin load:[Bugsnag client]];
        } @catch (NSException *exception) {
            bsg_log_err(@"Failed to load plugin %@, continuing with initialisation.", plugin);
        }
    }
}

@end
