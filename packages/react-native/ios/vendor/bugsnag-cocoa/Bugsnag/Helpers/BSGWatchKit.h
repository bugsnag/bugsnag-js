//
//  BSGWatchKit.h
//  Bugsnag
//
//  Created by Karl Stenerud on 10.05.22.
//  Copyright © 2022 Bugsnag Inc. All rights reserved.
//

#if __has_include(<WatchKit/WatchKit.h>)

#import <WatchKit/WatchKit.h>

#define UIApplicationWillTerminateNotification        @"UIApplicationWillTerminateNotification"
#define WKApplicationWillEnterForegroundNotification  @"WKApplicationWillEnterForegroundNotification"
#define WKApplicationDidBecomeActiveNotification      @"WKApplicationDidBecomeActiveNotification"
#define WKApplicationWillResignActiveNotification     @"WKApplicationWillResignActiveNotification"
#define WKApplicationDidEnterBackgroundNotification   @"WKApplicationDidEnterBackgroundNotification"

#endif
