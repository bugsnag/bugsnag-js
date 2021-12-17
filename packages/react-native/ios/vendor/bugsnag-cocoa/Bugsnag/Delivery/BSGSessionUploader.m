//
//  BSGSessionUploader.m
//  Bugsnag
//
//  Copyright © 2021 Bugsnag Inc. All rights reserved.
//

#import "BSGSessionUploader.h"

#import "BSGFileLocations.h"
#import "BSG_RFC3339DateTool.h"
#import "BugsnagApiClient.h"
#import "BugsnagApp+Private.h"
#import "BugsnagCollections.h"
#import "BugsnagConfiguration+Private.h"
#import "BugsnagDevice+Private.h"
#import "BugsnagKeys.h"
#import "BugsnagLogger.h"
#import "BugsnagNotifier.h"
#import "BugsnagSession+Private.h"
#import "BugsnagSession.h"
#import "BugsnagSessionFileStore.h"


@interface BSGSessionUploader ()
@property (nonatomic) NSMutableSet *activeIds;
@property (nonatomic) BugsnagApiClient *apiClient;
@property(nonatomic) BugsnagConfiguration *config;
@property (nonatomic) BugsnagSessionFileStore *fileStore;
@end


@implementation BSGSessionUploader

- (instancetype)initWithConfig:(BugsnagConfiguration *)config notifier:(BugsnagNotifier *)notifier {
    if ((self = [super init])) {
        _activeIds = [NSMutableSet new];
        _apiClient = [[BugsnagApiClient alloc] initWithSession:config.session];
        _config = config;
        _fileStore = [BugsnagSessionFileStore storeWithPath:[BSGFileLocations current].sessions maxPersistedSessions:config.maxPersistedSessions];
        _notifier = notifier;
    }
    return self;
}

- (void)uploadSession:(BugsnagSession *)session {
    [self sendSession:session completionHandler:^(BugsnagApiClientDeliveryStatus status) {
        switch (status) {
            case BugsnagApiClientDeliveryStatusDelivered:
                [self uploadStoredSessions];
                break;
                
            case BugsnagApiClientDeliveryStatusFailed:
                [self.fileStore write:session]; // Retry later
                break;
                
            case BugsnagApiClientDeliveryStatusUndeliverable:
                break;
        }
    }];
}

- (void)uploadStoredSessions {
    [[self.fileStore allFilesByName] enumerateKeysAndObjectsUsingBlock:^(NSString *fileId, NSDictionary *fileContents, __unused BOOL *stop) {
        // De-duplicate files as deletion of the file is asynchronous and so multiple calls
        // to this method will result in multiple send requests
        @synchronized (self.activeIds) {
            if ([self.activeIds containsObject:fileId]) {
                return;
            }
            [self.activeIds addObject:fileId];
        }

        BugsnagSession *session = [[BugsnagSession alloc] initWithDictionary:fileContents];

        [self sendSession:session completionHandler:^(BugsnagApiClientDeliveryStatus status) {
            if (status != BugsnagApiClientDeliveryStatusFailed) {
                [self.fileStore deleteFileWithId:fileId];
            }
            @synchronized (self.activeIds) {
                [self.activeIds removeObject:fileId];
            }
        }];
    }];
}

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
        BSGKeySessions: BSGArrayWithObject([session toJson])
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
