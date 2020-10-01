#import "BugsnagPlatformConditional.h"

#if BSG_PLATFORM_IOS || BSG_PLATFORM_TVOS
#define BSGOOMAvailable 1
#else
#define BSGOOMAvailable 0
#endif

#if BSGOOMAvailable
#import <UIKit/UIKit.h>
#endif
#import "BSGOutOfMemoryWatchdog.h"
#import "BSG_KSSystemInfo.h"
#import "BugsnagLogger.h"
#import "Bugsnag.h"
#import "BugsnagSessionTracker.h"
#import "Private.h"
#import "BugsnagErrorTypes.h"
#import "BSG_RFC3339DateTool.h"
#import "BSGJSONSerialization.h"
#import "BugsnagKeys.h"
#import "BugsnagCollections.h"
#import "BugsnagKVStoreObjC.h"

#define KV_KEY_IS_MONITORING_OOM @"oom-isMonitoringOOM"
#define KV_KEY_IS_ACTIVE @"oom-isActive"
#define KV_KEY_IS_IN_FOREGROUND @"oom-isInForeground"
#define KV_KEY_LAST_LOW_MEMORY_WARNING @"oom-lastLowMemoryWarning"
#define KV_KEY_APP_VERSION @"oom-appVersion"
#define KV_KEY_BUNDLE_VERSION @"oom-bundleVersion"

#define APP_KEY_IS_MONITORING_OOM @"isMonitoringOOM"
#define APP_KEY_IS_IN_FOREGROUND @"inForeground"
#define APP_KEY_IS_ACTIVE @"isActive"
#define DEVICE_KEY_LAST_LOW_MEMORY_WARNING @"lowMemory"
#define APP_KEY_VERSION @"version"
#define APP_KEY_BUNDLE_VERSION @"bundleVersion"

@interface BSGOutOfMemoryWatchdog ()
@property(nonatomic, getter=isWatching) BOOL watching;
@property(nonatomic, strong) NSString *sentinelFilePath;
@property(nonatomic, strong, readwrite) NSMutableDictionary *cachedFileInfo;
@property(nonatomic, strong, readwrite) NSDictionary *lastBootCachedFileInfo;
@property(nonatomic) NSString *codeBundleId;
@property(nonatomic) BugsnagKVStore *kvStore;
@property(nonatomic) NSDictionary *previousKeyValues;

- (void)shutdown;
@end

@implementation BSGOutOfMemoryWatchdog

- (instancetype)init {
    self = [self initWithSentinelPath:nil configuration:nil];
    return self;
}

- (instancetype)initWithSentinelPath:(NSString *)sentinelFilePath
                       configuration:(BugsnagConfiguration *)config {
    if (sentinelFilePath.length == 0) {
        return nil; // disallow enabling a watcher without a file path
    }
    if (self = [super init]) {
        _sentinelFilePath = sentinelFilePath;

#ifdef BSGOOMAvailable
        _kvStore = [BugsnagKVStore new];

        _previousKeyValues = getKeyValues(_kvStore);
        _lastBootCachedFileInfo = [self readSentinelFile];
        _cachedFileInfo = [self generateCacheInfoWithConfig:config];

        [_kvStore setBoolean:false forKey:KV_KEY_IS_MONITORING_OOM];
        [_kvStore setString:@"" forKey:KV_KEY_LAST_LOW_MEMORY_WARNING];
        NSDictionary *systemInfo = [BSG_KSSystemInfo systemInfo];
        [_kvStore setString:systemInfo[@BSG_KSSystemField_BundleShortVersion] forKey:KV_KEY_APP_VERSION];
        [_kvStore setString:systemInfo[@BSG_KSSystemField_BundleVersion] forKey:KV_KEY_BUNDLE_VERSION];

        _didOOMLastLaunch = calculateDidOOM(_kvStore, _previousKeyValues);
#endif
    }
    return self;
}

static NSDictionary *getKeyValues(BugsnagKVStore *store) {
    NSMutableDictionary *dict = [NSMutableDictionary new];
    dict[APP_KEY_IS_MONITORING_OOM] = [store NSBooleanForKey:KV_KEY_IS_MONITORING_OOM defaultValue:false];
    dict[APP_KEY_IS_ACTIVE] = [store NSBooleanForKey:KV_KEY_IS_ACTIVE defaultValue:false];
    dict[APP_KEY_IS_IN_FOREGROUND] = [store NSBooleanForKey:KV_KEY_IS_IN_FOREGROUND defaultValue:false];
    dict[APP_KEY_VERSION] = [store stringForKey:KV_KEY_APP_VERSION defaultValue:@""];
    dict[APP_KEY_BUNDLE_VERSION] = [store stringForKey:KV_KEY_BUNDLE_VERSION defaultValue:@""];
    dict[DEVICE_KEY_LAST_LOW_MEMORY_WARNING] = [store stringForKey:KV_KEY_LAST_LOW_MEMORY_WARNING defaultValue:@""];
    return dict;
}

BOOL calculateDidOOM(BugsnagKVStore *store, NSDictionary *previousValues) {
    BOOL wasMonitoring = [[previousValues valueForKey:APP_KEY_IS_MONITORING_OOM] boolValue];
    if(!wasMonitoring) {
        return NO;
    }

    BOOL wasActive = [[previousValues valueForKey:APP_KEY_IS_ACTIVE] boolValue];
    BOOL wasInForeground = [[previousValues valueForKey:APP_KEY_IS_IN_FOREGROUND] boolValue];
    if(!(wasActive && wasInForeground)) {
        return NO;
    }
    
    NSString *oldAppVersion = [previousValues valueForKey:APP_KEY_VERSION];
    NSString *newAppVersion = [store stringForKey:KV_KEY_APP_VERSION defaultValue:@""];
    NSString *oldBundleVersion = [previousValues valueForKey:APP_KEY_BUNDLE_VERSION];
    NSString *newBundleVersion = [store stringForKey:KV_KEY_BUNDLE_VERSION defaultValue:@""];

    if(![oldAppVersion isEqualToString:newAppVersion] || ![oldBundleVersion isEqualToString:newBundleVersion]) {
        return NO;
    }

    return YES;
}

- (void)start {
#if BSGOOMAvailable
    if ([self isWatching]) {
        return;
    }
    UIApplicationState state = [BSG_KSSystemInfo currentAppState];
    [self.kvStore setBoolean:true forKey:KV_KEY_IS_MONITORING_OOM];
    [self.kvStore setBoolean:[BSG_KSSystemInfo isInForeground:state] forKey:KV_KEY_IS_IN_FOREGROUND];
    [self.kvStore setBoolean:state == UIApplicationStateActive forKey:KV_KEY_IS_ACTIVE];

    [self writeSentinelFile];
    NSNotificationCenter *center = [NSNotificationCenter defaultCenter];
    [center addObserver:self
               selector:@selector(shutdown:)
                   name:UIApplicationWillTerminateNotification
                 object:nil];
    [center addObserver:self
               selector:@selector(handleTransitionToBackground:)
                   name:UIApplicationDidEnterBackgroundNotification
                 object:nil];
    [center addObserver:self
               selector:@selector(handleTransitionToForeground:)
                   name:UIApplicationWillEnterForegroundNotification
                 object:nil];
    [center addObserver:self
               selector:@selector(handleTransitionToActive:)
                   name:UIApplicationDidBecomeActiveNotification
                 object:nil];
    [center addObserver:self
               selector:@selector(handleTransitionToInactive:)
                   name:UIApplicationWillResignActiveNotification
                 object:nil];
    [center addObserver:self
               selector:@selector(handleLowMemoryChange:)
                   name:UIApplicationDidReceiveMemoryWarningNotification
                 object:nil];
    [center addObserver:self
               selector:@selector(handleUpdateSession:)
                   name:BSGSessionUpdateNotification
                 object:nil];
    [[Bugsnag configuration]
        addObserver:self
         forKeyPath:NSStringFromSelector(@selector(releaseStage))
            options:NSKeyValueObservingOptionNew
            context:nil];
    self.watching = YES;
#endif
}

- (void)shutdown:(NSNotification *)note {
    [self shutdown];
}

- (void)shutdown {
    if (![self isWatching]) {
        // Avoid unsubscribing from KVO when not observing
        // From the docs:
        // > Asking to be removed as an observer if not already registered as
        // > one results in an NSRangeException. You either call
        // > `removeObserver:forKeyPath:context: exactly once for the
        // > corresponding call to `addObserver:forKeyPath:options:context:`
        return;
    }
    [self.kvStore setBoolean:false forKey:KV_KEY_IS_MONITORING_OOM];
    self.watching = NO;
    [self deleteSentinelFile];
    [[NSNotificationCenter defaultCenter] removeObserver:self];
    @try {
        [[Bugsnag configuration]
            removeObserver:self
                forKeyPath:NSStringFromSelector(@selector(releaseStage))];
    } @catch (NSException *exception) {
        // Shouldn't happen, but if for some reason, unregistration happens
        // without registration, catch the resulting exception.
    }
}

- (void)observeValueForKeyPath:(NSString *)keyPath
                      ofObject:(id)object
                        change:(NSDictionary<NSString *, id> *)change
                       context:(void *)context {
    self.cachedFileInfo[BSGKeyApp][BSGKeyReleaseStage] = change[NSKeyValueChangeNewKey];
    [self writeSentinelFile];
}

- (void)handleTransitionToActive:(NSNotification *)note {
    [self.kvStore setBoolean:true forKey:KV_KEY_IS_ACTIVE];
    self.cachedFileInfo[BSGKeyApp][APP_KEY_IS_ACTIVE] = @YES;
    [self writeSentinelFile];
}

- (void)handleTransitionToInactive:(NSNotification *)note {
    [self.kvStore setBoolean:false forKey:KV_KEY_IS_ACTIVE];
    self.cachedFileInfo[BSGKeyApp][APP_KEY_IS_ACTIVE] = @NO;
    [self writeSentinelFile];
}

- (void)handleTransitionToForeground:(NSNotification *)note {
    [self.kvStore setBoolean:true forKey:KV_KEY_IS_IN_FOREGROUND];
    self.cachedFileInfo[BSGKeyApp][APP_KEY_IS_IN_FOREGROUND] = @YES;
    [self writeSentinelFile];
}

- (void)handleTransitionToBackground:(NSNotification *)note {
    [self.kvStore setBoolean:false forKey:KV_KEY_IS_IN_FOREGROUND];
    self.cachedFileInfo[BSGKeyApp][APP_KEY_IS_IN_FOREGROUND] = @NO;
    [self writeSentinelFile];
}

- (void)handleLowMemoryChange:(NSNotification *)note {
    NSString *date = [BSG_RFC3339DateTool stringFromDate:[NSDate date]];
    [self.kvStore setString:date forKey:KV_KEY_LAST_LOW_MEMORY_WARNING];
    self.cachedFileInfo[BSGKeyDevice][DEVICE_KEY_LAST_LOW_MEMORY_WARNING] = date;
    [self writeSentinelFile];
}

- (void)handleUpdateSession:(NSNotification *)note {
    id session = [note object];
    NSMutableDictionary *cache = (id)self.cachedFileInfo;
    if (session) {
        cache[BSGKeySession] = session;
    } else {
        [cache removeObjectForKey:BSGKeySession];
    }
    [self writeSentinelFile];
}

- (void)setCodeBundleId:(NSString *)codeBundleId {
    _codeBundleId = codeBundleId;
    BSGDictInsertIfNotNil(self.cachedFileInfo[BSGKeyApp], codeBundleId, BSGKeyCodeBundleId);

    if ([self isWatching]) {
        [self writeSentinelFile];
    }
}

- (void)deleteSentinelFile {
    NSError *error = nil;
    [[NSFileManager defaultManager] removeItemAtPath:self.sentinelFilePath
                                               error:&error];
    if (error) {
        bsg_log_err(@"Failed to delete oom watchdog file: %@", error);
        unlink([self.sentinelFilePath UTF8String]);
    }
}

- (NSDictionary *)readSentinelFile {
    if (![[NSFileManager defaultManager] fileExistsAtPath:self.sentinelFilePath]) {
        return @{};
    }

    NSError *error = nil;
    NSData *data = [NSData dataWithContentsOfFile:self.sentinelFilePath options:0 error:&error];
    if (error) {
        bsg_log_err(@"Failed to read oom watchdog file: %@", error);
        return nil;
    }
    NSMutableDictionary *contents = [BSGJSONSerialization JSONObjectWithData:data options:NSJSONReadingMutableContainers error:&error];
    if (error) {
        bsg_log_err(@"Failed to read oom watchdog file: %@", error);
        return nil;
    }

    // Override JSON data with KV store data
    contents[BSGKeyApp][APP_KEY_IS_MONITORING_OOM] = [self.kvStore NSBooleanForKey:KV_KEY_IS_MONITORING_OOM defaultValue:false];
    contents[BSGKeyApp][APP_KEY_IS_ACTIVE] = [self.kvStore NSBooleanForKey:KV_KEY_IS_ACTIVE defaultValue:false];
    contents[BSGKeyApp][APP_KEY_IS_IN_FOREGROUND] = [self.kvStore NSBooleanForKey:KV_KEY_IS_IN_FOREGROUND defaultValue:false];
    contents[BSGKeyDevice][DEVICE_KEY_LAST_LOW_MEMORY_WARNING] = [self.kvStore stringForKey:KV_KEY_LAST_LOW_MEMORY_WARNING defaultValue:@""];

    return contents;
}

- (void)writeSentinelFile {
    NSError *error = nil;
    if (![BSGJSONSerialization isValidJSONObject:self.cachedFileInfo]) {
        bsg_log_err(@"Cached oom watchdog data cannot be written as JSON");
        return;
    }
    NSData *data = [BSGJSONSerialization dataWithJSONObject:self.cachedFileInfo options:0 error:&error];
    if (error) {
        bsg_log_err(@"Cached oom watchdog data cannot be written as JSON: %@", error);
        return;
    }
    [data writeToFile:self.sentinelFilePath atomically:YES];
}

- (NSMutableDictionary *)generateCacheInfoWithConfig:(BugsnagConfiguration *)config {
    NSDictionary *systemInfo = [BSG_KSSystemInfo systemInfo];
    NSMutableDictionary *cache = [NSMutableDictionary new];
    NSMutableDictionary *app = [NSMutableDictionary new];

    app[BSGKeyId] = systemInfo[@BSG_KSSystemField_BundleID] ?: @"";
    app[BSGKeyName] = systemInfo[@BSG_KSSystemField_BundleName] ?: @"";
    app[BSGKeyReleaseStage] = config.releaseStage;
    app[BSGKeyVersion] = systemInfo[@BSG_KSSystemField_BundleShortVersion] ?: @"";
    app[BSGKeyBundleVersion] = systemInfo[@BSG_KSSystemField_BundleVersion] ?: @"";
    // 'codeBundleId' only (optionally) exists for React Native clients and defaults otherwise to nil
    BSGDictInsertIfNotNil(app, self.codeBundleId, BSGKeyCodeBundleId);
#if BSGOOMAvailable
    UIApplicationState state = [BSG_KSSystemInfo currentAppState];
    app[@"inForeground"] = @([BSG_KSSystemInfo isInForeground:state]);
    app[@"isActive"] = @(state == UIApplicationStateActive);
#else
    app[@"inForeground"] = @YES;
#endif
#if BSG_PLATFORM_TVOS
    app[BSGKeyType] = @"tvOS";
#elif BSG_PLATFORM_IOS
    app[BSGKeyType] = @"iOS";
#endif
    cache[BSGKeyApp] = app;

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
    cache[BSGKeyDevice] = device;

    return cache;
}

@end
