#import "Bugsnag.h"
// #import "BSGConvert.h"
#import "BSG_KSCrashC.h"
#import "BugsnagReactNative.h"
#import <React/RCTConvert.h>

// NSString *const BSGInfoPlistKey = @"BugsnagAPIKey";
//
// bool (^BSGReactNativeReportFilter)(NSDictionary *, BugsnagCrashReport *) =
//     ^bool(NSDictionary *rawEventData, BugsnagCrashReport *_Nonnull report) {
//       return !([report.errorClass hasPrefix:@"RCTFatalException"] &&
//                [report.errorMessage hasPrefix:@"Unhandled JS Exception"]);
//     };

// @interface Bugsnag ()
// + (id)notifier;
// + (BOOL)bugsnagStarted;
// @end

@implementation BugsnagReactNative

// + (void)start {
//   [self startWithAPIKey:nil];
// }
//
// + (void)startWithAPIKey:(NSString *)APIKey {
//   BugsnagConfiguration *config = [BugsnagConfiguration new];
//   config.apiKey = APIKey;
//   [self startWithConfiguration:config];
// }
//
// + (void)startWithConfiguration:(BugsnagConfiguration *)config {
//   if (config.apiKey.length == 0)
//     config.apiKey = [self defaultAPIKey];
//
//   // The first session starts during JS initialization
//   // Applications which have specific components in RN instead of the primary
//   // way to interact with the application should instead leverage startSession
//   // manually.
//   config.shouldAutoCaptureSessions = NO;
//   [config addBeforeSendBlock:BSGReactNativeReportFilter];
//   [Bugsnag startBugsnagWithConfiguration:config];
// }
//
// + (NSString *)defaultAPIKey {
//   return [[NSBundle mainBundle] objectForInfoDictionaryKey:BSGInfoPlistKey];
// }

RCT_EXPORT_MODULE()

// Exposed to JavaScript at init time, never updated at runtime
// - (NSDictionary *)constantsToExport {
//   if ([Bugsnag bugsnagStarted]) {
//     return @{@"apiKey": [[Bugsnag configuration] apiKey]};
//   }
//   NSString *defaultAPIKey = [BugsnagReactNative defaultAPIKey];
//   if (defaultAPIKey.length > 0) {
//     return @{@"apiKey" : defaultAPIKey};
//   }
//   return @{};
// }

RCT_EXPORT_METHOD(startSession) { [Bugsnag startSession]; }

RCT_EXPORT_METHOD(stopSession) { [Bugsnag stopSession]; }

RCT_EXPORT_METHOD(resumeSession) { [Bugsnag resumeSession]; }

RCT_EXPORT_METHOD(leaveBreadcrumb : (NSDictionary *)options) {
  // [Bugsnag leaveBreadcrumbWithBlock:^(BugsnagBreadcrumb *crumb) {
  //   crumb.name = [RCTConvert NSString:options[@"name"]];
  //   crumb.type =
  //       BSGBreadcrumbTypeFromString([RCTConvert NSString:options[@"type"]]);
  //   crumb.metadata = BSGConvertTypedNSDictionary(options[@"metadata"]);
  // }];
}

// RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(configureJSLayer
//                                        : (NSDictionary *)options) {
//   // update config with options
//   // get JS package version
//   // setNotifierDetails
//   // add isTestflight to metadata
//   // set default release stage if needed
//   // startWithConfiguration ...
//   return @{};
// }

RCT_EXPORT_METHOD(deliver
                  : (NSDictionary *)payload resolve
                  : (RCTPromiseResolveBlock)resolve reject
                  : (RCTPromiseRejectBlock)reject) {
  // something something
  // something
  resolve(@{});
}

RCT_EXPORT_METHOD(nativePayloadInfo
                  : (RCTPromiseResolveBlock)resolve reject
                  : (RCTPromiseRejectBlock)reject) {
  resolve(@{});
}

RCT_EXPORT_METHOD(updateClientProperty : (NSDictionary *)options) {
  NSLog(@"Update props: %@", options);
}

// - (void)setNotifierDetails:(NSString *)packageVersion {
//   id notifier = [Bugsnag notifier];
//   NSDictionary *details = [notifier valueForKey:@"details"];
//   NSString *version;
//   if ([details[@"version"] containsString:@"("]) {
//     version = details[@"version"];
//   } else {
//     version = [NSString
//         stringWithFormat:@"%@ (Cocoa %@)", packageVersion, details[@"version"]];
//   }
//   NSDictionary *newDetails = @{
//     @"version" : version,
//     @"name" : @"Bugsnag for React Native",
//     @"url" : @"https://github.com/bugsnag/bugsnag-js"
//   };
//   [notifier setValue:newDetails forKey:@"details"];
// }
//
// - (NSString *)parseReleaseStage:(NSString *)releaseStage {
//   if (releaseStage.length > 0) {
//     return releaseStage;
//   }
//
// #ifdef DEBUG
//   return @"development";
// #else
//   return @"production";
// #endif
// }
//
@end
