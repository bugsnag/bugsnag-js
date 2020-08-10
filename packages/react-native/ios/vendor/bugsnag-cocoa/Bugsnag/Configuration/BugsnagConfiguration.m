//
//  BugsnagConfiguration.m
//
//  Created by Conrad Irwin on 2014-10-01.
//
//  Copyright (c) 2014 Bugsnag, Inc. All rights reserved.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall remain in place
// in this source code.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
//

#import "BugsnagPlatformConditional.h"

#import "BugsnagConfiguration.h"
#import "BugsnagKeys.h"
#import "BSG_RFC3339DateTool.h"
#import "BugsnagUser.h"
#import "BugsnagSessionTracker.h"
#import "BugsnagLogger.h"
#import "BSGConfigurationBuilder.h"
#import "BugsnagBreadcrumbs.h"
#import "BugsnagMetadataStore.h"
#import "BSGSerialization.h"
#import "BugsnagEndpointConfiguration.h"
#import "BugsnagErrorTypes.h"
#import "BugsnagStateEvent.h"
#import "BugsnagCollections.h"
#import "BugsnagMetadataInternal.h"

static NSString *const BSGApiKeyMissingError = @"No Bugsnag API Key set";
static NSString *const BSGInitError = @"Init is unavailable.  Use [[BugsnagConfiguration alloc] initWithApiKey:] instead.";
static const int BSGApiKeyLength = 32;

// User info persistence keys
NSString * const kBugsnagUserEmailAddress = @"BugsnagUserEmailAddress";
NSString * const kBugsnagUserName = @"BugsnagUserName";
NSString * const kBugsnagUserUserId = @"BugsnagUserUserId";

@interface BugsnagUser ()
- (instancetype)initWithDictionary:(NSDictionary *)dict;
- (instancetype)initWithUserId:(NSString *)userId name:(NSString *)name emailAddress:(NSString *)emailAddress;
- (NSDictionary *)toJson;
@end

@interface BugsnagConfiguration ()

/**
 *  Hooks for modifying crash reports before it is sent to Bugsnag
 */
@property(nonatomic, readwrite, strong) NSMutableArray *onSendBlocks;

/**
 *  Hooks for modifying sessions before they are sent to Bugsnag. Intended for internal use only by React Native/Unity.
 */
@property(nonatomic, readwrite, strong) NSMutableArray *onSessionBlocks;
@property(nonatomic, readwrite, strong) NSMutableArray *onBreadcrumbBlocks;
@property(nonatomic, readwrite, strong) NSMutableSet *plugins;
@property(readonly, retain, nullable) NSURL *notifyURL;
@property(readonly, retain, nullable) NSURL *sessionURL;

/**
 *  Additional information about the state of the app or environment at the
 *  time the report was generated
 */
@property(readwrite, retain, nullable) BugsnagMetadata *metadata;

/**
 *  Meta-information about the state of Bugsnag
 */
@property(readwrite, retain, nullable) BugsnagMetadata *config;
@end

// =============================================================================
// MARK: - BugsnagConfiguration
// =============================================================================

@implementation BugsnagConfiguration

+ (instancetype _Nonnull)loadConfig {
    NSDictionary *options = [[NSBundle mainBundle] infoDictionary][@"bugsnag"];
    return [BSGConfigurationBuilder configurationFromOptions:options];
}

+ (instancetype)loadConfigFromOptions:(NSDictionary *)options {
    return [BSGConfigurationBuilder configurationFromOptions:options];
}

// -----------------------------------------------------------------------------
// MARK: - <NSCopying>
// -----------------------------------------------------------------------------

/**
 * Produce a shallow copy of the BugsnagConfiguration object.
 *
 * @param zone This parameter is ignored. Memory zones are no longer used by Objective-C.
 */
- (nonnull id)copyWithZone:(nullable NSZone *)zone {
    BugsnagConfiguration *copy = [[BugsnagConfiguration alloc] initWithApiKey:[NSMutableString stringWithString:self.apiKey]];
    // Omit apiKey - it's set explicitly in the line above
    [copy setAppType:self.appType];
    [copy setAppVersion:self.appVersion];
    [copy setAutoDetectErrors:self.autoDetectErrors];
    [copy setAutoTrackSessions:self.autoTrackSessions];
    [copy setBundleVersion:self.bundleVersion];
    [copy setConfig:[[BugsnagMetadata alloc] initWithDictionary:[[self.config toDictionary] mutableCopy]]];
    [copy setContext:self.context];
    [copy setEnabledBreadcrumbTypes:self.enabledBreadcrumbTypes];
    [copy setEnabledErrorTypes:self.enabledErrorTypes];
    [copy setEnabledReleaseStages:self.enabledReleaseStages];
    [copy setRedactedKeys:self.redactedKeys];
    [copy setMaxBreadcrumbs:self.maxBreadcrumbs];
    [copy setMetadata: [[BugsnagMetadata alloc] initWithDictionary:[[self.metadata toDictionary] mutableCopy]]];
    [copy setEndpoints:self.endpoints];
    [copy setOnCrashHandler:self.onCrashHandler];
    [copy setPersistUser:self.persistUser];
    [copy setPlugins:[self.plugins copy]];
    [copy setReleaseStage:self.releaseStage];
    [copy setSession:[self.session copy]];
    [copy setSendThreads:self.sendThreads];
    [copy setUser:self.user.id
        withEmail:self.user.email
          andName:self.user.name];

    // retain original blocks to allow removing blocks added in config
    // as creating a copy of the array would prevent this
    [copy setOnBreadcrumbBlocks:self.onBreadcrumbBlocks];
    [copy setOnSendBlocks:self.onSendBlocks];
    [copy setOnSessionBlocks:self.onSessionBlocks];
    return copy;
}

// -----------------------------------------------------------------------------
// MARK: - Class Methods
// -----------------------------------------------------------------------------

/**
 * Determine the apiKey-validity of a passed-in string:
 * Exactly 32 hexadecimal digits.
 *
 * @param apiKey The API key.
 * @returns A boolean representing whether the apiKey is valid.
 */
+ (BOOL)isValidApiKey:(NSString *)apiKey {
    if ([self isApiKeyMissing:apiKey]) {
        return false;
    }

    NSCharacterSet *chars = [[NSCharacterSet
        characterSetWithCharactersInString:@"0123456789ABCDEF"] invertedSet];

    BOOL isHex = (NSNotFound == [[apiKey uppercaseString] rangeOfCharacterFromSet:chars].location);

    return isHex && [apiKey length] == BSGApiKeyLength;
}

/**
 * Check if the API Key is missing, i.e. it's nil, not a string or is empty.
 *
 * This is distinct from 'isValidApiKey' to allow throwing an exception in this case, but not
 * if the API Key is in the wrong format.
 *
 * @param apiKey The API key.
 * @returns A boolean representing whether the API key is nil, of the wrong type or is an empty string
 */
+ (BOOL)isApiKeyMissing:(NSString *)apiKey {
    return apiKey == nil || ![apiKey isKindOfClass:[NSString class]] || [apiKey length] == 0;
}

// -----------------------------------------------------------------------------
// MARK: - Initializers
// -----------------------------------------------------------------------------

/**
 * Should not be called, but if it _is_ then fail meaningfully rather than silently
 */
- (instancetype)init {
    @throw BSGInitError;
}

/**
 * The designated initializer.
 */
- (instancetype _Nonnull)initWithApiKey:(NSString *_Nonnull)apiKey
{
    [self setApiKey:apiKey];

    self = [super init];

    _metadata = [[BugsnagMetadata alloc] init];
    _config = [[BugsnagMetadata alloc] init];
    _bundleVersion = NSBundle.mainBundle.infoDictionary[@"CFBundleVersion"];
    _endpoints = [BugsnagEndpointConfiguration new];
    _sessionURL = [NSURL URLWithString:@"https://sessions.bugsnag.com"];
    _autoDetectErrors = YES;
    _notifyURL = [NSURL URLWithString:BSGDefaultNotifyUrl];
    _onSendBlocks = [NSMutableArray new];
    _onSessionBlocks = [NSMutableArray new];
    _onBreadcrumbBlocks = [NSMutableArray new];
    _plugins = [NSMutableSet new];
    _enabledReleaseStages = nil;
    _redactedKeys = [NSSet setWithArray:@[@"password"]];
    _enabledBreadcrumbTypes = BSGEnabledBreadcrumbTypeAll;
    _maxBreadcrumbs = 25;
    _autoTrackSessions = YES;
    _sendThreads = BSGThreadSendPolicyAlways;
    // Default to recording all error types
    _enabledErrorTypes = [BugsnagErrorTypes new];

    // Enabling OOM detection only happens in release builds, to avoid triggering
    // the heuristic when killing/restarting an app in Xcode or similar.
    _persistUser = YES;
    // Only gets persisted user data if there is any, otherwise nil
    // persistUser isn't settable until post-init.
    _user = [self getPersistedUserData];
    [self setUserMetadataFromUser:_user];

    if ([NSURLSession class]) {
        _session = [NSURLSession
            sessionWithConfiguration:[NSURLSessionConfiguration
                                         defaultSessionConfiguration]];
    }
    #if DEBUG
        _releaseStage = BSGKeyDevelopment;
    #else
        _releaseStage = BSGKeyProduction;
    #endif

    #if BSG_PLATFORM_TVOS
        _appType = @"tvOS";
    #elif BSG_PLATFORM_IOS
        _appType = @"iOS";
    #elif BSG_PLATFORM_OSX
        _appType = @"macOS";
    #endif
    return self;
}

// -----------------------------------------------------------------------------
// MARK: - Instance Methods
// -----------------------------------------------------------------------------

/**
 *  Whether reports should be sent, based on release stage options
 *
 *  @return YES if reports should be sent based on this configuration
 */
- (BOOL)shouldSendReports {
    return self.enabledReleaseStages.count == 0 ||
           [self.enabledReleaseStages containsObject:self.releaseStage];
}

- (void)setUser:(NSString *_Nullable)userId
      withEmail:(NSString *_Nullable)email
        andName:(NSString *_Nullable)name {
    _user = [[BugsnagUser alloc] initWithUserId:userId name:name emailAddress:email];

    // Persist the user
    if (_persistUser)
        [self persistUserData];

    // Add user info to the metadata
    [self setUserMetadataFromUser:self.user];
}

/**
 * Add user data to the Configuration metadata
 *
 * @param user A BugsnagUser object containing data to be added to the configuration metadata.
 */
- (void)setUserMetadataFromUser:(BugsnagUser *)user {
    [self.metadata addMetadata:user.id withKey:BSGKeyId toSection:BSGKeyUser];
    [self.metadata addMetadata:user.name         withKey:BSGKeyName  toSection:BSGKeyUser];
    [self.metadata addMetadata:user.email withKey:BSGKeyEmail toSection:BSGKeyUser];
}

// =============================================================================
// MARK: - onSendBlock
// =============================================================================

- (void)addOnSendErrorBlock:(BugsnagOnSendErrorBlock _Nonnull)block {
    [(NSMutableArray *)self.onSendBlocks addObject:[block copy]];
}

- (void)removeOnSendErrorBlock:(BugsnagOnSendErrorBlock _Nonnull )block
{
    [(NSMutableArray *)self.onSendBlocks removeObject:block];
}

// =============================================================================
// MARK: - onSessionBlock
// =============================================================================

- (void)addOnSessionBlock:(BugsnagOnSessionBlock)block {
    [(NSMutableArray *)self.onSessionBlocks addObject:[block copy]];
}

- (void)removeOnSessionBlock:(BugsnagOnSessionBlock)block {
    [(NSMutableArray *)self.onSessionBlocks removeObject:block];
}

// =============================================================================
// MARK: - onBreadcrumbBlock
// =============================================================================

- (void)addOnBreadcrumbBlock:(BugsnagOnBreadcrumbBlock _Nonnull)block {
    [(NSMutableArray *)self.onBreadcrumbBlocks addObject:[block copy]];
}

- (void)removeOnBreadcrumbBlock:(BugsnagOnBreadcrumbBlock _Nonnull)block {
    [(NSMutableArray *)self.onBreadcrumbBlocks removeObject:block];
}

- (NSDictionary *)errorApiHeaders {
    return @{
             BSGHeaderApiPayloadVersion: @"4.0",
             BSGHeaderApiKey: self.apiKey,
             BSGHeaderApiSentAt: [BSG_RFC3339DateTool stringFromDate:[NSDate new]]
    };
}

- (NSDictionary *)sessionApiHeaders {
    return @{
             BSGHeaderApiPayloadVersion: @"1.0",
             BSGHeaderApiKey: self.apiKey,
             BSGHeaderApiSentAt: [BSG_RFC3339DateTool stringFromDate:[NSDate new]]
             };
}

- (void)setEndpoints:(BugsnagEndpointConfiguration *)endpoints {
    _endpoints = endpoints;
    _notifyURL = [NSURL URLWithString:endpoints.notify];
    _sessionURL = [NSURL URLWithString:endpoints.sessions];

    // This causes a crash under DEBUG but is ignored in production
    NSAssert([self isValidUrl:_notifyURL], @"Invalid URL supplied for notify endpoint");

    if (![self isValidUrl:_sessionURL]) {
        _sessionURL = nil;
    }
}

- (BOOL)isValidUrl:(NSURL *)url {
    return url != nil && url.scheme != nil && url.host != nil;
}

// MARK: - User Persistence

@synthesize persistUser = _persistUser;

- (BOOL)persistUser {
    @synchronized (self) {
        return _persistUser;
    }
}

- (void)setPersistUser:(BOOL)persistUser {
    @synchronized (self) {
        _persistUser = persistUser;
        if (persistUser) {
            [self persistUserData];
        }
        else {
            [self deletePersistedUserData];
        }
    }
}

/**
 * Retrieve a persisted user, if we have any valid, persisted fields, or nil otherwise
 */
- (BugsnagUser *)getPersistedUserData {
    @synchronized(self) {
        NSUserDefaults *userDefaults = [NSUserDefaults standardUserDefaults];
        NSString *email = [userDefaults objectForKey:kBugsnagUserEmailAddress];
        NSString *name = [userDefaults objectForKey:kBugsnagUserName];
        NSString *userId = [userDefaults objectForKey:kBugsnagUserUserId];

        if (email || name || userId) {
            return [[BugsnagUser alloc] initWithUserId:userId name:name emailAddress:email];
        } else {
            return [[BugsnagUser alloc] initWithUserId:nil name:nil emailAddress:nil];
        }
    }
}

/**
 * Store user data in a secure location (i.e. the keychain) that persists between application runs
 * 'storing' nil values deletes them.
 */
- (void)persistUserData {
    @synchronized(self) {
        if (_user) {
            NSUserDefaults *userDefaults = [NSUserDefaults standardUserDefaults];
            
            // Email
            if (_user.email) {
                [userDefaults setObject:_user.email forKey:kBugsnagUserEmailAddress];
            }
            else {
                [userDefaults removeObjectForKey:kBugsnagUserEmailAddress];
            }

            // Name
            if (_user.name) {
                [userDefaults setObject:_user.name forKey:kBugsnagUserName];
            }
            else {
                [userDefaults removeObjectForKey:kBugsnagUserName];
            }

            // UserId
            if (_user.id) {
                [userDefaults setObject:_user.id forKey:kBugsnagUserUserId];
            }
            else {
                [userDefaults removeObjectForKey:kBugsnagUserUserId];
            }
        }
    }
}

/**
 * Delete any persisted user data
 */
-(void)deletePersistedUserData {
    @synchronized(self) {
        NSUserDefaults *userDefaults = [NSUserDefaults standardUserDefaults];
        [userDefaults removeObjectForKey:kBugsnagUserEmailAddress];
        [userDefaults removeObjectForKey:kBugsnagUserName];
        [userDefaults removeObjectForKey:kBugsnagUserUserId];
    }
}

// -----------------------------------------------------------------------------
// MARK: - Properties: Getters and Setters
// -----------------------------------------------------------------------------

@synthesize maxBreadcrumbs = _maxBreadcrumbs;

- (NSUInteger)maxBreadcrumbs {
    @synchronized (self) {
        return _maxBreadcrumbs;
    }
}

- (void)setMaxBreadcrumbs:(NSUInteger)maxBreadcrumbs {
    @synchronized (self) {
        if (maxBreadcrumbs <= 100) {
            _maxBreadcrumbs = maxBreadcrumbs;
        } else {
            bsg_log_err(@"Invalid configuration value detected. Option maxBreadcrumbs "
                        "should be an integer between 0-100. Supplied value is %lu",
                        (unsigned long) maxBreadcrumbs);
        }
    }
}

/**
 * Specific types of breadcrumb should be recorded if either enabledBreadcrumbTypes
 * is None, or contains the type.
 *
 * @param type The breadcrumb type to test
 * @returns Whether to record the breadcrumb
 */
- (BOOL)shouldRecordBreadcrumbType:(BSGBreadcrumbType)type {
    // enabledBreadcrumbTypes is BSGEnabledBreadcrumbTypeNone
    if (self.enabledBreadcrumbTypes == BSGEnabledBreadcrumbTypeNone && type != BSGBreadcrumbTypeManual) {
        return NO;
    }

    switch (type) {
        case BSGBreadcrumbTypeManual:
            return YES;
        case BSGBreadcrumbTypeError :
            return self.enabledBreadcrumbTypes & BSGEnabledBreadcrumbTypeError;
        case BSGBreadcrumbTypeLog:
            return self.enabledBreadcrumbTypes & BSGEnabledBreadcrumbTypeLog;
        case BSGBreadcrumbTypeNavigation:
            return self.enabledBreadcrumbTypes & BSGEnabledBreadcrumbTypeNavigation;
        case BSGBreadcrumbTypeProcess:
            return self.enabledBreadcrumbTypes & BSGEnabledBreadcrumbTypeProcess;
        case BSGBreadcrumbTypeRequest:
            return self.enabledBreadcrumbTypes & BSGEnabledBreadcrumbTypeRequest;
        case BSGBreadcrumbTypeState:
            return self.enabledBreadcrumbTypes & BSGEnabledBreadcrumbTypeState;
        case BSGBreadcrumbTypeUser:
            return self.enabledBreadcrumbTypes & BSGEnabledBreadcrumbTypeUser;
    }
    return NO;
}

// MARK: -

@synthesize releaseStage = _releaseStage;

- (NSString *)releaseStage {
    @synchronized (self) {
        return _releaseStage;
    }
}

- (void)setReleaseStage:(NSString *)newReleaseStage {
    @synchronized (self) {
        NSString *key = NSStringFromSelector(@selector(releaseStage));
        [self willChangeValueForKey:key];
        _releaseStage = newReleaseStage;
        [self didChangeValueForKey:key];
        [self.config addMetadata:newReleaseStage
                         withKey:BSGKeyReleaseStage
                       toSection:BSGKeyConfig];
    }
}

// MARK: -

@synthesize enabledReleaseStages = _enabledReleaseStages;

- (NSSet<NSString *> *)enabledReleaseStages {
    @synchronized (self) {
        return _enabledReleaseStages;
    }
}

- (void)setEnabledReleaseStages:(NSSet<NSString *> *)newReleaseStages
{
    @synchronized (self) {
        NSSet<NSString *> *releaseStagesCopy = [newReleaseStages copy];
        _enabledReleaseStages = releaseStagesCopy;
        [self.config addMetadata:[releaseStagesCopy allObjects]
                         withKey:BSGKeyEnabledReleaseStages
                       toSection:BSGKeyConfig];
    }
}

// MARK: - enabledBreadcrumbTypes

@synthesize enabledBreadcrumbTypes = _enabledBreadcrumbTypes;

- (BSGEnabledBreadcrumbType)enabledBreadcrumbTypes {
    @synchronized (self) {
        return _enabledBreadcrumbTypes;
    }
}

- (void)setEnabledBreadcrumbTypes:(BSGEnabledBreadcrumbType)enabledBreadcrumbTypes {
    @synchronized (self) {
        _enabledBreadcrumbTypes = enabledBreadcrumbTypes;
    }
}

// MARK: -

@synthesize context = _context;

- (NSString *)context {
    @synchronized (self) {
        return _context;
    }
}

- (void)setContext:(NSString *)newContext {
    @synchronized (self) {
        _context = newContext;
        [self.config addMetadata:newContext
                         withKey:BSGKeyContext
                       toSection:BSGKeyConfig];
    }
}

// MARK: -

@synthesize appVersion = _appVersion;

- (NSString *)appVersion {
    @synchronized (self) {
        return _appVersion;
    }
}

- (void)setAppVersion:(NSString *)newVersion {
    @synchronized (self) {
        _appVersion = newVersion;
        [self.config addMetadata:newVersion
                         withKey:BSGKeyAppVersion
                       toSection:BSGKeyConfig];
    }
}

// MARK: -

@synthesize bundleVersion = _bundleVersion;

- (NSString *)bundleVersion {
    @synchronized (self) {
        return _bundleVersion;
    }
}

- (void)setBundleVersion:(NSString *)newVersion {
    @synchronized (self) {
        _bundleVersion = newVersion;
        [self.config addMetadata:newVersion
                         withKey:BSGKeyBundleVersion
                       toSection:BSGKeyConfig];
    }
}

// MARK: -

@synthesize apiKey = _apiKey;

- (NSString *)apiKey {
    return _apiKey;
}

- (void)setApiKey:(NSString *)apiKey {
    if ([BugsnagConfiguration isApiKeyMissing:apiKey]) {
        @throw BSGApiKeyMissingError;
    }

    if (![BugsnagConfiguration isValidApiKey:apiKey]) {
        bsg_log_warn(@"Invalid configuration. apiKey should be a 32-character hexademical string, got \"%@\"", apiKey);
    }

    [self willChangeValueForKey:NSStringFromSelector(@selector(apiKey))];
    _apiKey = apiKey;
    [self didChangeValueForKey:NSStringFromSelector(@selector(apiKey))];
}

- (void)addPlugin:(id<BugsnagPlugin> _Nonnull)plugin {
    [_plugins addObject:plugin];
}

// MARK: - <MetadataStore>

- (void)addMetadata:(NSDictionary *_Nonnull)metadata
          toSection:(NSString *_Nonnull)sectionName
{
    [self.metadata addMetadata:metadata toSection:sectionName];
}

- (void)addMetadata:(id _Nullable)metadata
            withKey:(NSString *_Nonnull)key
          toSection:(NSString *_Nonnull)sectionName
{
    [self.metadata addMetadata:metadata withKey:key toSection:sectionName];
}

- (id _Nullable)getMetadataFromSection:(NSString *_Nonnull)sectionName
                               withKey:(NSString *_Nonnull)key
{
    return [self.metadata getMetadataFromSection:sectionName withKey:key];
}

- (NSDictionary *_Nullable)getMetadataFromSection:(NSString *_Nonnull)sectionName
{
    return [self.metadata getMetadataFromSection:sectionName];
}

- (void)clearMetadataFromSection:(NSString *_Nonnull)sectionName
{
    [self.metadata clearMetadataFromSection:sectionName];
}

- (void)clearMetadataFromSection:(NSString *_Nonnull)sectionName
                       withKey:(NSString *_Nonnull)key
{
    [self.metadata clearMetadataFromSection:sectionName withKey:key];
}

@end
