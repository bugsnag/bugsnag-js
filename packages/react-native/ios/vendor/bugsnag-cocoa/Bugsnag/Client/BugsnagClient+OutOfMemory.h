//
//  BugsnagClient+OutOfMemory.h
//  Bugsnag
//
//  Created by Nick Dowell on 19/03/2021.
//  Copyright © 2021 Bugsnag Inc. All rights reserved.
//

#import <Bugsnag/Bugsnag.h>

@class BugsnagEvent;

NS_ASSUME_NONNULL_BEGIN

@interface BugsnagClient (OutOfMemory)

- (BugsnagEvent *)generateOutOfMemoryEvent;

@end

NS_ASSUME_NONNULL_END
