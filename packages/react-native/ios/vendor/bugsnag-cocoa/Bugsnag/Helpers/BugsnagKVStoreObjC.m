//
//  BugsnagKVStoreObjC.m
//  Bugsnag
//
//  Created by Karl Stenerud on 15.09.20.
//  Copyright © 2020 Bugsnag Inc. All rights reserved.
//

#import "BugsnagKVStoreObjC.h"
#import "BSGCachesDirectory.h"
#import "BugsnagKVStore.h"
#import "BugsnagLogger.h"

#define KV_DIR @"bsg_kvstore"

static void bsgkv_init() {
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        NSString *cachesDir = [BSGCachesDirectory cachesDirectory];
        const char *kvstoreDir = [[cachesDir stringByAppendingPathComponent:KV_DIR] cStringUsingEncoding:NSUTF8StringEncoding];
        int err = 0;
        bsgkv_open(kvstoreDir, &err);
        if(err != 0) {
            bsg_log_err(@"Error (errno %d) initializing KV Store at %s", err, kvstoreDir);
        }
    });
}

@implementation BugsnagKVStore

+ (void)initialize {
    bsgkv_init();
}

- (void)setBoolean:(bool)value forKey:(NSString*)key {
    int err = 0;
    bsgkv_setBoolean([key UTF8String], value, &err);
    if(err != 0) {
        bsg_log_err(@"Error writing boolean key %@ to kv store. errno = %d", key, err);
        return;
    }
}

- (bool)booleanForKey:(NSString*)key defaultValue:(bool)defaultValue {
    int err = 0;
    bool value = bsgkv_getBoolean([key UTF8String], &err);
    if(err != 0) {
        value = defaultValue;
    }
    return value;
}

- (NSNumber*)NSBooleanForKey:(NSString*)key defaultValue:(bool)defaultValue {
    return [NSNumber numberWithBool:[self booleanForKey:key defaultValue:defaultValue]];
}

- (void)setString:(NSString*)value forKey:(NSString*)key {
    int err = 0;
    if(value == nil || (id)value == [NSNull null]) {
        bsgkv_delete([key UTF8String], &err);
        if(err != 0) {
            bsg_log_err(@"Error deleting key %@ from kv store. errno = %d", key, err);
        }
    } else {
        bsgkv_setString([key UTF8String], [value UTF8String], &err);
        if(err != 0) {
            bsg_log_err(@"Error writing string key %@ to kv store. errno = %d", key, err);
        }
    }
}

- (NSString*)stringForKey:(NSString*)key defaultValue:(NSString*)defaultValue {
    NSString *value = defaultValue;
    char buffer[500];
    int err = 0;
    bsgkv_getString([key UTF8String], buffer, sizeof(buffer), &err);
    if(err == 0) {
        value = [NSString stringWithUTF8String:buffer];
    }
    return value;
}

@end
