//
//  BugsnagDeviceWithState.m
//  Bugsnag
//
//  Created by Jamie Lynch on 01/04/2020.
//  Copyright © 2020 Bugsnag. All rights reserved.
//

#import "BugsnagPlatformConditional.h"
#import "BSG_RFC3339DateTool.h"

#import "BugsnagDeviceWithState.h"
#import "BugsnagCollections.h"
#import "BugsnagLogger.h"
#import "BSGOutOfMemoryWatchdog.h"
#import "Bugsnag.h"

NSDictionary *BSGParseDeviceMetadata(NSDictionary *event) {
    NSMutableDictionary *device = [NSMutableDictionary new];
    NSDictionary *state = [event valueForKeyPath:@"user.state.deviceState"];
    [device addEntriesFromDictionary:state];
    BSGDictInsertIfNotNil(device, [event valueForKeyPath:@"system.time_zone"], @"timezone");

#if BSG_PLATFORM_SIMULATOR
    BSGDictSetSafeObject(device, @YES, @"simulator");
#else
    BSGDictSetSafeObject(device, @NO, @"simulator");
#endif

    BSGDictSetSafeObject(device, @(PLATFORM_WORD_SIZE), @"wordSize");
    return device;
}

/**
 * Calculates the amount of free disk space on the device in bytes, for a given directory.
 * @param directory the directory whose disk space should be queried
 * @return free space in the number of bytes, or nil if this information could not be found
 */
NSNumber *BSGDeviceFreeSpace(NSSearchPathDirectory directory) {
    NSNumber *freeBytes = nil;
    NSFileManager *fileManager = [NSFileManager defaultManager];
    NSArray *searchPaths = NSSearchPathForDirectoriesInDomains(directory, NSUserDomainMask, true);
    NSString *path = [searchPaths lastObject];

    NSError *error;
    NSDictionary *fileSystemAttrs =
            [fileManager attributesOfFileSystemForPath:path error:&error];

    if (error) {
        bsg_log_warn(@"Failed to read free disk space: %@", error);
    } else {
        freeBytes = [fileSystemAttrs objectForKey:NSFileSystemFreeSize];
    }
    return freeBytes;
}

@interface BugsnagDevice ()
+ (void)populateFields:(BugsnagDevice *)device
            dictionary:(NSDictionary *)event;
- (void)appendRuntimeInfo:(NSDictionary *)info;
- (NSDictionary *)toDictionary;
@end

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
    if (time && [time isKindOfClass:[NSString class]]) {
        device.time = [BSG_RFC3339DateTool dateFromString:time];
    }
    return device;
}

+ (BugsnagDeviceWithState *)deviceWithOomData:(NSDictionary *)data {
    BugsnagDeviceWithState *device = [BugsnagDeviceWithState new];
    device.id = data[@"id"];
    device.osVersion = data[@"osVersion"];
    device.osName = data[@"osName"];
    device.model = data[@"model"];
    device.modelNumber = data[@"modelNumber"];
    device.locale = data[@"locale"];
    return device;
}

+ (BugsnagDeviceWithState *)deviceWithDictionary:(NSDictionary *)event {
    BugsnagDeviceWithState *device = [BugsnagDeviceWithState new];
    [self populateFields:device dictionary:event];
    device.orientation = [event valueForKeyPath:@"user.state.deviceState.orientation"];
    device.freeMemory = [event valueForKeyPath:@"system.memory.free"] ?: [event valueForKeyPath:@"system.memory.usable"];
    device.freeDisk = BSGDeviceFreeSpace(NSCachesDirectory);

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
    NSMutableDictionary *dict = (NSMutableDictionary *)
    [super toDictionary];
    BSGDictInsertIfNotNil(dict, self.freeDisk, @"freeDisk");
    BSGDictInsertIfNotNil(dict, self.freeMemory, @"freeMemory");
    BSGDictInsertIfNotNil(dict, self.orientation, @"orientation");

    if (self.time != nil) {
        BSGDictInsertIfNotNil(dict, [BSG_RFC3339DateTool stringFromDate:self.time], @"time");
    }
    return dict;
}

@end
