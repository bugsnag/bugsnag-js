//
//  BugsnagDeviceWithState.m
//  Bugsnag
//
//  Created by Jamie Lynch on 01/04/2020.
//  Copyright © 2020 Bugsnag. All rights reserved.
//

#import "BugsnagDeviceWithState.h"
#import "BugsnagCollections.h"
#import "BugsnagLogger.h"
#import "BSGOutOfMemoryWatchdog.h"
#import "Bugsnag.h"

NSDictionary *BSGParseDeviceMetadata(NSDictionary *event) {
    NSMutableDictionary *device = [NSMutableDictionary new];
    NSDictionary *state = [event valueForKeyPath:@"user.state.deviceState"];
    [device addEntriesFromDictionary:state];
    BSGDictSetSafeObject(device, [event valueForKeyPath:@"system.time_zone"], @"timezone");

#if TARGET_OS_SIMULATOR
    BSGDictSetSafeObject(device, @YES, @"simulator");
#elif TARGET_OS_IPHONE || TARGET_OS_TV
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

@interface Bugsnag ()
+ (NSDateFormatter *)payloadDateFormatter;
@end

@interface BugsnagDevice ()
+ (void)populateFields:(BugsnagDevice *)device
            dictionary:(NSDictionary *)event;

- (NSDictionary *)toDictionary;
@end

@interface BugsnagDeviceWithState ()
@property (nonatomic, readonly) NSDateFormatter *formatter;
@end

@implementation BugsnagDeviceWithState

- (instancetype)init {
    if (self = [super init]) {
        _formatter = [Bugsnag payloadDateFormatter];
    }
    return self;
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
        device.time = [device.formatter dateFromString:val];
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
        BSGDictInsertIfNotNil(dict, [self.formatter stringFromDate:self.time], @"time");
    }
    return dict;
}

@end
