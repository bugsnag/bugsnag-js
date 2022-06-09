//
//  BSGHardware.h
//  Bugsnag
//
//  Created by Karl Stenerud on 26.05.22.
//  Copyright © 2022 Bugsnag Inc. All rights reserved.
//

#ifndef BSGHardware_h
#define BSGHardware_h

#import <Foundation/Foundation.h>

#import "BSGDefines.h"
#import "BSGUIKit.h"
#import "BSGWatchKit.h"

#pragma mark Device

#if TARGET_OS_IOS
static inline UIDevice *BSGGetDevice() {
    return [UIDEVICE currentDevice];
}
#elif TARGET_OS_WATCH
static inline WKInterfaceDevice *BSGGetDevice() {
    return [WKInterfaceDevice currentDevice];
}
#endif

#pragma mark Battery

#if BSG_HAVE_BATTERY

static inline BOOL BSGIsBatteryStateKnown(long battery_state) {
#if TARGET_OS_IOS
    const long state_unknown = UIDeviceBatteryStateUnknown;
#elif TARGET_OS_WATCH
    const long state_unknown = WKInterfaceDeviceBatteryStateUnknown;
#endif
    return battery_state != state_unknown;
}

static inline BOOL BSGIsBatteryCharging(long battery_state) {
#if TARGET_OS_IOS
    const long state_charging = UIDeviceBatteryStateCharging;
#elif TARGET_OS_WATCH
    const long state_charging = WKInterfaceDeviceBatteryStateCharging;
#endif
    return battery_state >= state_charging;
}

#endif // BSG_HAVE_BATTERY

#endif /* BSGHardware_h */
