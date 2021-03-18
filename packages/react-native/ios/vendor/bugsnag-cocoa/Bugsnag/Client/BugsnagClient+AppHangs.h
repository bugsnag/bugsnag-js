//
//  BugsnagClient+AppHangs.h
//  Bugsnag
//
//  Created by Nick Dowell on 08/03/2021.
//  Copyright © 2021 Bugsnag Inc. All rights reserved.
//

#import "BugsnagClient+Private.h"

#import "BSGAppHangDetector.h"

NS_ASSUME_NONNULL_BEGIN

@interface BugsnagClient (AppHangs) <BSGAppHangDetectorDelegate>

- (BOOL)lastRunEndedWithAppHang;

- (void)startAppHangDetector;

@end

NS_ASSUME_NONNULL_END
