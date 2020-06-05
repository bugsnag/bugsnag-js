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

@property NSString *name;
@property NSString *version;
@property NSString *url;
@property NSMutableArray<BugsnagNotifier *> *dependencies;

@end

NS_ASSUME_NONNULL_END
