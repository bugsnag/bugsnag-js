#import "Bugsnag.h"
#import "BugsnagReactNative.h"
#import "BugsnagReactNativeEmitter.h"

@interface Bugsnag ()
+ (id)client;
+ (BOOL)bugsnagStarted;
+ (BugsnagConfiguration *)configuration;
@end

@implementation BugsnagReactNative

RCT_EXPORT_MODULE()

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(configure) {
  if (![Bugsnag bugsnagStarted]) {
    // TODO: fail loudly here
    return nil;
  }

  // TODO: use this emitter to notifier JS of changes to user, context and metadata
  BugsnagReactNativeEmitter *emitter = [BugsnagReactNativeEmitter new];

  // TODO: convert the entire config into a map
  BugsnagConfiguration *config = [Bugsnag configuration];
  return @{
    @"apiKey": [config apiKey],
    @"releaseStage": [config releaseStage],
  };
}

RCT_EXPORT_METHOD(updateMetadata
                  :(NSString *)section
          withData:(NSDictionary *)update) {
  //TODO
}

RCT_EXPORT_METHOD(updateContext
                  :(NSString *)context) {
    [Bugsnag setContext:context];
}

RCT_EXPORT_METHOD(updateUser
                  :(NSString *)id
         withEmail:(NSString *)email
          withName:(NSString *)name) {
  //TODO
}

RCT_EXPORT_METHOD(dispatch
                  :(NSDictionary *)payload
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject) {
  resolve(@{});
}

RCT_EXPORT_METHOD(leaveBreadcrumb
                  :(NSDictionary *)options) {
  //TODO
}

RCT_EXPORT_METHOD(startSession) { [Bugsnag startSession]; }
RCT_EXPORT_METHOD(pauseSession) { [Bugsnag pauseSession]; }
RCT_EXPORT_METHOD(resumeSession) { [Bugsnag resumeSession]; }

RCT_EXPORT_METHOD(getPayloadInfo
                  :(NSDictionary *)options
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject) {
  resolve(@{});
}

@end
