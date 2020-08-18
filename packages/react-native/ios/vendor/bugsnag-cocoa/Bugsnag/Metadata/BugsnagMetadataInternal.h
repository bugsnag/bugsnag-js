//
//  BugsnagMetadataInternal.h
//  Bugsnag
//
//  Created by Jamie Lynch on 28/04/2020.
//  Copyright © 2020 Bugsnag. All rights reserved.
//

#ifndef BugsnagMetadataInternal_h
#define BugsnagMetadataInternal_h

#import "BugsnagMetadata.h"

@class BugsnagStateEvent;

NS_ASSUME_NONNULL_BEGIN

typedef void (^BugsnagObserverBlock)(BugsnagStateEvent *_Nonnull event);

@interface BugsnagMetadata ()

@property(atomic, strong) NSMutableDictionary *dictionary;

- (NSDictionary *)toDictionary;

- (id)deepCopy;

- (void)addObserverWithBlock:(BugsnagObserverBlock _Nonnull)block;

- (void)removeObserverWithBlock:(BugsnagObserverBlock _Nonnull)block;

@end

NS_ASSUME_NONNULL_END

#endif /* BugsnagMetadataInternal_h */
