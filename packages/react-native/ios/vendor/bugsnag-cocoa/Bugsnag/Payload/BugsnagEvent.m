//
//  BugsnagEvent.m
//  Bugsnag
//
//  Created by Simon Maynard on 11/26/14.
//
//

#import "BugsnagPlatformConditional.h"

#import "BugsnagEvent+Private.h"

#if BSG_PLATFORM_IOS
#import "BSGUIKit.h"
#include <sys/utsname.h>
#endif

#import <Foundation/Foundation.h>

#import "BSGSerialization.h"
#import "BSG_KSCrashReportFields.h"
#import "BSG_RFC3339DateTool.h"
#import "Bugsnag+Private.h"
#import "BugsnagApp+Private.h"
#import "BugsnagAppWithState+Private.h"
#import "BugsnagBreadcrumb+Private.h"
#import "BugsnagBreadcrumbs.h"
#import "BugsnagCollections.h"
#import "BugsnagConfiguration+Private.h"
#import "BugsnagDeviceWithState+Private.h"
#import "BugsnagError+Private.h"
#import "BugsnagHandledState.h"
#import "BugsnagKeys.h"
#import "BugsnagMetadata+Private.h"
#import "BugsnagLogger.h"
#import "BugsnagSession+Private.h"
#import "BugsnagStacktrace+Private.h"
#import "BugsnagThread+Private.h"
#import "BugsnagUser+Private.h"


static NSString *const DEFAULT_EXCEPTION_TYPE = @"cocoa";

id BSGLoadConfigValue(NSDictionary *report, NSString *valueName) {
    NSString *keypath = [NSString stringWithFormat:@"user.config.%@", valueName];
    NSString *fallbackKeypath = [NSString stringWithFormat:@"user.config.config.%@", valueName];

    return [report valueForKeyPath:keypath]
    ?: [report valueForKeyPath:fallbackKeypath]; // some custom values are nested
}

/**
 * Attempt to find a context (within which the event is being reported)
 * This can be found in user-set metadata of varying specificity or the global
 * configuration.  Returns nil if no context can be found.
 *
 * @param report A dictionary of report data
 * @returns A string context if found, or nil
 */
NSString *BSGParseContext(NSDictionary *report) {
    id context = [report valueForKeyPath:@"user.overrides.context"];
    if ([context isKindOfClass:[NSString class]]) {
        return context;
    }
    context = BSGLoadConfigValue(report, BSGKeyContext);
    if ([context isKindOfClass:[NSString class]]) {
        return context;
    }
    return nil;
}

NSString *BSGParseGroupingHash(NSDictionary *report) {
    id groupingHash = [report valueForKeyPath:@"user.overrides.groupingHash"];
    if (groupingHash)
        return groupingHash;
    return nil;
}

/** 
 * Find the breadcrumb cache for the event within the report object.
 *
 * By default, crumbs are present in the `user.state.crash` object, which is
 * the location of user data within crash and notify reports. However, this
 * location can be overridden in the case that a callback modifies breadcrumbs
 * or that breadcrumbs are persisted separately (such as in an out-of-memory
 * event).
 */
NSArray <BugsnagBreadcrumb *> *BSGParseBreadcrumbs(NSDictionary *report) {
    // default to overwritten breadcrumbs from callback
    NSArray *cache = [report valueForKeyPath:@"user.overrides.breadcrumbs"]
        // then cached breadcrumbs from an OOM event
        ?: [report valueForKeyPath:@"user.state.oom.breadcrumbs"]
        // then cached breadcrumbs from a regular event
        // KSCrashReports from earlier versions of the notifier used this
        ?: [report valueForKeyPath:@"user.state.crash.breadcrumbs"]
        // breadcrumbs added to a KSCrashReport by BSSerializeDataCrashHandler
        ?: [report valueForKeyPath:@"user.breadcrumbs"];
    NSMutableArray *breadcrumbs = [NSMutableArray arrayWithCapacity:cache.count];
    for (NSDictionary *data in cache) {
        if (![data isKindOfClass:[NSDictionary class]]) {
            continue;
        }
        BugsnagBreadcrumb *crumb = [BugsnagBreadcrumb breadcrumbFromDict:data];
        if (crumb) {
            [breadcrumbs addObject:crumb];
        }
    }
    return breadcrumbs;
}

NSString *BSGParseReleaseStage(NSDictionary *report) {
    return [report valueForKeyPath:@"user.overrides.releaseStage"]
               ?: BSGLoadConfigValue(report, @"releaseStage");
}

NSDictionary *BSGParseCustomException(NSDictionary *report,
                                      NSString *errorClass, NSString *message) {
    id frames =
        [report valueForKeyPath:@"user.overrides.customStacktraceFrames"];
    id type = [report valueForKeyPath:@"user.overrides.customStacktraceType"];
    if (type && frames) {
        return @{
            BSGKeyStacktrace : frames,
            BSGKeyType : type,
            BSGKeyErrorClass : errorClass,
            BSGKeyMessage : message
        };
    }

    return nil;
}

// MARK: - BugsnagEvent implementation

@interface NSDictionary (BSGKSMerge)
- (NSDictionary *)BSG_mergedInto:(NSDictionary *)dest;
@end


@implementation BugsnagEvent

/**
 * Constructs a new instance of BugsnagEvent. This is the preferred constructor
 * and initialises all the mandatory fields. All internal constructors should
 * chain this constructor to ensure a consistent state. This constructor should
 * only assign parameters to fields, and should avoid any complex business logic.
 *
 * @param app the state of the app at the time of the error
 * @param device the state of the app at the time of the error
 * @param handledState whether the error was handled/unhandled, plus additional severity info
 * @param user the user at the time of the error
 * @param metadata the metadata at the time of the error
 * @param breadcrumbs the breadcrumbs at the time of the error
 * @param errors an array of errors representing a causal relationship
 * @param threads the threads at the time of the error, or empty if none
 * @param session the active session or nil if
 * @return a new instance of BugsnagEvent.
 */
- (instancetype)initWithApp:(BugsnagAppWithState *)app
                     device:(BugsnagDeviceWithState *)device
               handledState:(BugsnagHandledState *)handledState
                       user:(BugsnagUser *)user
                   metadata:(BugsnagMetadata *)metadata
                breadcrumbs:(NSArray<BugsnagBreadcrumb *> *)breadcrumbs
                     errors:(NSArray<BugsnagError *> *)errors
                    threads:(NSArray<BugsnagThread *> *)threads
                    session:(BugsnagSession *)session {
    if (self = [super init]) {
        _app = app;
        _device = device;
        _handledState = handledState;
        // _user is nonnull but this method is not public so _Nonnull is unenforcable,  Guard explicitly.
        if (user != nil) {
            _user = user;
        }
        _metadata = metadata;
        _breadcrumbs = breadcrumbs;
        _errors = errors;
        _threads = threads;
        _session = session;
    }
    return self;
}

/**
 * Creates a BugsnagEvent from a JSON crash report generated by KSCrash. A KSCrash
 * report can come in 3 variants, which needs to be deserialized separately:
 *
 * 1. An unhandled error which immediately terminated the process
 * 2. A handled error which did not terminate the process
 * 3. An OOM, which has more limited information than the previous two errors
 *
 *  @param event a KSCrash report
 *
 *  @return a BugsnagEvent containing the parsed information
 */
- (instancetype)initWithKSReport:(NSDictionary *)event {
    if (event.count == 0) {
        return nil; // report is empty
    }
    if ([[event valueForKeyPath:@"user.state.didOOM"] boolValue]) {
        return [self initWithOOMData:event];
    } else if ([event valueForKeyPath:@"user.event"] != nil) {
        return [self initWithUserData:event];
    } else {
        return [self initWithKSCrashData:event];
    }
}

/**
 * Creates a BugsnagEvent from OutOfMemory JSON. OOMs contain less information
 * than a regular crash report - notably they have no stacktrace or thread information.
 *
 * @param event a KSCrash report
 *
 * @return a BugsnagEvent containing the parsed information
 */
- (instancetype)initWithOOMData:(NSDictionary *)event {
    NSDictionary *sessionData = [event valueForKeyPath:@"user.state.oom.session"];
    BugsnagSession *session;
    BugsnagUser *user;
    if (sessionData) {
        session = [[BugsnagSession alloc] initWithDictionary:sessionData];
        session.unhandledCount += 1; // include own event
        if (session.user) {
            user = session.user;
        }
    }
    
    NSDictionary *metaData = [event valueForKeyPath:@"user.metaData"];
    if (!metaData) {
        bsg_log_err(@"user.metaData was missing from the OOM KSCrashReport");
    }
    BugsnagMetadata *metadata = [[BugsnagMetadata alloc] initWithDictionary:metaData ?: @{}];
    // Cocoa-specific, non-spec., device and app data
    [metadata addMetadata:BSGParseDeviceMetadata(event) toSection:BSGKeyDevice];
    [metadata addMetadata:BSGParseAppMetadata(event) toSection:BSGKeyApp];

    BugsnagAppWithState *app = [BugsnagAppWithState appWithKSCrashReportOOM:event];
    BugsnagDeviceWithState *device = [BugsnagDeviceWithState deviceWithOomData:[event valueForKeyPath:@"user.state.oom.device"]];
    
    if (!user) {
        NSString *deviceAppHash = [event valueForKeyPath:@"system.device_app_hash"];
        user = [self parseUser:event deviceAppHash:deviceAppHash deviceId:device.id];
    }
    
    BugsnagEvent *obj = [self initWithApp:app
                                   device:device
                             handledState:[BugsnagHandledState handledStateWithSeverityReason:LikelyOutOfMemory]
                                     user:user
                                 metadata:metadata
                              breadcrumbs:BSGParseBreadcrumbs(event)
                                   errors:@[[[BugsnagError alloc] initWithEvent:event errorReportingThread:nil]]
                                  threads:@[]
                                  session:session];
    obj.releaseStage = [event valueForKeyPath:@"user.state.oom.app.releaseStage"];
    obj.deviceAppHash = [event valueForKeyPath:@"user.state.oom.device.id"];
    return obj;
}

/**
 * Creates a BugsnagEvent from unhandled error JSON. Unhandled errors use
 * the JSON schema supplied by the KSCrash report rather than the Bugsnag
 * Error API schema, which is more complex to parse.
 *
 * @param event a KSCrash report
 *
 * @return a BugsnagEvent containing the parsed information
 */
- (instancetype)initWithKSCrashData:(NSDictionary *)event {
    NSMutableDictionary *error = [[event valueForKeyPath:@"crash.error"] mutableCopy];
    NSString *errorType = error[BSGKeyType];

    // Always assume that a report coming from KSCrash is by default an unhandled error.
    BOOL isUnhandled = YES;
    BOOL isUnhandledOverridden = NO;
    BOOL hasBecomeHandled = [event valueForKeyPath:@"user.unhandled"] != nil &&
            [[event valueForKeyPath:@"user.unhandled"] boolValue] == false;
    if (hasBecomeHandled) {
        const int handledCountAdjust = 1;
        isUnhandled = NO;
        isUnhandledOverridden = YES;
        NSMutableDictionary *user = [event[BSGKeyUser] mutableCopy];
        user[@"unhandled"] = @(isUnhandled);
        user[@"unhandledOverridden"] = @(isUnhandledOverridden);
        user[@"unhandledCount"] = @([user[@"unhandledCount"] intValue] - handledCountAdjust);
        user[@"handledCount"] = @([user[@"handledCount"] intValue] + handledCountAdjust);
        NSMutableDictionary *eventCopy = [event mutableCopy];
        eventCopy[BSGKeyUser] = user;
        event = eventCopy;
    }

    id userMetadata = [event valueForKeyPath:@"user.metaData"];
    BugsnagMetadata *metadata;

    if ([userMetadata isKindOfClass:[NSDictionary class]]) {
        metadata = [[BugsnagMetadata alloc] initWithDictionary:userMetadata];
    } else {
        metadata = [BugsnagMetadata new];
    }

    // Cocoa-specific, non-spec., device and app data
    [metadata addMetadata:BSGParseDeviceMetadata(event) toSection:BSGKeyDevice];
    [metadata addMetadata:BSGParseAppMetadata(event) toSection:BSGKeyApp];

    NSDictionary *recordedState = [event valueForKeyPath:@"user.handledState"];

    NSUInteger depth;
    if (recordedState) { // only makes sense to use serialised value for handled exceptions
        depth = [[event valueForKeyPath:@"user.depth"] unsignedIntegerValue];
    } else {
        depth = 0;
    }
    BugsnagSession *session;
    if (event[BSGKeyUser][@"id"]) {
         session = [[BugsnagSession alloc] initWithDictionary:event[BSGKeyUser]];
    }

    // generate threads/error info
    NSArray *binaryImages = event[@"binary_images"];
    NSArray *threadDict = [event valueForKeyPath:@"crash.threads"];
    NSMutableArray<BugsnagThread *> *threads = [BugsnagThread threadsFromArray:threadDict
                                                                  binaryImages:binaryImages
                                                                         depth:depth
                                                                     errorType:errorType];

    BugsnagThread *errorReportingThread;
    for (BugsnagThread *thread in threads) {
        if (thread.errorReportingThread) {
            errorReportingThread = thread;
            break;
        }
    }

    NSArray<BugsnagError *> *errors = @[[[BugsnagError alloc] initWithEvent:event errorReportingThread:errorReportingThread]];

    if (errorReportingThread.crashInfoMessage) {
        [errors[0] updateWithCrashInfoMessage:errorReportingThread.crashInfoMessage];
        error[@"crashInfo"] = errorReportingThread.crashInfoMessage;
    }
    
    BugsnagHandledState *handledState;
    if (recordedState) {
        handledState = [[BugsnagHandledState alloc] initWithDictionary:recordedState];
    } else { // the event was (probably) unhandled.
        BOOL isSignal = [BSGKeySignal isEqualToString:errorType];
        SeverityReasonType severityReason = isSignal ? Signal : UnhandledException;
        handledState = [BugsnagHandledState
                handledStateWithSeverityReason:severityReason
                                      severity:BSGSeverityError
                                     attrValue:errors[0].errorClass];
        handledState.unhandled = isUnhandled;
        handledState.unhandledOverridden = isUnhandledOverridden;
    }

    NSMutableDictionary *userAtCrash = [self parseOnCrashData:event];
    if (userAtCrash != nil) {
        for (NSString *section in [userAtCrash allKeys]) {
            [metadata addMetadata:userAtCrash[section] toSection:section];
        }
    }
    NSString *deviceAppHash = [event valueForKeyPath:@"system.device_app_hash"];
    BugsnagDeviceWithState *device = [BugsnagDeviceWithState deviceWithKSCrashReport:event];
    BugsnagUser *user = [self parseUser:event deviceAppHash:deviceAppHash deviceId:device.id];
    BugsnagConfiguration *config = [[BugsnagConfiguration alloc] initWithDictionaryRepresentation:[event valueForKeyPath:@"user.config"]];
    BugsnagAppWithState *app = [BugsnagAppWithState appWithDictionary:event config:config codeBundleId:self.codeBundleId];
    BugsnagEvent *obj = [self initWithApp:app
                                   device:device
                             handledState:handledState
                                     user:user
                                 metadata:metadata
                              breadcrumbs:BSGParseBreadcrumbs(event)
                                   errors:errors
                                  threads:threads
                                  session:session];
    obj.context = BSGParseContext(event);
    obj.groupingHash = BSGParseGroupingHash(event);
    obj.overrides = [event valueForKeyPath:@"user.overrides"];
    obj.enabledReleaseStages = BSGLoadConfigValue(event, BSGKeyEnabledReleaseStages);
    obj.releaseStage = BSGParseReleaseStage(event);
    obj.deviceAppHash = deviceAppHash;
    obj.customException = BSGParseCustomException(event, [errors[0].errorClass copy], [errors[0].errorMessage copy]);
    obj.error = error;
    obj.depth = depth;
    return obj;
}

/**
 * Creates a BugsnagEvent from handled error JSON. Handled errors use
 * the Bugsnag Error API JSON schema, with the exception that they are
 * wrapped in a KSCrash JSON object.
 *
 * @param event a KSCrash report
 *
 * @return a BugsnagEvent containing the parsed information
 */
- (instancetype)initWithUserData:(NSDictionary *)event {
    NSDictionary *bugsnagPayload = [event valueForKeyPath:@"user.event"];
    // deserialize exceptions
    NSArray *errorDicts = bugsnagPayload[BSGKeyExceptions];
    NSMutableArray<BugsnagError *> *errors = [NSMutableArray new];

    if (errorDicts != nil) {
        for (NSDictionary *dict in errorDicts) {
            BugsnagError *error = [BugsnagError errorFromJson:dict];

            if (error != nil) {
                [errors addObject:error];
            }
        }
    }

    // deserialize threads
    NSArray *threadDicts = bugsnagPayload[BSGKeyThreads];
    NSMutableArray *threads = [NSMutableArray new];

    if (threadDicts != nil) {
        for (NSDictionary *dict in threadDicts) {
            BugsnagThread *thread = [BugsnagThread threadFromJson:dict];

            if (thread != nil) {
                [threads addObject:thread];
            }
        }
    }
    BugsnagSession *session = [BugsnagSession fromJson:bugsnagPayload[BSGKeySession]];

    BugsnagEvent *obj = [self initWithApp:[BugsnagAppWithState appFromJson:bugsnagPayload[BSGKeyApp]]
                      device:[BugsnagDeviceWithState deviceFromJson:bugsnagPayload[BSGKeyDevice]]
                handledState:[BugsnagHandledState handledStateFromJson:bugsnagPayload]
                        user:[[BugsnagUser alloc] initWithDictionary:bugsnagPayload[BSGKeyUser]]
                    metadata:[[BugsnagMetadata alloc] initWithDictionary:bugsnagPayload[BSGKeyMetadata]]
                 breadcrumbs:[BugsnagBreadcrumb breadcrumbArrayFromJson:bugsnagPayload[BSGKeyBreadcrumbs]]
                      errors:errors
                     threads:threads
                     session:session];
    obj.apiKey = bugsnagPayload[BSGKeyApiKey];
    obj.context = bugsnagPayload[BSGKeyContext];
    obj.groupingHash = bugsnagPayload[BSGKeyGroupingHash];
    obj.error = [self getMetadataFromSection:BSGKeyError];

    if ([errors count] > 0) {
        BugsnagError *err = errors[0];
        obj.customException = BSGParseCustomException(event, err.errorClass, err.errorMessage);
    }
    return obj;
}

- (NSMutableDictionary *)parseOnCrashData:(NSDictionary *)report {
    NSMutableDictionary *userAtCrash = [report[BSGKeyUser] mutableCopy];
    // avoid adding internal information to user-defined metadata
    NSArray *keysToRemove = @[
            @BSG_KSCrashField_Overrides,
            @BSG_KSCrashField_HandledState,
            @BSG_KSCrashField_Metadata,
            @BSG_KSCrashField_State,
            @BSG_KSCrashField_Config,
            @BSG_KSCrashField_DiscardDepth,
            @"breadcrumbs",
            @"startedAt",
            @"unhandledCount",
            @"handledCount",
            @"id",
    ];
    [userAtCrash removeObjectsForKeys:keysToRemove];

    for (NSString *key in [userAtCrash allKeys]) { // remove any non-dictionary values
        if (![userAtCrash[key] isKindOfClass:[NSDictionary class]]) {
            bsg_log_warn(@"Removing value added in onCrashHandler for key %@ as it is not a dictionary value", key);
            [userAtCrash removeObjectForKey:key];
        }
    }
    return userAtCrash;
}

// MARK: - apiKey

@synthesize apiKey = _apiKey;

- (NSString *)apiKey {
    return _apiKey;
}

- (void)setApiKey:(NSString *)apiKey {
    if ([BugsnagConfiguration isValidApiKey:apiKey]) {
        _apiKey = apiKey;
    }

    // A malformed apiKey should not cause an error: the fallback global value
    // in BugsnagConfiguration will do to get the event reported.
    else {
        bsg_log_warn(@"Attempted to set an invalid Event API key.");
    }
}

- (BOOL)shouldBeSent {
    return [self.enabledReleaseStages containsObject:self.releaseStage] ||
           (self.enabledReleaseStages.count == 0);
}

- (NSArray *)serializeBreadcrumbs {
    return [[self breadcrumbs] valueForKeyPath:NSStringFromSelector(@selector(objectValue))];
}

@synthesize releaseStage = _releaseStage;

- (NSString *)releaseStage {
    @synchronized (self) {
        return _releaseStage;
    }
}

- (void)setReleaseStage:(NSString *)releaseStage {
    [self setOverrideProperty:BSGKeyReleaseStage value:releaseStage];
    @synchronized (self) {
        _releaseStage = releaseStage;
    }
}

- (void)attachCustomStacktrace:(NSArray *)frames withType:(NSString *)type {
    [self setOverrideProperty:@"customStacktraceFrames" value:frames];
    [self setOverrideProperty:@"customStacktraceType" value:type];
}

- (BSGSeverity)severity {
    @synchronized (self) {
        return _handledState.currentSeverity;
    }
}

- (void)setSeverity:(BSGSeverity)severity {
    @synchronized (self) {
        _handledState.currentSeverity = severity;
    }
}

// =============================================================================
// MARK: - User
// =============================================================================

/**
 * The current user
 */
@synthesize user = _user;
- (BugsnagUser *_Nonnull)user {
    return _user;
}

/**
 *  Set user metadata
 *
 *  @param userId ID of the user
 *  @param name   Name of the user
 *  @param email  Email address of the user
 */
- (void)setUser:(NSString *_Nullable)userId
      withEmail:(NSString *_Nullable)email
        andName:(NSString *_Nullable)name {
    self.user = [[BugsnagUser alloc] initWithUserId:userId name:name emailAddress:email];
}

/**
 * Read the user from a persisted KSCrash report
 * @param event the KSCrash report
 * @return the user, or nil if not available
 */
- (BugsnagUser *)parseUser:(NSDictionary *)event
             deviceAppHash:(NSString *)deviceAppHash
                  deviceId:(NSString *)deviceId {
    NSMutableDictionary *user = [[event valueForKeyPath:@"user.state"][BSGKeyUser] mutableCopy];
    
    if (user == nil) { // fallback to legacy location
        user = [[event valueForKeyPath:@"user.metaData"][BSGKeyUser] mutableCopy];
    }
    if (user == nil) { // fallback to empty dict
        user = [NSMutableDictionary new];
    }

    if (!user[BSGKeyId] && deviceId) { // if device id is null, don't set user id to default
        user[BSGKeyId] = deviceAppHash;
    }
    return [[BugsnagUser alloc] initWithDictionary:user];
}

// MARK: - Callback overrides

@synthesize overrides = _overrides;

- (NSDictionary *)overrides {
    NSMutableDictionary *values = [_overrides mutableCopy] ?: [NSMutableDictionary new];
    values[BSGKeyBreadcrumbs] = [self serializeBreadcrumbs];
    return values;
}

- (void)setOverrides:(NSDictionary * _Nonnull)overrides {
    _overrides = overrides;
}

- (void)setOverrideProperty:(NSString *)key value:(id)value {
    @synchronized (self) {
        NSMutableDictionary *metadata = [self.overrides mutableCopy];
        if (value) {
            metadata[key] = value;
        } else {
            [metadata removeObjectForKey:key];
        }
        self.overrides = metadata;
    }
}

- (void)notifyUnhandledOverridden {
    self.handledState.unhandledOverridden = YES;
}

- (NSDictionary *)toJson {
    NSMutableDictionary *event = [NSMutableDictionary dictionary];

    event[BSGKeyExceptions] = ({
        NSMutableArray *array = [NSMutableArray array];
        [self.errors enumerateObjectsUsingBlock:^(BugsnagError *error, NSUInteger idx, BOOL *stop) {
            if (self.customException != nil && idx == 0) {
                [array addObject:self.customException];
            } else {
                [array addObject:[error toDictionary]];
            }
        }];
        [NSArray arrayWithArray:array];
    });
    
    event[BSGKeyThreads] = [BugsnagThread serializeThreads:self.threads];

    // Build Event
    event[BSGKeySeverity] = BSGFormatSeverity(self.severity);
    event[BSGKeyBreadcrumbs] = [self serializeBreadcrumbs];

    // add metadata
    NSMutableDictionary *metadata = [[[self metadata] toDictionary] mutableCopy];
    event[BSGKeyMetadata] = [self sanitiseMetadata:metadata];

    event[BSGKeyDevice] = [self.device toDictionary];
    event[BSGKeyApp] = [self.app toDict];

    event[BSGKeyContext] = [self context];
    event[BSGKeyGroupingHash] = self.groupingHash;

    event[BSGKeyUnhandled] = @(self.handledState.unhandled);

    // serialize handled/unhandled into payload
    NSMutableDictionary *severityReason = [NSMutableDictionary new];
    if (self.handledState.unhandledOverridden) {
        severityReason[BSGKeyUnhandledOverridden] = @(self.handledState.unhandledOverridden);
    }
    NSString *reasonType = [BugsnagHandledState
        stringFromSeverityReason:self.handledState.calculateSeverityReasonType];
    severityReason[BSGKeyType] = reasonType;

    if (self.handledState.attrKey && self.handledState.attrValue) {
        severityReason[BSGKeyAttributes] =
            @{self.handledState.attrKey : self.handledState.attrValue};
    }

    event[BSGKeySeverityReason] = severityReason;

    //  Inserted into `context` property
    [metadata removeObjectForKey:BSGKeyContext];
    // Build metadata
    metadata[BSGKeyError] = self.error;

    // add user
    event[BSGKeyUser] = [self.user toJson];

    if (self.session) {
        event[BSGKeySession] = [self generateSessionDict];
    }
    return event;
}

- (NSMutableDictionary *)sanitiseMetadata:(NSMutableDictionary *)metadata {
    for (NSString *sectionKey in [metadata allKeys]) {
        metadata[sectionKey] = [metadata[sectionKey] mutableCopy];
        NSMutableDictionary *section = metadata[sectionKey];

        if (section != nil) { // redact sensitive metadata values
            for (NSString *objKey in [section allKeys]) {
                section[objKey] = [self sanitiseMetadataValue:section[objKey] key:objKey];
            }
        }
    }
    return metadata;
}

- (id)sanitiseMetadataValue:(id)value key:(NSString *)key {
    if ([self isRedactedKey:key]) {
        return BSGKeyRedaction;
    } else if ([value isKindOfClass:[NSDictionary class]]) {
        NSMutableDictionary *nestedDict = [(NSDictionary *)value mutableCopy];

        for (NSString *nestedKey in [nestedDict allKeys]) {
            nestedDict[nestedKey] = [self sanitiseMetadataValue:nestedDict[nestedKey] key:nestedKey];
        }
        return nestedDict;
    } else {
        return value;
    }
}

- (BOOL)isRedactedKey:(NSString *)key {
    for (id obj in self.redactedKeys) {
        if ([obj isKindOfClass:[NSString class]]) {
            if ([[key lowercaseString] isEqualToString:[obj lowercaseString]]) {
                return true;
            }
        } else if ([obj isKindOfClass:[NSRegularExpression class]]) {
            NSRegularExpression *regex = obj;
            NSRange range = NSMakeRange(0, [key length]);
            if ([[regex matchesInString:key options:0 range:range] count] > 0) {
                return true;
            }
        }
    }
    return false;
}

- (NSDictionary *)generateSessionDict {
    NSDictionary *events = @{
            @"handled": @(self.session.handledCount),
            @"unhandled": @(self.session.unhandledCount)
    };

    NSDictionary *sessionJson = @{
            BSGKeyId: self.session.id,
            @"startedAt": [BSG_RFC3339DateTool stringFromDate:self.session.startedAt],
            @"events": events
    };
    return sessionJson;
}

- (BOOL)unhandled {
    return self.handledState.unhandled;
}

- (void)setUnhandled:(BOOL)unhandled {
    self.handledState.unhandled = unhandled;
}

// MARK: - <BugsnagMetadataStore>

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

- (NSMutableDictionary *_Nullable)getMetadataFromSection:(NSString *_Nonnull)sectionName
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

#pragma mark -

- (NSArray<NSString *> *)stacktraceTypes {
    NSMutableSet *stacktraceTypes = [NSMutableSet set];
    
    // The error in self.errors is not always the error that will be sent; this is the case when used in React Native.
    // Using [self toJson] to ensure this uses the same logic of reading from self.customException instead.
    NSDictionary *json = [self toJson];
    NSArray *exceptions = json[BSGKeyExceptions];
    for (NSDictionary *exception in exceptions) {
        BugsnagError *error = [BugsnagError errorFromJson:exception];
        
        [stacktraceTypes addObject:BSGSerializeErrorType(error.type)];
        
        for (BugsnagStackframe *stackframe in error.stacktrace) {
            if (stackframe.type) {
                [stacktraceTypes addObject:stackframe.type];
            }
        }
    }
    
    for (BugsnagThread *thread in self.threads) {
        [stacktraceTypes addObject:BSGSerializeThreadType(thread.type)];
        for (BugsnagStackframe *stackframe in thread.stacktrace) {
            if (stackframe.type) {
                [stacktraceTypes addObject:stackframe.type];
            }
        }
    }
    
    return stacktraceTypes.allObjects;
}

@end
