//
//  BugsnagStacktrace+Private.h
//  Bugsnag
//
//  Created by Nick Dowell on 04/12/2020.
//  Copyright © 2020 Bugsnag Inc. All rights reserved.
//

#import "BugsnagStacktrace.h"

NS_ASSUME_NONNULL_BEGIN

@interface BugsnagStacktrace ()

+ (instancetype)stacktraceFromJson:(NSDictionary *)json;

@property (readonly, nonatomic) NSMutableArray<BugsnagStackframe *> *trace;

@end

NS_ASSUME_NONNULL_END
