//
//  BSGSessionUploader.m
//  Bugsnag
//
//  Copyright © 2021 Bugsnag Inc. All rights reserved.
//

#import "BSGSessionUploader.h"

#import "BSGFileLocations.h"
#import "BSGJSONSerialization.h"
#import "BSGKeys.h"
#import "BSG_RFC3339DateTool.h"
#import "BugsnagApiClient.h"
#import "BugsnagApp+Private.h"
#import "BugsnagCollections.h"
#import "BugsnagConfiguration+Private.h"
#import "BugsnagDevice+Private.h"
#import "BugsnagLogger.h"
#import "BugsnagNotifier.h"
#import "BugsnagSession+Private.h"
#import "BugsnagSession.h"
#import "BugsnagUser+Private.h"

/// Persisted sessions older than this should be deleted without sending.
static const NSTimeInterval MaxPersistedAge = 60 * 24 * 60 * 60;

static NSArray * SortedFiles(NSFileManager *fileManager, NSMutableDictionary<NSString *, NSDate *> **creationDates);


@interface BSGSessionUploader ()
@property (nonatomic) NSMutableSet *activeIds;
@property (nonatomic) BugsnagApiClient *apiClient;
@property(nonatomic) BugsnagConfiguration *config;
@end


@implementation BSGSessionUploader

- (instancetype)initWithConfig:(BugsnagConfiguration *)config notifier:(BugsnagNotifier *)notifier {
    if ((self = [super init])) {
        _activeIds = [NSMutableSet new];
        _apiClient = [[BugsnagApiClient alloc] initWithSession:config.session];
        _config = config;
        _notifier = notifier;
    }
    return self;
}

- (void)uploadSession:(BugsnagSession *)session {
    [self sendSession:session completionHandler:^(BugsnagApiClientDeliveryStatus status) {
        switch (status) {
            case BugsnagApiClientDeliveryStatusDelivered:
                [self processStoredSessions];
                break;
                
            case BugsnagApiClientDeliveryStatusFailed:
                [self storeSession:session]; // Retry later
                break;
                
            case BugsnagApiClientDeliveryStatusUndeliverable:
                break;
        }
    }];
}

- (void)storeSession:(BugsnagSession *)session {
    NSDictionary *json = BSGSessionToDictionary(session);
    NSString *file = [[BSGFileLocations.current.sessions
                       stringByAppendingPathComponent:session.id]
                      stringByAppendingPathExtension:@"json"];
    
    NSError *error;
    if (BSGJSONWriteToFileAtomically(json, file, &error)) {
        bsg_log_debug(@"Stored session %@", session.id);
        [self pruneFiles];
    } else {
        bsg_log_debug(@"Failed to write session %@", error);
    }
}

- (void)processStoredSessions {
    NSFileManager *fileManager = [[NSFileManager alloc] init];
    NSMutableDictionary<NSString *, NSDate *> *creationDates = nil;
    NSArray *sortedFiles = SortedFiles(fileManager, &creationDates);
    
    for (NSString *file in sortedFiles) {
        if (creationDates[file].timeIntervalSinceNow < -MaxPersistedAge) {
            bsg_log_debug(@"Deleting stale session %@",
                          file.lastPathComponent.stringByDeletingPathExtension);
            [fileManager removeItemAtPath:file error:nil];
            continue;
        }
        
        NSDictionary *json = BSGJSONDictionaryFromFile(file, 0, nil);
        BugsnagSession *session = BSGSessionFromDictionary(json);
        if (!session) {
            bsg_log_debug(@"Deleting invalid session %@",
                          file.lastPathComponent.stringByDeletingPathExtension);
            [fileManager removeItemAtPath:file error:nil];
            continue;
        }
        
        @synchronized (self.activeIds) {
            if ([self.activeIds containsObject:file]) {
                continue;
            }
            [self.activeIds addObject:file];
        }
        
        [self sendSession:session completionHandler:^(BugsnagApiClientDeliveryStatus status) {
            if (status != BugsnagApiClientDeliveryStatusFailed) {
                [fileManager removeItemAtPath:file error:nil];
            }
            @synchronized (self.activeIds) {
                [self.activeIds removeObject:file];
            }
        }];
    }
}

- (void)pruneFiles {
    NSFileManager *fileManager = [[NSFileManager alloc] init];
    NSMutableArray *sortedFiles = [SortedFiles(fileManager, NULL) mutableCopy];
    
    while (sortedFiles.count > self.config.maxPersistedSessions) {
        NSString *file = sortedFiles[0];
        bsg_log_debug(@"Deleting %@ to comply with maxPersistedSessions",
                      file.lastPathComponent.stringByDeletingPathExtension);
        [fileManager removeItemAtPath:file error:nil];
        [sortedFiles removeObject:file];
    }
}

//
// https://bugsnagsessiontrackingapi.docs.apiary.io/#reference/0/session/report-a-session-starting
//
- (void)sendSession:(BugsnagSession *)session completionHandler:(nonnull void (^)(BugsnagApiClientDeliveryStatus status))completionHandler {
    NSString *apiKey = [self.config.apiKey copy];
    if (!apiKey) {
        bsg_log_err(@"Cannot send session because no apiKey is configured.");
        completionHandler(BugsnagApiClientDeliveryStatusUndeliverable);
        return;
    }
    
    NSURL *url = self.config.sessionURL;
    if (!url) {
        bsg_log_err(@"Cannot send session because no endpoint is configured.");
        completionHandler(BugsnagApiClientDeliveryStatusUndeliverable);
        return;
    }
    
    NSDictionary *headers = @{
        BugsnagHTTPHeaderNameApiKey: apiKey,
        BugsnagHTTPHeaderNamePayloadVersion: @"1.0",
        BugsnagHTTPHeaderNameSentAt: [BSG_RFC3339DateTool stringFromDate:[NSDate date]] ?: [NSNull null]
    };
    
    NSDictionary *payload = @{
        BSGKeyApp: [session.app toDict] ?: [NSNull null],
        BSGKeyDevice: [session.device toDictionary] ?: [NSNull null],
        BSGKeyNotifier: [self.notifier toDict] ?: [NSNull null],
        BSGKeySessions: @[@{
            BSGKeyId: session.id,
            BSGKeyStartedAt: [BSG_RFC3339DateTool stringFromDate:session.startedAt] ?: [NSNull null],
            BSGKeyUser: [session.user toJson] ?: @{}
        }]
    };
    
    [self.apiClient sendJSONPayload:payload headers:headers toURL:url completionHandler:^(BugsnagApiClientDeliveryStatus status, NSError *error) {
        switch (status) {
            case BugsnagApiClientDeliveryStatusDelivered:
                bsg_log_info(@"Sent session %@", session.id);
                break;
            case BugsnagApiClientDeliveryStatusFailed:
                bsg_log_warn(@"Failed to send sessions: %@", error);
                break;
            case BugsnagApiClientDeliveryStatusUndeliverable:
                bsg_log_warn(@"Failed to send sessions: %@", error);
                break;
        }
        completionHandler(status);
    }];
}

@end


static NSArray * SortedFiles(NSFileManager *fileManager, NSMutableDictionary<NSString *, NSDate *> **outDates) {
    NSString *dir = BSGFileLocations.current.sessions;
    NSMutableDictionary<NSString *, NSDate *> *dates = [NSMutableDictionary dictionary];
    
    for (NSString *name in [fileManager contentsOfDirectoryAtPath:dir error:nil]) {
        NSString *file = [dir stringByAppendingPathComponent:name];
        NSDate *date = [fileManager attributesOfItemAtPath:file error:nil].fileCreationDate;
        if (!date) {
            bsg_log_debug(@"Deleting session %@ because fileCreationDate is nil",
                          file.lastPathComponent.stringByDeletingPathExtension);
            [fileManager removeItemAtPath:file error:nil];
        }
        dates[file] = date;
    }
    
    if (outDates) {
        *outDates = dates;
    }
    
    return [dates.allKeys sortedArrayUsingComparator:^(NSString *a, NSString *b) {
        return [dates[a] compare:dates[b] ?: NSDate.distantPast];
    }];
}
