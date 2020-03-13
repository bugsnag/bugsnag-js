#import "Bugsnag.h"
#import "BugsnagClient.h"
#import "BugsnagReactNativePlugin.h"

@interface Bugsnag ()
+ (BugsnagClient *)client;
@end

@interface BugsnagReactNativePlugin () <BugsnagPlugin>
@end

@implementation BugsnagReactNativePlugin

- (void)load {
    // TODO setup react-native plugin here
}

- (void)unload {

}

@end
