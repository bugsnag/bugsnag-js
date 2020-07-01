#import "Bugsnag.h"
#import "BugsnagClient.h"
#import "BugsnagConfiguration.h"
#import "BugsnagError.h"
#import "BugsnagReactNativePlugin.h"

@interface BugsnagClient ()
@property(nonatomic, readwrite, retain) BugsnagConfiguration * configuration;
@end

@interface BugsnagReactNativePlugin () <BugsnagPlugin>
@end

@implementation BugsnagReactNativePlugin

- (void)load:(BugsnagClient *_Nonnull)client {
    [client.configuration addOnSendErrorBlock:^BOOL(BugsnagEvent * _Nonnull event) {
        BugsnagError *error;

        if ([event.errors count] > 0) {
            error = event.errors[0];
        }
        return error != nil
                && ![error.errorClass hasPrefix:@"RCTFatalException"]
                && ![error.errorMessage hasPrefix:@"Unhandled JS Exception"];
    }];
}

- (void)unload {

}

@end
