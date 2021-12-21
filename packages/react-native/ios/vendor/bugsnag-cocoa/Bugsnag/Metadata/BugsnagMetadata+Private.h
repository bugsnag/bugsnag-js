//
//  BugsnagMetadata+Private.h
//  Bugsnag
//
//  Created by Nick Dowell on 04/12/2020.
//  Copyright © 2020 Bugsnag Inc. All rights reserved.
//

#import <Bugsnag/BugsnagMetadata.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^ BSGMetadataObserver)(BugsnagMetadata *);

@interface BugsnagMetadata ()

#pragma mark Properties

@property (readonly, nonatomic) NSMutableDictionary *dictionary;

@property (nullable, nonatomic) BSGMetadataObserver observer;

#pragma mark Methods

- (NSDictionary *)toDictionary;

- (instancetype)deepCopy;

@end

NS_ASSUME_NONNULL_END
