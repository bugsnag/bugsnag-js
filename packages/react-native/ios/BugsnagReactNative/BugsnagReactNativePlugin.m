#import "Bugsnag.h"
#import "BugsnagNotifier.h"
#import "BugsnagPlugin.h"
#import "BugsnagReactNativePlugin.h"

@interface Bugsnag ()
+ (BugsnagNotifier *)notifier;
+ (void)registerPlugin:(id<BugsnagPlugin>)plugin;
@end

@interface BugsnagReactNativePlugin () <BugsnagPlugin>
@property(nonatomic, getter=isStarted) BOOL started;
@end

@implementation BugsnagReactNativePlugin

+ (void)register {
  BugsnagReactNativePlugin *plugin = [BugsnagReactNativePlugin new];
  [Bugsnag registerPlugin:plugin];
}

- (void)start {
  self.started = YES;
}

@end
