//
//  BSGEventUploadObjectOperation.m
//  Bugsnag
//
//  Created by Nick Dowell on 17/02/2021.
//  Copyright © 2021 Bugsnag Inc. All rights reserved.
//

#import "BSGEventUploadObjectOperation.h"

#import "BSGJSONSerialization.h"
#import "BugsnagEvent.h"
#import "BugsnagLogger.h"

@implementation BSGEventUploadObjectOperation

- (instancetype)initWithEvent:(BugsnagEvent *)event delegate:(id<BSGEventUploadOperationDelegate>)delegate {
    if (self = [super initWithDelegate:delegate]) {
        _event = event;
    }
    return self;
}

- (BugsnagEvent *)loadEventAndReturnError:(NSError **)errorPtr {
    return self.event;
}

- (void)storeEventPayload:(NSDictionary *)eventPayload inDirectory:(NSString *)directory {
    NSString *file = [[directory stringByAppendingPathComponent:[NSUUID UUID].UUIDString] stringByAppendingPathExtension:@"json"];
    NSError *error = nil;
    if ([BSGJSONSerialization writeJSONObject:eventPayload toFile:file options:0 error:&error]) {
        [self.delegate uploadOperationDidStoreEventPayload:self];
    } else {
        bsg_log_err(@"Error encountered while saving event payload for retry: %@", error);
    }
}

- (NSString *)name {
    return self.event.description;
}

@end
