//
//  BugsnagNotifier.h
//  Bugsnag
//
//  Created by Jamie Lynch on 29/04/2020.
//  Copyright © 2020 Bugsnag. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface BugsnagNotifier : NSObject

/// Initializes the object with details of the Cocoa notifier.
- (instancetype)init NS_DESIGNATED_INITIALIZER;

- (instancetype)initWithName:(NSString *)name
                     version:(NSString *)version
                         url:(NSString *)url
                dependencies:(NSArray<BugsnagNotifier *> *)dependencies NS_DESIGNATED_INITIALIZER;

@property (copy, nonatomic) NSString *name;
@property (copy, nonatomic) NSString *version;
@property (copy, nonatomic) NSString *url;
@property (copy, nonatomic) NSArray<BugsnagNotifier *> *dependencies;

- (NSDictionary *)toDict;

@end

NS_ASSUME_NONNULL_END
