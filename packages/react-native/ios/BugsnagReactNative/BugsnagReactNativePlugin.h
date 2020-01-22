#import <Foundation/Foundation.h>

@interface BugsnagReactNativePlugin : NSObject

/**
 * Register the Bugsnag React Native plugin, prior to calling [Bugsnag start]
 *
 */
+ (void)register;

@end
