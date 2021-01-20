//
//  BugsnagErrorReportSink+Private.h
//  Bugsnag
//
//  Created by Nick Dowell on 04/12/2020.
//  Copyright © 2020 Bugsnag Inc. All rights reserved.
//

#import "BugsnagErrorReportSink.h"

@class BugsnagEvent;

NS_ASSUME_NONNULL_BEGIN

@interface BugsnagErrorReportSink ()

#pragma mark Methods

- (NSDictionary *)prepareEventPayload:(BugsnagEvent *)event;

@end

NS_ASSUME_NONNULL_END
