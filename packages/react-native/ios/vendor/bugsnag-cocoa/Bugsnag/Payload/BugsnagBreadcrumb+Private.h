//
//  BugsnagBreadcrumb+Private.h
//  Bugsnag
//
//  Created by Nick Dowell on 04/12/2020.
//  Copyright © 2020 Bugsnag Inc. All rights reserved.
//

#import "BugsnagBreadcrumb.h"

NS_ASSUME_NONNULL_BEGIN

@interface BugsnagBreadcrumb ()

+ (NSArray<BugsnagBreadcrumb *> *)breadcrumbArrayFromJson:(NSArray<NSDictionary *> *)json;

+ (nullable instancetype)breadcrumbFromDict:(NSDictionary *)dict;

+ (nullable instancetype)breadcrumbWithBlock:(void (^)(BugsnagBreadcrumb *))block;

- (nullable NSDictionary *)objectValue;

@end

NS_ASSUME_NONNULL_END
