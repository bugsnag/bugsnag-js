//
//  BugsnagSystemInfo.m
//  Bugsnag
//
//  Created by Karl Stenerud on 21.09.20.
//  Copyright © 2020 Bugsnag Inc. All rights reserved.
//

#import <TargetConditionals.h>
#if TARGET_OS_OSX
#import <AppKit/AppKit.h>
#else
#import <UIKit/UIKit.h>
#endif

#import "BugsnagSystemState.h"
#import "BSGCachesDirectory.h"
#import "BSGJSONSerialization.h"
#import "BugsnagLogger.h"
#import "BugsnagKVStoreObjC.h"
#import "BSG_RFC3339DateTool.h"
#import "BSG_KSSystemInfo.h"
#import "BSG_KSMach.h"
#import "BugsnagKeys.h"
#import "Bugsnag.h"

#define STATE_DIR @"bugsnag/state"
#define STATE_FILE @"system_state.json"

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
#if BSG_PLATFORM_SIMULATOR
    device[@"simulator"] = @YES;
#else
    device[@"simulator"] = @NO;
#endif

    NSMutableDictionary *state = [NSMutableDictionary new];
    state[BSGKeyApp] = app;
    state[BSGKeyDevice] = device;

    return state;
}

NSDictionary *copyLaunchState(NSDictionary *launchState) {
    return @{
        BSGKeyApp: [launchState[BSGKeyApp] copy],
        BSGKeyDevice: [launchState[BSGKeyDevice] copy],
    };
}

@interface BugsnagSystemState ()

@property(readwrite,nonatomic) NSMutableDictionary *currentLaunchStateRW;
@property(readwrite,nonatomic) NSDictionary *currentLaunchState;
@property(readonly,nonatomic) NSString *persistenceFilePath;
@property(nonatomic) BugsnagKVStore *kvStore;

@end

@implementation BugsnagSystemState

- (instancetype)initWithConfiguration:(BugsnagConfiguration *)config {
    if (self = [super init]) {
        _kvStore = [BugsnagKVStore new];
        _persistenceFilePath = [[BSGCachesDirectory getSubdirPath:STATE_DIR] stringByAppendingPathComponent:STATE_FILE];
        _lastLaunchState = loadPreviousState(_kvStore, _persistenceFilePath);
        _currentLaunchStateRW = initCurrentState(_kvStore, config);
        _currentLaunchState = [_currentLaunchStateRW copy];
        [self sync];

        __weak __typeof__(self) weakSelf = self;
        NSNotificationCenter *center = [NSNotificationCenter defaultCenter];
#if TARGET_OS_OSX
        [center addObserverForName:NSApplicationWillTerminateNotification object:nil queue:nil usingBlock:^(NSNotification * _Nonnull note) {
            [weakSelf.kvStore setBoolean:YES forKey:SYSTEMSTATE_APP_WAS_TERMINATED];
            // No need to update since we are shutting down.
        }];
        // MacOS "active" serves the same purpose as "foreground" in iOS
        [center addObserverForName:NSApplicationDidBecomeActiveNotification object:nil queue:nil usingBlock:^(NSNotification * _Nonnull note) {
            [weakSelf.kvStore setBoolean:YES forKey:SYSTEMSTATE_APP_IS_IN_FOREGROUND];
            [weakSelf bgSetAppValue:@YES forKey:SYSTEMSTATE_APP_IS_IN_FOREGROUND];
        }];
        [center addObserverForName:NSApplicationDidResignActiveNotification object:nil queue:nil usingBlock:^(NSNotification * _Nonnull note) {
            [weakSelf.kvStore setBoolean:NO forKey:SYSTEMSTATE_APP_IS_IN_FOREGROUND];
            [weakSelf bgSetAppValue:@NO forKey:SYSTEMSTATE_APP_IS_IN_FOREGROUND];
        }];
#else
        [center addObserverForName:UIApplicationWillTerminateNotification object:nil queue:nil usingBlock:^(NSNotification * _Nonnull note) {
            [weakSelf.kvStore setBoolean:YES forKey:SYSTEMSTATE_APP_WAS_TERMINATED];
            // No need to update since we are shutting down.
        }];
        [center addObserverForName:UIApplicationWillEnterForegroundNotification object:nil queue:nil usingBlock:^(NSNotification * _Nonnull note) {
            [weakSelf.kvStore setBoolean:YES forKey:SYSTEMSTATE_APP_IS_IN_FOREGROUND];
            [weakSelf bgSetAppValue:@YES forKey:SYSTEMSTATE_APP_IS_IN_FOREGROUND];
        }];
        [center addObserverForName:UIApplicationDidEnterBackgroundNotification object:nil queue:nil usingBlock:^(NSNotification * _Nonnull note) {
            [weakSelf.kvStore setBoolean:NO forKey:SYSTEMSTATE_APP_IS_IN_FOREGROUND];
            [weakSelf bgSetAppValue:@NO forKey:SYSTEMSTATE_APP_IS_IN_FOREGROUND];
        }];
        [center addObserverForName:UIApplicationDidBecomeActiveNotification object:nil queue:nil usingBlock:^(NSNotification * _Nonnull note) {
            [weakSelf.kvStore setBoolean:YES forKey:SYSTEMSTATE_APP_IS_ACTIVE];
            [weakSelf bgSetAppValue:@YES forKey:SYSTEMSTATE_APP_IS_ACTIVE];
        }];
        [center addObserverForName:UIApplicationWillResignActiveNotification object:nil queue:nil usingBlock:^(NSNotification * _Nonnull note) {
            [weakSelf.kvStore setBoolean:NO forKey:SYSTEMSTATE_APP_IS_ACTIVE];
            [weakSelf bgSetAppValue:@NO forKey:SYSTEMSTATE_APP_IS_ACTIVE];
        }];
        [center addObserverForName:UIApplicationDidReceiveMemoryWarningNotification object:nil queue:nil usingBlock:^(NSNotification * _Nonnull note) {
            NSString *date = [BSG_RFC3339DateTool stringFromDate:[NSDate date]];
            [weakSelf.kvStore setString:date forKey:SYSTEMSTATE_APP_LAST_LOW_MEMORY_WARNING];
            [weakSelf bgSetAppValue:date forKey:SYSTEMSTATE_APP_LAST_LOW_MEMORY_WARNING];
        }];
#endif
    }
    return self;
}

- (void)setCodeBundleID:(NSString*)codeBundleID {
    [self bgSetAppValue:codeBundleID forKey:BSGKeyCodeBundleId];
}

- (void)bgSetAppValue:(id)value forKey:(NSString*)key {
    // Run on a BG thread so we don't monopolize the notification queue.
    dispatch_async(dispatch_get_global_queue( DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^(void){
        @synchronized (self) {
            self.currentLaunchStateRW[SYSTEMSTATE_KEY_APP][key] = value;
            // User-facing state should never mutate from under them.
            self.currentLaunchState = copyLaunchState(self.currentLaunchStateRW);
        }
        [self sync];
    });
}


- (void)sync {
    NSDictionary *state = self.currentLaunchState;
    NSError *error = nil;
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
