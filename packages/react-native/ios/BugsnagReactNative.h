#import <Foundation/Foundation.h>

#import <React/RCTBridgeModule.h>
#import <React/RCTBridge.h>

@class BugsnagConfiguration;

@interface BugsnagReactNative: NSObject<RCTBridgeModule>

/**
 * Initializes the crash handler with the default options and using the API key
 * stored in the following locations (in order of priority):
 * * the package.json file nested under "bugsnag"
 *
 *       {"bugsnag":{"apiKey": "your-key"}}
 *
 * * the Info.plist file using the key "BugsnagAPIKey"
 *
 *       <key>BugsnagAPIKey</key>
 *       <string>your-key</string>
 *
 * Native initialization is only required if you wish to see crash reports
 * originating from before React Native initializes (and have an accurate
 * stability score).
 */
// + (void)start;

/**
 * Initializes the crash handler with the default options
 *
 * Native initialization is only required if you wish to see crash reports
 * originating from before React Native initializes (and have an accurate
 * stability score).
 * @param APIKey the API key to use when sending error reports
 */
// + (void)startWithAPIKey:(NSString *)APIKey;

/**
 * Initializes the crash handler with custom options. Any options passed here
 * can be overridden when initializing the JS layer.
 *
 * Native initialization is only required if you wish to see crash reports
 * originating from before React Native initializes (and have an accurate
 * stability score).
 * @param config the configuration options to use
 */
// + (void)startWithConfiguration:(BugsnagConfiguration *)config;

/**
 * Updates the native configuration with any changes from the JavaScript layer.
 * Resolves with the final configuration once defaults for unspecified options
 * are applied.
 * @param options a serialized version of the JavaScript layer configuration
 */
// - (void)configureJSLayer:(NSDictionary *)options
//                  resolve:(RCTPromiseResolveBlock)resolve
//                   reject:(RCTPromiseRejectBlock)reject;

/**
 * Start a new session.
 */
- (void)startSession;

/**
 * Stop the current session.
 */
- (void)stopSession;

/**
 * Resume the previously started session or start a new one if none available.
 */
- (void)resumeSession;

/**
 * Deliver the report
 */
- (void)deliver:(NSDictionary *)payload
        resolve:(RCTPromiseResolveBlock)resolve
         reject:(RCTPromiseRejectBlock)reject;

/**
 * Breadcrumbs, app info, and device info available in the native layer.
 */
- (void)nativePayloadInfo:(RCTPromiseResolveBlock)resolve
                   reject:(RCTPromiseRejectBlock)reject;

/**
 * Leave a breadcrumb
 */
- (void)leaveBreadcrumb:(NSDictionary *)options;

/**
 * Update configuration based on props set on the JavaScript layer client.
 */
- (void)updateClientProperty:(NSDictionary *)options;

@end
