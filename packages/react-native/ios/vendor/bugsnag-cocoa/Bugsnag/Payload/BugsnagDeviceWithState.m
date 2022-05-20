//
//  BugsnagDeviceWithState.m
//  Bugsnag
//
//  Created by Jamie Lynch on 01/04/2020.
//  Copyright © 2020 Bugsnag. All rights reserved.
//

#import "BSG_KSCrashReportFields.h"
#import "BSG_KSSystemInfo.h"
#import "BSG_RFC3339DateTool.h"
#import "BugsnagDevice+Private.h"
#import "BugsnagDeviceWithState.h"
#import "BugsnagCollections.h"
#import "BugsnagLogger.h"
#import "BugsnagSystemState.h"
#import "Bugsnag.h"

NSMutableDictionary *BSGParseDeviceMetadata(NSDictionary *event) {
    NSMutableDictionary *device = [NSMutableDictionary new];
    NSDictionary *state = [event valueForKeyPath:@"user.state.deviceState"];
    [device addEntriesFromDictionary:state];
    device[@"timezone"] = [event valueForKeyPath:@"system." BSG_KSSystemField_TimeZone];
    device[@"macCatalystiOSVersion"] = [event valueForKeyPath:@"system." BSG_KSSystemField_iOSSupportVersion];

#if TARGET_OS_SIMULATOR
    device[@"simulator"] = @YES;
#else
    device[@"simulator"] = @NO;
#endif

    device[@"wordSize"] = @(PLATFORM_WORD_SIZE);
    return device;
}

@implementation BugsnagDeviceWithState

+ (BugsnagDeviceWithState *) deviceFromJson:(NSDictionary *)json {
    BugsnagDeviceWithState *device = [BugsnagDeviceWithState new];
    device.id = json[@"id"];
    device.freeMemory = json[@"freeMemory"];
    device.freeDisk = json[@"freeDisk"];
    device.locale = json[@"locale"];
    device.manufacturer = json[@"manufacturer"];
    device.model = json[@"model"];
    device.modelNumber = json[@"modelNumber"];
    device.orientation = json[@"orientation"];
    device.osName = json[@"osName"];
    device.osVersion = json[@"osVersion"];
    device.runtimeVersions = json[@"runtimeVersions"];
    device.totalMemory = json[@"totalMemory"];

    id jailbroken = json[@"jailbroken"];
    if (jailbroken) {
        device.jailbroken = [(NSNumber *) jailbroken boolValue];
    }

    id time = json[@"time"];
    if ([time isKindOfClass:[NSString class]]) {
        device.time = [BSG_RFC3339DateTool dateFromString:time];
    }
    return device;
}

+ (BugsnagDeviceWithState *)deviceWithKSCrashReport:(NSDictionary *)event {
    BugsnagDeviceWithState *device = [BugsnagDeviceWithState new];
    [self populateFields:device dictionary:event];
    device.orientation = [event valueForKeyPath:@"user.state.deviceState.orientation"];
    device.freeMemory = [event valueForKeyPath:@"system." BSG_KSSystemField_Memory "." BSG_KSCrashField_Free];
    device.freeDisk = [event valueForKeyPath:@"system." BSG_KSSystemField_Disk "." BSG_KSCrashField_Free];

    NSString *val = [event valueForKeyPath:@"report.timestamp"];

    if (val != nil) {
        device.time = [BSG_RFC3339DateTool dateFromString:val];
    }

    NSDictionary *extraRuntimeInfo = [event valueForKeyPath:@"user.state.device.extraRuntimeInfo"];

    if (extraRuntimeInfo) {
        [device appendRuntimeInfo:extraRuntimeInfo];
    }

    return device;
}

- (NSDictionary *)toDictionary {
    NSMutableDictionary *dict = [[super toDictionary] mutableCopy];
    dict[@"freeDisk"] = self.freeDisk;
    dict[@"freeMemory"] = self.freeMemory;
    dict[@"orientation"] = self.orientation;
    dict[@"time"] = self.time ? [BSG_RFC3339DateTool stringFromDate:self.time] : nil;
    return dict;
}

@end
