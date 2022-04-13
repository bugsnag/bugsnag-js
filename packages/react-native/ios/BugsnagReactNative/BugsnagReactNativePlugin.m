#import "BugsnagReactNativePlugin.h"

#import "BugsnagClient+Private.h"

//
// BugsnagReactNativePlugin is instantiated by bugsnag-cocoa during its startup:
// https://github.com/bugsnag/bugsnag-cocoa/blob/v6.16.6/Bugsnag/Client/BugsnagClient.m#L355-L365
//
// This makes it the ideal place for configuring the native layer before it sends any events.
//
@implementation BugsnagReactNativePlugin

- (void)load:(BugsnagClient *)client {
    //
    // React Native catches JS exceptions and calls RCTFatal() to raise an Objective-C exception in response.
    // These need to be ignored because Bugsnag's JS layer also catches JS exceptions, via a different mechanism.
    //
    // RCTFatal() sets the exception name to "RCTFatalException: ${error.localizedDescription}"
    // https://github.com/facebook/react-native/blob/v0.68.0/React/Base/RCTAssert.m#L132
    //
    // For JS errors the localizedDescription is @"Unhandled JS Exception: ${message}"
    // https://github.com/facebook/react-native/blob/v0.68.0/React/CoreModules/RCTExceptionsManager.mm#L66
    // https://github.com/facebook/react-native/blob/v0.68.0/React/CxxModule/RCTCxxUtils.mm#L51
    //
    // The exception name gets recorded as the error's `errorClass`.
    //
    NSString *discardPattern = @"^RCTFatalException: Unhandled JS Exception: ";
    
    NSMutableSet *discardClasses = [client.configuration.discardClasses mutableCopy] ?: [NSMutableSet set];
    [discardClasses addObject:[NSRegularExpression regularExpressionWithPattern:discardPattern options:0 error:nil]];
    client.configuration.discardClasses = discardClasses;
}

- (void)unload {

}

@end
