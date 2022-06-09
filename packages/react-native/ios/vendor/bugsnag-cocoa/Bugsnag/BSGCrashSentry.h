//
//  BSGCrashSentry.h
//  Bugsnag
//
//  Created by Jamie Lynch on 11/08/2017.
//
//

#import <Foundation/Foundation.h>

#import "BSG_KSCrashReportWriter.h"
#import "BSG_KSCrashType.h"

@class BugsnagConfiguration;
@class BugsnagErrorTypes;

NS_ASSUME_NONNULL_BEGIN

void BSGCrashSentryInstall(BugsnagConfiguration *, BSG_KSReportWriteCallback);

BSG_KSCrashType BSG_KSCrashTypeFromBugsnagErrorTypes(BugsnagErrorTypes *);

NS_ASSUME_NONNULL_END
