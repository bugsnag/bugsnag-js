//
//  BugsnagCrashSentry.h
//  Pods
//
//  Created by Jamie Lynch on 11/08/2017.
//
//

#import <Foundation/Foundation.h>

#import "BSG_KSCrashReportWriter.h"
#import "BSG_KSCrashType.h"
#import "BugsnagConfiguration.h"
#import "BugsnagErrorReportApiClient.h"

@class BugsnagNotifier;

@interface BugsnagCrashSentry : NSObject

- (void)install:(BugsnagConfiguration *)config
      apiClient:(BugsnagErrorReportApiClient *)apiClient
       notifier:(BugsnagNotifier *)notifier
        onCrash:(BSGReportCallback)onCrash;

- (void)reportUserException:(NSString *)reportName
                     reason:(NSString *)reportMessage
               handledState:(NSDictionary *)handledState
                   appState:(NSDictionary *)appState
          callbackOverrides:(NSDictionary *)overrides
             eventOverrides:(NSDictionary *)eventOverrides
                   metadata:(NSDictionary *)metadata
                     config:(NSDictionary *)config;

- (BSG_KSCrashType)mapKSToBSGCrashTypes:(BugsnagErrorTypes *)errorTypes;

@end
