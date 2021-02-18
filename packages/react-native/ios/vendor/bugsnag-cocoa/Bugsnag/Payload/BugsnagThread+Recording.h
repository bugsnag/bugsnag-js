//
//  BugsnagThread+Recording.h
//  Bugsnag
//
//  Created by Nick Dowell on 05/02/2021.
//  Copyright © 2021 Bugsnag Inc. All rights reserved.
//

#import <Bugsnag/BugsnagThread.h>

NS_ASSUME_NONNULL_BEGIN

@interface BugsnagThread (Recording)

+ (NSArray<BugsnagThread *> *)allThreads:(BOOL)allThreads callStackReturnAddresses:(NSArray<NSNumber *> *)callStackReturnAddresses;

+ (nullable instancetype)mainThread;

@end

NS_ASSUME_NONNULL_END
