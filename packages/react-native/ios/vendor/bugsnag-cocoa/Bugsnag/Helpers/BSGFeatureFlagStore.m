//
//  BSGFeatureFlagStore.m
//  Bugsnag
//
//  Created by Nick Dowell on 11/11/2021.
//  Copyright © 2021 Bugsnag Inc. All rights reserved.
//

#import "BSGFeatureFlagStore.h"

#import "BSGKeys.h"
#import "BugsnagFeatureFlag.h"

void BSGFeatureFlagStoreAddFeatureFlag(BSGFeatureFlagStore *store, NSString *name, NSString *_Nullable variant) {
    store[name] = variant ?: [NSNull null];
}

void BSGFeatureFlagStoreAddFeatureFlags(BSGFeatureFlagStore *store, NSArray<BugsnagFeatureFlag *> *featureFlags) {
    for (BugsnagFeatureFlag *featureFlag in featureFlags) {
        store[featureFlag.name] = featureFlag.variant ?: [NSNull null];
    }
}

void BSGFeatureFlagStoreClear(BSGFeatureFlagStore *store, NSString *_Nullable name) {
    if (name) {
        [store removeObjectForKey:(NSString *_Nonnull)name];
    } else {
        [store removeAllObjects];
    }
}

NSArray<NSDictionary *> * BSGFeatureFlagStoreToJSON(BSGFeatureFlagStore *store) {
    NSMutableArray<NSDictionary *> *result = [NSMutableArray array];
    for (NSString *name in store) {
        id variant = store[name];
        if ([variant isKindOfClass:[NSString class]]) {
            [result addObject:@{BSGKeyFeatureFlag: name, BSGKeyVariant: variant}];
        } else {
            [result addObject:@{BSGKeyFeatureFlag: name}];
        }
    }
    [result sortUsingComparator:^NSComparisonResult(NSDictionary *_Nonnull obj1, NSDictionary *_Nonnull obj2) {
        return [(NSString *)obj1[BSGKeyFeatureFlag] compare:(NSString *)obj2[BSGKeyFeatureFlag]];
    }];
    return result;
}

BSGFeatureFlagStore * BSGFeatureFlagStoreFromJSON(id json) {
    BSGFeatureFlagStore *store = [NSMutableDictionary dictionary];
    if ([json isKindOfClass:[NSArray class]]) {
        for (id item in json) {
            if ([item isKindOfClass:[NSDictionary class]]) {
                NSString *featureFlag = item[BSGKeyFeatureFlag];
                if ([featureFlag isKindOfClass:[NSString class]]) {
                    id variant = item[BSGKeyVariant];
                    store[featureFlag] = [variant isKindOfClass:[NSString class]] ? variant : [NSNull null];
                }
            }
        }
    }
    return store;
}
