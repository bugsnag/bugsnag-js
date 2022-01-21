//
//  BSGFeatureFlagStore.h
//  Bugsnag
//
//  Created by Nick Dowell on 11/11/2021.
//  Copyright © 2021 Bugsnag Inc. All rights reserved.
//

#import <Bugsnag/BugsnagFeatureFlag.h>

NS_ASSUME_NONNULL_BEGIN

typedef NSMutableDictionary<NSString *, id> BSGFeatureFlagStore;

void BSGFeatureFlagStoreAddFeatureFlag(BSGFeatureFlagStore *store, NSString *name, NSString *_Nullable variant);

void BSGFeatureFlagStoreAddFeatureFlags(BSGFeatureFlagStore *store, NSArray<BugsnagFeatureFlag *> *featureFlags);

void BSGFeatureFlagStoreClear(BSGFeatureFlagStore *store, NSString *_Nullable name);

NSArray<NSDictionary *> * BSGFeatureFlagStoreToJSON(BSGFeatureFlagStore *store);

BSGFeatureFlagStore * BSGFeatureFlagStoreFromJSON(id _Nullable json);

NS_ASSUME_NONNULL_END
