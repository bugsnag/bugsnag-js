#import "BSGConfigurationBuilder.h"

#import "BSGDefines.h"
#import "BSGKeys.h"
#import "BugsnagEndpointConfiguration.h"
#import "BugsnagLogger.h"

static BOOL BSGValueIsBoolean(id object) {
    return object != nil && [object isKindOfClass:[NSNumber class]]
            && CFGetTypeID((__bridge CFTypeRef)object) == CFBooleanGetTypeID();
}

static void LoadBoolean     (BugsnagConfiguration *config, NSDictionary *options, NSString *key);
static void LoadString      (BugsnagConfiguration *config, NSDictionary *options, NSString *key);
static void LoadNumber      (BugsnagConfiguration *config, NSDictionary *options, NSString *key);
static void LoadStringSet   (BugsnagConfiguration *config, NSDictionary *options, NSString *key);
static void LoadEndpoints   (BugsnagConfiguration *config, NSDictionary *options);
static void LoadSendThreads (BugsnagConfiguration *config, NSDictionary *options);

#pragma mark -

BugsnagConfiguration * BSGConfigurationWithOptions(NSDictionary *options) {
    NSString *apiKey = options[BSGKeyApiKey];
    if (apiKey != nil && ![apiKey isKindOfClass:[NSString class]]) {
        @throw [NSException exceptionWithName:NSInvalidArgumentException reason:@"Bugsnag apiKey must be a string" userInfo:nil];
    }

    BugsnagConfiguration *config = [[BugsnagConfiguration alloc] initWithApiKey:apiKey];

    NSArray<NSString *> *validKeys = @[
        BSGKeyApiKey,
        BSGKeyAppType,
        BSGKeyAppVersion,
        BSGKeyAutoDetectErrors,
        BSGKeyAutoTrackSessions,
        BSGKeyBundleVersion,
        BSGKeyEnabledReleaseStages,
        BSGKeyEndpoints,
        BSGKeyMaxBreadcrumbs,
        BSGKeyMaxPersistedEvents,
        BSGKeyMaxPersistedSessions,
        BSGKeyPersistUser,
        BSGKeyRedactedKeys,
        BSGKeyReleaseStage,
        BSGKeySendThreads,
    ];
    
    NSMutableSet *unknownKeys = [NSMutableSet setWithArray:options.allKeys];
    [unknownKeys minusSet:[NSSet setWithArray:validKeys]];
    if (unknownKeys.count > 0) {
        bsg_log_warn(@"Unknown dictionary keys passed in configuration options: %@", unknownKeys);
    }
    
    LoadString      (config, options, BSGKeyAppType);
    LoadString      (config, options, BSGKeyAppVersion);
    LoadBoolean     (config, options, BSGKeyAutoDetectErrors);
    LoadBoolean     (config, options, BSGKeyAutoTrackSessions);
    LoadString      (config, options, BSGKeyBundleVersion);
    LoadBoolean     (config, options, BSGKeyPersistUser);
    LoadString      (config, options, BSGKeyReleaseStage);
    LoadStringSet   (config, options, BSGKeyEnabledReleaseStages);
    LoadStringSet   (config, options, BSGKeyRedactedKeys);
    LoadEndpoints   (config, options);
    LoadNumber      (config, options, BSGKeyMaxBreadcrumbs);
    LoadNumber      (config, options, BSGKeyMaxPersistedEvents);
    LoadNumber      (config, options, BSGKeyMaxPersistedSessions);
    LoadSendThreads (config, options);
    return config;
}

static void LoadBoolean(BugsnagConfiguration *config, NSDictionary *options, NSString *key) {
    if (BSGValueIsBoolean(options[key])) {
        [config setValue:options[key] forKey:key];
    }
}

static void LoadString(BugsnagConfiguration *config, NSDictionary *options, NSString *key) {
    if (options[key] && [options[key] isKindOfClass:[NSString class]]) {
        [config setValue:options[key] forKey:key];
    }
}

static void LoadNumber(BugsnagConfiguration *config, NSDictionary *options, NSString *key) {
    if (options[key] && [options[key] isKindOfClass:[NSNumber class]]) {
        [config setValue:options[key] forKey:key];
    }
}

static void LoadStringSet(BugsnagConfiguration *config, NSDictionary *options, NSString *key) {
    if (options[key] && [options[key] isKindOfClass:[NSArray class]]) {
        NSArray *val = options[key];
        for (NSString *obj in val) {
            if (![obj isKindOfClass:[NSString class]]) {
                return;
            }
        }
        [config setValue:[NSSet setWithArray:val] forKey:key];
    }
}

static void LoadEndpoints(BugsnagConfiguration *config, NSDictionary *options) {
    if (options[BSGKeyEndpoints] && [options[BSGKeyEndpoints] isKindOfClass:[NSDictionary class]]) {
        NSDictionary *endpoints = options[BSGKeyEndpoints];

        NSString *notify = endpoints[BSGKeyNotifyEndpoint];
        if ([notify isKindOfClass:[NSString class]]) {
            config.endpoints.notify = notify;
        }
        NSString *sessions = endpoints[BSGKeySessionsEndpoint];
        if ([sessions isKindOfClass:[NSString class]]) {
            config.endpoints.sessions = sessions;
        }
    }
}

static void LoadSendThreads(BugsnagConfiguration *config, NSDictionary *options) {
#if BSG_HAVE_MACH_THREADS
    if (options[BSGKeySendThreads] && [options[BSGKeySendThreads] isKindOfClass:[NSString class]]) {
        NSString *sendThreads = [options[BSGKeySendThreads] lowercaseString];

        if ([@"unhandledonly" isEqualToString:sendThreads]) {
            config.sendThreads = BSGThreadSendPolicyUnhandledOnly;
        } else if ([@"always" isEqualToString:sendThreads]) {
            config.sendThreads = BSGThreadSendPolicyAlways;
        } else if ([@"never" isEqualToString:sendThreads]) {
            config.sendThreads = BSGThreadSendPolicyNever;
        }
    }
#endif
}
