//
//  BSGInternalErrorReporter.m
//  Bugsnag
//
//  Created by Nick Dowell on 06/05/2021.
//  Copyright © 2021 Bugsnag Inc. All rights reserved.
//

#import "BSGInternalErrorReporter.h"

#import "BSG_KSCrashReportFields.h"
#import "BSG_KSSystemInfo.h"
#import "BSG_RFC3339DateTool.h"
#import "BugsnagApiClient.h"
#import "BugsnagAppWithState+Private.h"
#import "BugsnagCollections.h"
#import "BugsnagConfiguration+Private.h"
#import "BugsnagDeviceWithState+Private.h"
#import "BugsnagError+Private.h"
#import "BugsnagEvent+Private.h"
#import "BugsnagHandledState.h"
#import "BugsnagKeys.h"
#import "BugsnagLogger.h"
#import "BugsnagMetadata+Private.h"
#import "BugsnagNotifier.h"
#import "BugsnagStackframe+Private.h"
#import "BugsnagUser+Private.h"

static NSString * const EventPayloadVersion = @"4.0";

static NSString * const BugsnagDiagnosticsKey = @"BugsnagDiagnostics";

static BugsnagHTTPHeaderName const BugsnagHTTPHeaderNameInternalError = @"Bugsnag-Internal-Error";


NSString *BSGErrorDescription(NSError *error) {
    return [NSString stringWithFormat:@"%@ %ld: %@", error.domain, (long)error.code,
            error.userInfo[NSDebugDescriptionErrorKey] ?: error.localizedDescription];
}


// MARK: -

@interface BSGInternalErrorReporter ()

@property (weak, nullable, nonatomic) id<BSGInternalErrorReporterDataSource> dataSource;
@property (nonatomic) NSURLSession *session;

@end


@implementation BSGInternalErrorReporter

static BSGInternalErrorReporter *sharedInstance_;
static void (^ startupBlock_)(BSGInternalErrorReporter *);

+ (BSGInternalErrorReporter *)sharedInstance {
    return sharedInstance_;
}

+ (void)setSharedInstance:(BSGInternalErrorReporter *)sharedInstance {
    sharedInstance_ = sharedInstance;
    if (startupBlock_ && sharedInstance_) {
        startupBlock_(sharedInstance_);
        startupBlock_ = nil;
    }
}

+ (void)performBlock:(void (^)(BSGInternalErrorReporter *))block {
    if (sharedInstance_) {
        block(sharedInstance_);
    } else {
        startupBlock_ = [block copy];
    }
}

- (instancetype)initWithDataSource:(id<BSGInternalErrorReporterDataSource>)dataSource {
    if ((self = [super init])) {
        _dataSource = dataSource;
        _session = [NSURLSession sessionWithConfiguration:NSURLSessionConfiguration.ephemeralSessionConfiguration];
    }
    return self;
}

// MARK: Public API

- (void)reportErrorWithClass:(NSString *)errorClass
                     message:(nullable NSString *)message
                 diagnostics:(nullable NSDictionary<NSString *, id> *)diagnostics
                groupingHash:(nullable NSString *)groupingHash {
    @try {
        BugsnagEvent *event = [self eventWithErrorClass:errorClass message:message diagnostics:diagnostics groupingHash:groupingHash];
        if (event) {
            [self sendEvent:event];
        }
    } @catch (NSException *exception) {
        bsg_log_err(@"%@", exception);
    }
}

- (void)reportException:(NSException *)exception
            diagnostics:(nullable NSDictionary<NSString *, id> *)diagnostics
           groupingHash:(nullable NSString *)groupingHash {
    @try {
        BugsnagEvent *event = [self eventWithException:exception diagnostics:diagnostics groupingHash:groupingHash];
        if (event) {
            [self sendEvent:event];
        }
    } @catch (NSException *exception) {
        bsg_log_err(@"%@", exception);
    }
}

- (void)reportRecrash:(NSDictionary *)recrashReport {
    @try {
        BugsnagEvent *event = [self eventWithRecrashReport:recrashReport];
        if (event) {
            [self sendEvent:event];
        }
    } @catch (NSException *exception) {
        bsg_log_err(@"%@", exception);
    }
}

// MARK: Private API

- (nullable BugsnagEvent *)eventWithErrorClass:(NSString *)errorClass
                                       message:(nullable NSString *)message
                                   diagnostics:(nullable NSDictionary<NSString *, id> *)diagnostics
                                  groupingHash:(nullable NSString *)groupingHash {
    
    BugsnagError *error =
    [[BugsnagError alloc] initWithErrorClass:errorClass
                                errorMessage:message
                                   errorType:BSGErrorTypeCocoa
                                  stacktrace:nil];
    
    return [self eventWithError:error diagnostics:diagnostics groupingHash:groupingHash];
}

- (nullable BugsnagEvent *)eventWithException:(NSException *)exception
                                  diagnostics:(nullable NSDictionary<NSString *, id> *)diagnostics
                                 groupingHash:(nullable NSString *)groupingHash {
    
    NSArray<BugsnagStackframe *> *stacktrace = [BugsnagStackframe stackframesWithCallStackReturnAddresses:exception.callStackReturnAddresses];
    
    BugsnagError *error =
    [[BugsnagError alloc] initWithErrorClass:exception.name
                                errorMessage:exception.reason
                                   errorType:BSGErrorTypeCocoa
                                  stacktrace:stacktrace];
    
    return [self eventWithError:error diagnostics:diagnostics groupingHash:groupingHash];
}

- (nullable BugsnagEvent *)eventWithRecrashReport:(NSDictionary *)recrashReport {
    NSString *reportType = recrashReport[@ BSG_KSCrashField_Report][@ BSG_KSCrashField_Type];
    if (![reportType isEqualToString:@ BSG_KSCrashReportType_Minimal]) {
        return nil;
    }
    
    NSDictionary *crash = recrashReport[@ BSG_KSCrashField_Crash];
    NSDictionary *crashedThread = crash[@ BSG_KSCrashField_CrashedThread];
    
    NSArray *backtrace = crashedThread[@ BSG_KSCrashField_Backtrace][@ BSG_KSCrashField_Contents];
    NSArray *binaryImages = recrashReport[@ BSG_KSCrashField_BinaryImages];
    NSArray<BugsnagStackframe *> *stacktrace = BSGDeserializeArrayOfObjects(backtrace, ^BugsnagStackframe *(NSDictionary *dict) {
        return [BugsnagStackframe frameFromDict:dict withImages:binaryImages];
    });
    
    NSDictionary *errorDict = crash[@ BSG_KSCrashField_Error];
    BugsnagError *error =
    [[BugsnagError alloc] initWithErrorClass:@"Crash handler crashed"
                                errorMessage:BSGParseErrorClass(errorDict, (id)errorDict[@ BSG_KSCrashField_Type])
                                   errorType:BSGErrorTypeCocoa
                                  stacktrace:stacktrace];
    
    BugsnagEvent *event = [self eventWithError:error diagnostics:recrashReport groupingHash:nil];
    event.handledState = [BugsnagHandledState handledStateWithSeverityReason:Signal];
    return event;
}

- (nullable BugsnagEvent *)eventWithError:(BugsnagError *)error
                              diagnostics:(nullable NSDictionary<NSString *, id> *)diagnostics
                             groupingHash:(nullable NSString *)groupingHash {
    
    id<BSGInternalErrorReporterDataSource> dataSource = self.dataSource;
    if (!dataSource) {
        return nil;
    }
    
    BugsnagMetadata *metadata = [[BugsnagMetadata alloc] init];
    if (diagnostics) {
        [metadata addMetadata:(NSDictionary * _Nonnull)diagnostics toSection:BugsnagDiagnosticsKey];
    }
    [metadata addMetadata:dataSource.configuration.apiKey withKey:BSGKeyApiKey toSection:BugsnagDiagnosticsKey];
    
    NSDictionary *systemInfo = [BSG_KSSystemInfo systemInfo];
    
    BugsnagEvent *event =
    [[BugsnagEvent alloc] initWithApp:[dataSource generateAppWithState:systemInfo]
                               device:[dataSource generateDeviceWithState:systemInfo]
                         handledState:[BugsnagHandledState handledStateWithSeverityReason:HandledError]
                                 user:[[BugsnagUser alloc] init]
                             metadata:metadata
                          breadcrumbs:@[]
                               errors:@[error]
                              threads:@[]
                              session:nil];
    
    event.groupingHash = groupingHash;
    
    return event;
}

// MARK: Delivery

- (NSURLRequest *)requestForEvent:(nonnull BugsnagEvent *)event error:(NSError * __autoreleasing *)errorPtr {
    id<BSGInternalErrorReporterDataSource> dataSource = self.dataSource;
    if (!dataSource) {
        return nil;
    }
    
    NSURL *url = dataSource.configuration.notifyURL;
    if (!url) {
        if (errorPtr) {
            *errorPtr = [NSError errorWithDomain:@"BugsnagConfigurationErrorDomain" code:0
                                        userInfo:@{NSLocalizedDescriptionKey: @"Missing notify URL"}];
        }
        return nil;
    }
    
    NSMutableDictionary *requestPayload = [NSMutableDictionary dictionary];
    requestPayload[BSGKeyEvents] = @[[event toJsonWithRedactedKeys:nil]];
    requestPayload[BSGKeyNotifier] = [[[BugsnagNotifier alloc] init] toDict];
    requestPayload[BSGKeyPayloadVersion] = EventPayloadVersion;
    
    NSData *data = [NSJSONSerialization dataWithJSONObject:requestPayload options:0 error:errorPtr];
    if (!data) {
        return nil;
    }
    
    NSMutableDictionary *headers = [NSMutableDictionary dictionary];
    headers[@"Content-Type"] = @"application/json";
    headers[BugsnagHTTPHeaderNameIntegrity] = [NSString stringWithFormat:@"sha1 %@", [BugsnagApiClient SHA1HashStringWithData:data]];
    headers[BugsnagHTTPHeaderNameInternalError] = @"bugsnag-cocoa";
    headers[BugsnagHTTPHeaderNamePayloadVersion] = EventPayloadVersion;
    headers[BugsnagHTTPHeaderNameSentAt] = [BSG_RFC3339DateTool stringFromDate:[NSDate date]];
    
    NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:url];
    request.allHTTPHeaderFields = headers;
    request.HTTPBody = data;
    request.HTTPMethod = @"POST";
    
    return request;
}

- (void)sendEvent:(nonnull BugsnagEvent *)event {
    NSError *error = nil;
    NSURLRequest *request = [self requestForEvent:event error:&error];
    if (!request) {
        bsg_log_err(@"%@", error);
        return;
    }
    [[self.session dataTaskWithRequest:request] resume];
}

@end
