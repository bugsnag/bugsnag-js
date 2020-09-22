//
// Created by Jamie Lynch on 30/11/2017.
// Copyright (c) 2017 Bugsnag. All rights reserved.
//

#import "BugsnagSessionFileStore.h"
#import "BSG_KSLogger.h"
#import "BSGJSONSerialization.h"

static NSString *const kSessionStoreSuffix = @"-Session-";

@interface BugsnagSession ()
- (NSDictionary *)toJson;
@end

@implementation BugsnagSessionFileStore

+ (BugsnagSessionFileStore *)storeWithPath:(NSString *)path {
    return [[self alloc] initWithPath:path
                       filenameSuffix:kSessionStoreSuffix];
}

- (void)write:(BugsnagSession *)session {
    // serialise session
    NSString *filepath = [self pathToFileWithId:session.id];
    NSDictionary *dict = [session toJson];

    NSError *error;
    NSData *json = [BSGJSONSerialization dataWithJSONObject:dict options:0 error:&error];

    if (error != nil || ![json writeToFile:filepath atomically:YES]) {
        BSG_KSLOG_ERROR(@"Failed to write session %@", error);
        return;
    }
}


@end
