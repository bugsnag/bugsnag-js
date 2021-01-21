//
//  BugsnagSystemState.m
//  Bugsnag
//
//  Created by Karl Stenerud on 21.09.20.
//  Copyright © 2020 Bugsnag Inc. All rights reserved.
//

#import "BugsnagPlatformConditional.h"

#import "BugsnagSystemState.h"

#if TARGET_OS_OSX
#import <AppKit/AppKit.h>
#else
#import "BSGUIKit.h"
#endif

#import <Bugsnag/Bugsnag.h>

#import "BSGFileLocations.h"
#import "BSGJSONSerialization.h"
#import "BSG_KSMach.h"
#import "BSG_KSSystemInfo.h"
#import "BSG_RFC3339DateTool.h"
#import "BugsnagKVStoreObjC.h"
#import "BugsnagKeys.h"
#import "BugsnagLogger.h"
#import "BugsnagSessionTracker.h"
#import "BugsnagSystemState.h"

static NSDictionary* loadPreviousState(BugsnagKVStore *kvstore, NSString *jsonPath) {
    NSData *data = [NSData dataWithContentsOfFile:jsonPath];
    if(data == nil) {
        return @{};
    }

    NSError *error = nil;
    NSMutableDictionary *state = [BSGJSONSerialization JSONObjectWithData:data options:NSJSONReadingMutableContainers error:&error];
    if(error != nil) {
        bsg_log_err(@"Invalid previous system state data: %@", error);
        return @{};
    }
    if(state == nil) {
        bsg_log_err(@"Could not load previous system state");
        return @{};
    }
    if(![state isKindOfClass:[NSMutableDictionary class]]) {
        bsg_log_err(@"Previous system state has incorrect structure");
        return @{};
    }

    NSMutableDictionary *app = state[SYSTEMSTATE_KEY_APP];

    // KV-store versions of these are authoritative
    app[SYSTEMSTATE_APP_LAST_LOW_MEMORY_WARNING] = [kvstore stringForKey:SYSTEMSTATE_APP_LAST_LOW_MEMORY_WARNING defaultValue:@""];
    app[SYSTEMSTATE_APP_WAS_TERMINATED] = [kvstore NSBooleanForKey:SYSTEMSTATE_APP_WAS_TERMINATED defaultValue:false];
    app[SYSTEMSTATE_APP_IS_ACTIVE] = [kvstore NSBooleanForKey:SYSTEMSTATE_APP_IS_ACTIVE defaultValue:false];
    app[SYSTEMSTATE_APP_IS_IN_FOREGROUND] = [kvstore NSBooleanForKey:SYSTEMSTATE_APP_IS_IN_FOREGROUND defaultValue:false];
    app[SYSTEMSTATE_APP_DEBUGGER_IS_ACTIVE] = [kvstore NSBooleanForKey:SYSTEMSTATE_APP_DEBUGGER_IS_ACTIVE defaultValue:false];

    return state;
}

id blankIfNil(id value) {
    if(value == nil || [value isKindOfClass:[NSNull class]]) {
        return @"";
    }
    return value;
}

static NSMutableDictionary* initCurrentState(BugsnagKVStore *kvstore, BugsnagConfiguration *config) {
    NSDictionary *systemInfo = [BSG_KSSystemInfo systemInfo];

    bool isBeingDebugged = bsg_ksmachisBeingTraced();
    bool isInForeground = true;
    bool isActive = true;
#if TARGET_OS_OSX
    // MacOS "active" serves the same purpose as "foreground" in iOS
    isInForeground = [NSApplication sharedApplication].active;
#else
    UIApplicationState appState = [BSG_KSSystemInfo currentAppState];
    isInForeground = [BSG_KSSystemInfo isInForeground:appState];
    isActive = appState == UIApplicationStateActive;
#endif
    
    [kvstore deleteKey:SYSTEMSTATE_APP_LAST_LOW_MEMORY_WARNING];
    [kvstore deleteKey:SYSTEMSTATE_APP_WAS_TERMINATED];
    [kvstore setBoolean:isActive forKey:SYSTEMSTATE_APP_IS_ACTIVE];
    [kvstore setBoolean:isInForeground forKey:SYSTEMSTATE_APP_IS_IN_FOREGROUND];
    [kvstore setBoolean:isBeingDebugged forKey:SYSTEMSTATE_APP_DEBUGGER_IS_ACTIVE];

    NSMutableDictionary *app = [NSMutableDictionary new];
    app[BSGKeyId] = blankIfNil(systemInfo[@BSG_KSSystemField_BundleID]);
    app[BSGKeyName] = blankIfNil(systemInfo[@BSG_KSSystemField_BundleName]);
    app[BSGKeyReleaseStage] = config.releaseStage;
    app[BSGKeyVersion] = blankIfNil(systemInfo[@BSG_KSSystemField_BundleShortVersion]);
    app[BSGKeyBundleVersion] = blankIfNil(systemInfo[@BSG_KSSystemField_BundleVersion]);
    app[@"inForeground"] = @(isInForeground);
    app[@"isActive"] = @(isActive);
#if BSG_PLATFORM_TVOS
    app[BSGKeyType] = @"tvOS";
#elif BSG_PLATFORM_IOS
    app[BSGKeyType] = @"iOS";
#elif BSG_PLATFORM_OSX
    app[BSGKeyType] = @"macOS";
#endif
    app[SYSTEMSTATE_APP_DEBUGGER_IS_ACTIVE] = @(isBeingDebugged);

    NSMutableDictionary *device = [NSMutableDictionary new];
    device[SYSTEMSTATE_DEVICE_BOOT_TIME] = [BSG_RFC3339DateTool stringFromDate:systemInfo[@BSG_KSSystemField_BootTime]];
    device[@"id"] = systemInfo[@BSG_KSSystemField_DeviceAppHash];
    // device[@"lowMemory"] is initially unset
    device[@"osBuild"] = systemInfo[@BSG_KSSystemField_OSVersion];
    device[@"osVersion"] = systemInfo[@BSG_KSSystemField_SystemVersion];
    device[@"osName"] = systemInfo[@BSG_KSSystemField_SystemName];
    // Translated from 'iDeviceMaj,Min' into human-readable "iPhone X" description on the server
    device[@"model"] = systemInfo[@BSG_KSSystemField_Machine];
    device[@"modelNumber"] = systemInfo[@ BSG_KSSystemField_Model];
    device[@"wordSize"] = @(PLATFORM_WORD_SIZE);
    device[@"locale"] = [[NSLocale currentLocale] localeIdentifier];
    device[@"runtimeVersions"] = @{
        @"clangVersion": systemInfo[@BSG_KSSystemField_ClangVersion] ?: @"",
        @"osBuild": systemInfo[@BSG_KSSystemField_OSVersion] ?: @""
    };
#if BSG_PLATFORM_SIMULATOR
    device[@"simulator"] = @YES;
#else
    device[@"simulator"] = @NO;
#endif
    device[@"totalMemory"] = systemInfo[@BSG_KSSystemField_Memory][@"usable"];

    NSMutableDictionary *state = [NSMutableDictionary new];
    state[BSGKeyApp] = app;
    state[BSGKeyDevice] = device;

    return state;
}

static NSDictionary *copyDictionary(NSDictionary *launchState) {
    NSMutableDictionary *dictionary = [NSMutableDictionary dictionary];
    for (id key in launchState) {
        dictionary[key] = [launchState[key] copy];
    }
    return dictionary;
}

@interface BugsnagSystemState ()

@property(readonly,nonatomic) NSMutableDictionary *currentLaunchStateRW;
@property(readwrite,atomic) NSDictionary *currentLaunchState;
@property(readonly,nonatomic) NSString *persistenceFilePath;
@property(readonly,nonatomic) BugsnagKVStore *kvStore;

@end

@implementation BugsnagSystemState

- (instancetype)initWithConfiguration:(BugsnagConfiguration *)config {
    if (self = [super init]) {
        _kvStore = [BugsnagKVStore new];
        _persistenceFilePath = [BSGFileLocations current].systemState;
        _lastLaunchState = loadPreviousState(_kvStore, _persistenceFilePath);
        _currentLaunchStateRW = initCurrentState(_kvStore, config);
        _currentLaunchState = [_currentLaunchStateRW copy];
        [self sync];

        __weak __typeof__(self) weakSelf = self;
        NSNotificationCenter *center = [NSNotificationCenter defaultCenter];
#if TARGET_OS_OSX
        [center addObserverForName:NSApplicationWillTerminateNotification object:nil queue:nil usingBlock:^(NSNotification * _Nonnull note) {
            __strong __typeof__(self) strongSelf = weakSelf;
            [strongSelf.kvStore setBoolean:YES forKey:SYSTEMSTATE_APP_WAS_TERMINATED];
            // No need to update since we are shutting down.
        }];
        // MacOS "active" serves the same purpose as "foreground" in iOS
        [center addObserverForName:NSApplicationDidBecomeActiveNotification object:nil queue:nil usingBlock:^(NSNotification * _Nonnull note) {
            __strong __typeof__(self) strongSelf = weakSelf;
            [strongSelf.kvStore setBoolean:YES forKey:SYSTEMSTATE_APP_IS_IN_FOREGROUND];
            [strongSelf setValue:@YES forAppKey:SYSTEMSTATE_APP_IS_IN_FOREGROUND];
        }];
        [center addObserverForName:NSApplicationDidResignActiveNotification object:nil queue:nil usingBlock:^(NSNotification * _Nonnull note) {
            __strong __typeof__(self) strongSelf = weakSelf;
            [strongSelf.kvStore setBoolean:NO forKey:SYSTEMSTATE_APP_IS_IN_FOREGROUND];
            [strongSelf setValue:@NO forAppKey:SYSTEMSTATE_APP_IS_IN_FOREGROUND];
        }];
#else
        [center addObserverForName:UIApplicationWillTerminateNotification object:nil queue:nil usingBlock:^(NSNotification * _Nonnull note) {
            __strong __typeof__(self) strongSelf = weakSelf;
            [strongSelf.kvStore setBoolean:YES forKey:SYSTEMSTATE_APP_WAS_TERMINATED];
            // No need to update since we are shutting down.
        }];
        [center addObserverForName:UIApplicationWillEnterForegroundNotification object:nil queue:nil usingBlock:^(NSNotification * _Nonnull note) {
            __strong __typeof__(self) strongSelf = weakSelf;
            [strongSelf.kvStore setBoolean:YES forKey:SYSTEMSTATE_APP_IS_IN_FOREGROUND];
            [strongSelf setValue:@YES forAppKey:SYSTEMSTATE_APP_IS_IN_FOREGROUND];
        }];
        [center addObserverForName:UIApplicationDidEnterBackgroundNotification object:nil queue:nil usingBlock:^(NSNotification * _Nonnull note) {
            __strong __typeof__(self) strongSelf = weakSelf;
            [strongSelf.kvStore setBoolean:NO forKey:SYSTEMSTATE_APP_IS_IN_FOREGROUND];
            [strongSelf setValue:@NO forAppKey:SYSTEMSTATE_APP_IS_IN_FOREGROUND];
        }];
        [center addObserverForName:UIApplicationDidBecomeActiveNotification object:nil queue:nil usingBlock:^(NSNotification * _Nonnull note) {
            __strong __typeof__(self) strongSelf = weakSelf;
            [strongSelf.kvStore setBoolean:YES forKey:SYSTEMSTATE_APP_IS_ACTIVE];
            [strongSelf setValue:@YES forAppKey:SYSTEMSTATE_APP_IS_ACTIVE];
        }];
        [center addObserverForName:UIApplicationWillResignActiveNotification object:nil queue:nil usingBlock:^(NSNotification * _Nonnull note) {
            __strong __typeof__(self) strongSelf = weakSelf;
            [strongSelf.kvStore setBoolean:NO forKey:SYSTEMSTATE_APP_IS_ACTIVE];
            [strongSelf setValue:@NO forAppKey:SYSTEMSTATE_APP_IS_ACTIVE];
        }];
        [center addObserverForName:UIApplicationDidReceiveMemoryWarningNotification object:nil queue:nil usingBlock:^(NSNotification * _Nonnull note) {
            __strong __typeof__(self) strongSelf = weakSelf;
            NSString *date = [BSG_RFC3339DateTool stringFromDate:[NSDate date]];
            [strongSelf.kvStore setString:date forKey:SYSTEMSTATE_APP_LAST_LOW_MEMORY_WARNING];
            [strongSelf setValue:date forAppKey:SYSTEMSTATE_APP_LAST_LOW_MEMORY_WARNING];
        }];
#endif
        [center addObserver:self selector:@selector(sessionUpdateNotification:) name:BSGSessionUpdateNotification object:nil];
    }
    return self;
}

- (void)sessionUpdateNotification:(NSNotification *)notification {
    if (![BSGJSONSerialization isValidJSONObject:notification.object]) {
        return bsg_log_err("Invalid session payload in notification");
    }
    [self mutateLaunchState:^(NSMutableDictionary *state) {
        state[BSGKeySession] = notification.object;
    }];
}

- (void)recordAppUUID {
    // [BSG_KSSystemInfo appUUID] returns nil until we have called _dyld_register_func_for_add_image()
    [self setValue:[BSG_KSSystemInfo appUUID] forAppKey:BSGKeyMachoUUID];
}

- (void)setCodeBundleID:(NSString*)codeBundleID {
    [self setValue:codeBundleID forAppKey:BSGKeyCodeBundleId];
}

- (void)setValue:(id)value forAppKey:(NSString *)key {
    [self setValue:value forKey:key inSection:SYSTEMSTATE_KEY_APP];
}

- (void)setValue:(id)value forKey:(NSString *)key inSection:(NSString *)section {
    [self mutateLaunchState:^(NSMutableDictionary *state) {
        state[section][key] = value;
    }];
}

- (void)mutateLaunchState:(void (^)(NSMutableDictionary *state))block {
    // Run on a BG thread so we don't monopolize the notification queue.
    dispatch_async(dispatch_get_global_queue( DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^(void){
        @synchronized (self) {
            block(self.currentLaunchStateRW);
            // User-facing state should never mutate from under them.
            self.currentLaunchState = copyDictionary(self.currentLaunchStateRW);
        }
        [self sync];
    });
}

- (void)sync {
    NSDictionary *state = self.currentLaunchState;
    NSError *error = nil;
    NSAssert([BSGJSONSerialization isValidJSONObject:state], @"BugsnagSystemState cannot be converted to JSON data");
    if (![BSGJSONSerialization isValidJSONObject:state]) {
        bsg_log_err(@"System state cannot be written as JSON");
        return;
    }
    NSData *data = [BSGJSONSerialization dataWithJSONObject:state options:0 error:&error];
    if (error) {
        bsg_log_err(@"System state cannot be written as JSON: %@", error);
        return;
    }
    [data writeToFile:self.persistenceFilePath atomically:YES];
}

- (void)purge {
    NSFileManager *fm = [NSFileManager defaultManager];
    NSError *error = nil;
    if(![fm removeItemAtPath:self.persistenceFilePath error:&error]) {
        bsg_log_err(@"Could not remove persistence file: %@", error);
    }
    [self.kvStore purge];
    self->_lastLaunchState = loadPreviousState(self.kvStore, self.persistenceFilePath);
}

@end
