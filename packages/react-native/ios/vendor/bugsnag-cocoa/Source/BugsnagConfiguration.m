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

#import "BugsnagConfiguration.h"
#import "Bugsnag.h"
#import "BugsnagClient.h"
#import "BugsnagKeys.h"
#import "BSG_RFC3339DateTool.h"
#import "BugsnagUser.h"
#import "BugsnagSessionTracker.h"
#import "BugsnagLogger.h"
#import "BSG_SSKeychain.h"

static NSString *const kHeaderApiPayloadVersion = @"Bugsnag-Payload-Version";
static NSString *const kHeaderApiKey = @"Bugsnag-Api-Key";
static NSString *const kHeaderApiSentAt = @"Bugsnag-Sent-At";
static NSString *const BSGApiKeyError = @"apiKey must be a 32-digit hexadecimal value.";
static NSString *const BSGInitError = @"Init is unavailable.  Use [[BugsnagConfiguration alloc] initWithApiKey:] instead.";
static const int BSGApiKeyLength = 32;
NSString * const BSGConfigurationErrorDomain = @"com.Bugsnag.CocoaNotifier.Configuration";

// User info persistence keys
NSString * const kBugsnagUserKeychainAccount = @"BugsnagUserKeychainAccount";
NSString * const kBugsnagUserEmailAddress = @"BugsnagUserEmailAddress";
NSString * const kBugsnagUserName = @"BugsnagUserName";
NSString * const kBugsnagUserUserId = @"BugsnagUserUserId";

@interface Bugsnag ()
+ (BugsnagClient *)client;
@end

@interface BugsnagClient ()
@property BugsnagSessionTracker *sessionTracker;
@end

@interface BugsnagConfiguration ()
@property(nonatomic, readwrite, strong) NSMutableArray *onSendBlocks;
@property(nonatomic, readwrite, strong) NSMutableArray *onSessionBlocks;
@property(nonatomic, readwrite, strong) NSMutableSet *plugins;
@end

@implementation BugsnagConfiguration

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
    NSCharacterSet *chars = [[NSCharacterSet
        characterSetWithCharactersInString:@"0123456789ABCDEF"] invertedSet];
    BOOL isHex = (NSNotFound == [[apiKey uppercaseString] rangeOfCharacterFromSet:chars].location);
    return isHex && [apiKey length] == BSGApiKeyLength;
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
-(instancetype)initWithApiKey:(NSString *)apiKey
                        error:(NSError * _Nullable __autoreleasing * _Nullable)error
{
    if (! [BugsnagConfiguration isValidApiKey:apiKey]) {
        *error = [NSError errorWithDomain:BSGConfigurationErrorDomain
                                     code:BSGConfigurationErrorInvalidApiKey
                                 userInfo:@{NSLocalizedDescriptionKey : @"Invalid API key.  Should be a 32-digit hex string."}];
        
        return nil;
    }
    
    self = [super init];
    
    _metadata = [[BugsnagMetadata alloc] init];
    _config = [[BugsnagMetadata alloc] init];
    _apiKey = apiKey;
    _sessionURL = [NSURL URLWithString:@"https://sessions.bugsnag.com"];
    _autoDetectErrors = YES;
    _notifyURL = [NSURL URLWithString:BSGDefaultNotifyUrl];
    _onSendBlocks = [NSMutableArray new];
    _onSessionBlocks = [NSMutableArray new];
    _plugins = [NSMutableSet new];
    _notifyReleaseStages = nil;
    _breadcrumbs = [BugsnagBreadcrumbs new];
    _autoTrackSessions = YES;
    // Default to recording all error types
    _enabledErrorTypes = BSGErrorTypesCPP
                       | BSGErrorTypesMach
                       | BSGErrorTypesSignals
                       | BSGErrorTypesNSExceptions;

    // Enabling OOM detection only happens in release builds, to avoid triggering
    // the heuristic when killing/restarting an app in Xcode or similar.
    _persistUser = YES;
    // Only gets persisted user data if there is any, otherwise nil
    // persistUser isn't settable until post-init.
    _currentUser = [self getPersistedUserData];
    [self setUserMetadataFromUser:_currentUser];
    
    #if !DEBUG
        _enabledErrorTypes |= BSGErrorTypesOOMs;
    #endif

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
    
    return self;
}

// -----------------------------------------------------------------------------
// MARK: - Instance Methods
// -----------------------------------------------------------------------------

- (BOOL)shouldSendReports {
    return self.notifyReleaseStages.count == 0 ||
           [self.notifyReleaseStages containsObject:self.releaseStage];
}

- (void)setUser:(NSString *)userId
       withName:(NSString *)userName
       andEmail:(NSString *)userEmail
{
    self.currentUser = [[BugsnagUser alloc] initWithUserId:userId name:userName emailAddress:userEmail];

    // Persist the user
    if (_persistUser)
        [self persistUserData];
    
    // Add user info to the metadata
    [self setUserMetadataFromUser:self.currentUser];
}

/**
 * Add user data to the Configuration metadata
 *
 * @param user A BugsnagUser object containing data to be added to the configuration metadata.
 */
- (void)setUserMetadataFromUser:(BugsnagUser *)user {
    [self.metadata addAttribute:BSGKeyId    withValue:user.userId    toTabWithName:BSGKeyUser];
    [self.metadata addAttribute:BSGKeyName  withValue:user.name  toTabWithName:BSGKeyUser];
    [self.metadata addAttribute:BSGKeyEmail withValue:user.emailAddress toTabWithName:BSGKeyUser];
}

- (void)addOnSendBlock:(BugsnagOnSendBlock)block {
    [(NSMutableArray *)self.onSendBlocks addObject:[block copy]];
}

- (void)addOnSessionBlock:(BugsnagOnSessionBlock)block {
    [(NSMutableArray *)self.onSessionBlocks addObject:[block copy]];
}

- (void)removeOnSessionBlock:(BugsnagOnSessionBlock)block {
    [(NSMutableArray *)self.onSessionBlocks removeObject:block];
}

- (void)clearOnSendBlocks {
    [(NSMutableArray *)self.onSendBlocks removeAllObjects];
}

- (NSDictionary *)errorApiHeaders {
    return @{
             kHeaderApiPayloadVersion: @"4.0",
             kHeaderApiKey: self.apiKey,
             kHeaderApiSentAt: [BSG_RFC3339DateTool stringFromDate:[NSDate new]]
    };
}

- (NSDictionary *)sessionApiHeaders {
    return @{
             kHeaderApiPayloadVersion: @"1.0",
             kHeaderApiKey: self.apiKey,
             kHeaderApiSentAt: [BSG_RFC3339DateTool stringFromDate:[NSDate new]]
             };
}

- (void)setEndpointsForNotify:(NSString *_Nonnull)notify sessions:(NSString *_Nonnull)sessions {
    _notifyURL = [NSURL URLWithString:notify];
    _sessionURL = [NSURL URLWithString:sessions];

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
        NSString *email = [BSG_SSKeychain passwordForService:kBugsnagUserEmailAddress account:kBugsnagUserKeychainAccount];
        NSString *name = [BSG_SSKeychain passwordForService:kBugsnagUserName account:kBugsnagUserKeychainAccount];
        NSString *userId = [BSG_SSKeychain passwordForService:kBugsnagUserUserId account:kBugsnagUserKeychainAccount];

        if (email || name || userId)
            return [[BugsnagUser alloc] initWithUserId:userId name:name emailAddress:email];
        
        return nil;
    }
}

/**
 * Store user data in a secure location (i.e. the keychain) that persists between application runs
 * 'storing' nil values deletes them.
 */
- (void)persistUserData {
    @synchronized(self) {
        if (_currentUser) {
            // Email
            if (_currentUser.emailAddress) {
                [BSG_SSKeychain setPassword:_currentUser.emailAddress
                             forService:kBugsnagUserEmailAddress
                                account:kBugsnagUserKeychainAccount];
            }
            else {
                [BSG_SSKeychain deletePasswordForService:kBugsnagUserEmailAddress
                                             account:kBugsnagUserKeychainAccount];
            }

            // Name
            if (_currentUser.name) {
                [BSG_SSKeychain setPassword:_currentUser.name
                             forService:kBugsnagUserName
                                account:kBugsnagUserKeychainAccount];
            }
            else {
                [BSG_SSKeychain deletePasswordForService:kBugsnagUserName
                                             account:kBugsnagUserKeychainAccount];
            }
            
            // UserId
            if (_currentUser.userId) {
                [BSG_SSKeychain setPassword:_currentUser.userId
                             forService:kBugsnagUserUserId
                                account:kBugsnagUserKeychainAccount];
            }
            else {
                [BSG_SSKeychain deletePasswordForService:kBugsnagUserUserId
                                             account:kBugsnagUserKeychainAccount];
            }
        }
    }
}

/**
 * Delete any persisted user data
 */
-(void)deletePersistedUserData {
    @synchronized(self) {
        [BSG_SSKeychain deletePasswordForService:kBugsnagUserEmailAddress account:kBugsnagUserKeychainAccount];
        [BSG_SSKeychain deletePasswordForService:kBugsnagUserName account:kBugsnagUserKeychainAccount];
        [BSG_SSKeychain deletePasswordForService:kBugsnagUserUserId account:kBugsnagUserKeychainAccount];
    }
}

// -----------------------------------------------------------------------------
// MARK: - Properties: Getters and Setters
// -----------------------------------------------------------------------------

- (NSUInteger)maxBreadcrumbs {
    return self.breadcrumbs.capacity;
}

- (void)setMaxBreadcrumbs:(NSUInteger)capacity {
    self.breadcrumbs.capacity = capacity;
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
        [self.config addAttribute:BSGKeyReleaseStage
                        withValue:newReleaseStage
                    toTabWithName:BSGKeyConfig];
    }
}

// MARK: -

@synthesize autoDetectErrors = _autoDetectErrors;

- (BOOL)autoDetectErrors {
    return _autoDetectErrors;
}

- (void)setAutoDetectErrors:(BOOL)autoDetectErrors {
    if (autoDetectErrors == _autoDetectErrors) {
        return;
    }
    [self willChangeValueForKey:NSStringFromSelector(@selector(autoDetectErrors))];
    _autoDetectErrors = autoDetectErrors;
    [[Bugsnag client] updateCrashDetectionSettings];
    [self didChangeValueForKey:NSStringFromSelector(@selector(autoDetectErrors))];
}

- (BOOL)autoNotify {
    return self.autoDetectErrors;
}

- (void)setAutoNotify:(BOOL)autoNotify {
    self.autoDetectErrors = autoNotify;
}

// MARK: -

@synthesize notifyReleaseStages = _notifyReleaseStages;

- (NSArray *)notifyReleaseStages {
    @synchronized (self) {
        return _notifyReleaseStages;
    }
}

- (void)setNotifyReleaseStages:(NSArray *)newNotifyReleaseStages;
{
    @synchronized (self) {
        NSArray *notifyReleaseStagesCopy = [newNotifyReleaseStages copy];
        _notifyReleaseStages = notifyReleaseStagesCopy;
        [self.config addAttribute:BSGKeyNotifyReleaseStages
                        withValue:notifyReleaseStagesCopy
                    toTabWithName:BSGKeyConfig];
    }
}

// MARK: -

- (void)setShouldAutoCaptureSessions:(BOOL)shouldAutoCaptureSessions {
    self.autoTrackSessions = shouldAutoCaptureSessions;
}

- (BOOL)shouldAutoCaptureSessions {
    return self.autoTrackSessions;
}

// MARK: -

- (BSGEnabledBreadcrumbType)enabledBreadcrumbTypes {
    return self.breadcrumbs.enabledBreadcrumbTypes;
}

- (void)setEnabledBreadcrumbTypes:(BSGEnabledBreadcrumbType)enabledBreadcrumbTypes {
    self.breadcrumbs.enabledBreadcrumbTypes = enabledBreadcrumbTypes;
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
        [self.config addAttribute:BSGKeyContext
                        withValue:newContext
                    toTabWithName:BSGKeyConfig];
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
        [self.config addAttribute:BSGKeyAppVersion
                        withValue:newVersion
                    toTabWithName:BSGKeyConfig];
    }
}

// MARK: -

@synthesize apiKey = _apiKey;

- (NSString *)apiKey {
    return _apiKey;
}

- (void)setApiKey:(NSString *)apiKey {
    if ([BugsnagConfiguration isValidApiKey:apiKey]) {
        [self willChangeValueForKey:NSStringFromSelector(@selector(apiKey))];
        _apiKey = apiKey;
        [self didChangeValueForKey:NSStringFromSelector(@selector(apiKey))];
    } else {
        @throw BSGApiKeyError;
    }
}

- (void)addPlugin:(id<BugsnagPlugin> _Nonnull)plugin {
    [_plugins addObject:plugin];
}

@end
