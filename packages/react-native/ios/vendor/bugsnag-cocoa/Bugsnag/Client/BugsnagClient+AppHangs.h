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

/// @return A `BugsnagEvent` if the last run ended with a fatal app hang, `nil` otherwise.
- (nullable BugsnagEvent *)loadFatalAppHangEvent;

- (void)startAppHangDetector;

@end

NS_ASSUME_NONNULL_END
