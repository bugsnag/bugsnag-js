#import "BugsnagReactNativePlugin.h"

#import "BugsnagClient+Private.h"
#import "BugsnagError.h"

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
