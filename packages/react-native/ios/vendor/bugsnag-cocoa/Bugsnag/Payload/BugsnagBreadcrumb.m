//
//  BugsnagBreadcrumb.m
//
//  Created by Delisa Mason on 9/16/15.
//
//  Copyright (c) 2015 Bugsnag, Inc. All rights reserved.
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
#import "BSG_RFC3339DateTool.h"

#import "BugsnagBreadcrumb.h"
#import "BugsnagBreadcrumbs.h"
#import "Bugsnag.h"
#import "BugsnagLogger.h"
#import "BugsnagKeys.h"

typedef void (^BSGBreadcrumbConfiguration)(BugsnagBreadcrumb *_Nonnull);

NSString *BSGBreadcrumbTypeValue(BSGBreadcrumbType type) {
    switch (type) {
    case BSGBreadcrumbTypeLog:
        return @"log";
    case BSGBreadcrumbTypeUser:
        return @"user";
    case BSGBreadcrumbTypeError:
        return BSGKeyError;
    case BSGBreadcrumbTypeState:
        return @"state";
    case BSGBreadcrumbTypeManual:
        return @"manual";
    case BSGBreadcrumbTypeProcess:
        return @"process";
    case BSGBreadcrumbTypeRequest:
        return @"request";
    case BSGBreadcrumbTypeNavigation:
        return @"navigation";
    }
}

BSGBreadcrumbType BSGBreadcrumbTypeFromString(NSString *value) {
    if ([value isEqual:@"log"]) {
        return BSGBreadcrumbTypeLog;
    } else if ([value isEqual:@"user"]) {
        return BSGBreadcrumbTypeUser;
    } else if ([value isEqual:@"error"]) {
        return BSGBreadcrumbTypeError;
    } else if ([value isEqual:@"state"]) {
        return BSGBreadcrumbTypeState;
    } else if ([value isEqual:@"process"]) {
        return BSGBreadcrumbTypeProcess;
    } else if ([value isEqual:@"request"]) {
        return BSGBreadcrumbTypeRequest;
    } else if ([value isEqual:@"navigation"]) {
        return BSGBreadcrumbTypeNavigation;
    } else {
        return BSGBreadcrumbTypeManual;
    }
}

@implementation BugsnagBreadcrumb

- (instancetype)init {
    if (self = [super init]) {
        _timestamp = [NSDate date];
        _type = BSGBreadcrumbTypeManual;
        _metadata = @{};
    }
    return self;
}

- (BOOL)isValid {
    return self.message.length > 0 && self.timestamp != nil;
}

- (NSDictionary *)objectValue {
    @synchronized (self) {
        NSString *timestamp = [BSG_RFC3339DateTool stringFromDate:_timestamp];
        if (timestamp && _message.length > 0) {
            NSMutableDictionary *metadata = [NSMutableDictionary new];
            for (NSString *key in _metadata) {
                metadata[[key copy]] = [_metadata[key] copy];
            }
            return @{
                // Note: The Bugsnag Error Reporting API specifies that the breadcrumb "message"
                // field should be delivered in as a "name" field.  This comment notes that variance.
                BSGKeyName : [_message copy],
                BSGKeyTimestamp : timestamp,
                BSGKeyType : BSGBreadcrumbTypeValue(_type),
                BSGKeyMetadata : metadata
            };
        }
        return nil;
    }
}

@synthesize timestamp = _timestamp;

- (NSDate *)timestamp {
    @synchronized (self) {
        return _timestamp;
    }
}

- (void)setTimestamp:(NSDate * _Nullable)timestamp {
    @synchronized (self) {
        [self willChangeValueForKey:NSStringFromSelector(@selector(timestamp))];
        _timestamp = timestamp;
        [self didChangeValueForKey:NSStringFromSelector(@selector(timestamp))];
    }
}

@synthesize message = _message;

- (NSString *)message {
    @synchronized (self) {
        return _message;
    }
}

@synthesize type = _type;

- (BSGBreadcrumbType)type {
    @synchronized (self) {
        return _type;
    }
}

- (void)setType:(BSGBreadcrumbType)type {
    @synchronized (self) {
        [self willChangeValueForKey:NSStringFromSelector(@selector(type))];
        _type = type;
        [self didChangeValueForKey:NSStringFromSelector(@selector(type))];
    }
}

- (void)setMessage:(NSString *)message {
    @synchronized (self) {
        [self willChangeValueForKey:NSStringFromSelector(@selector(message))];
        _message = message;
        [self didChangeValueForKey:NSStringFromSelector(@selector(message))];
    }
}

@synthesize metadata = _metadata;

- (NSDictionary *)metadata {
    @synchronized (self) {
        return _metadata;
    }
}

- (void)setMetadata:(NSDictionary *)metadata {
    @synchronized (self) {
        [self willChangeValueForKey:NSStringFromSelector(@selector(metadata))];
        _metadata = metadata;
        [self didChangeValueForKey:NSStringFromSelector(@selector(metadata))];
    }
}

+ (instancetype)breadcrumbWithBlock:(BSGBreadcrumbConfiguration)block {
    BugsnagBreadcrumb *crumb = [self new];
    if (block) {
        block(crumb);
    }
    if ([crumb isValid]) {
        return crumb;
    }
    return nil;
}

+ (NSArray<BugsnagBreadcrumb *> *)breadcrumbArrayFromJson:(NSArray *)json {
    NSMutableArray *data = [NSMutableArray new];

    for (NSDictionary *dict in json) {
        BugsnagBreadcrumb *crumb = [BugsnagBreadcrumb breadcrumbFromDict:dict];
        [data addObject:crumb];
    }
    return data;
}

+ (instancetype)breadcrumbFromDict:(NSDictionary *)dict {
    BOOL isValidCrumb = [dict[BSGKeyType] isKindOfClass:[NSString class]]
        && [dict[BSGKeyTimestamp] isKindOfClass:[NSString class]]
        && (
            [dict[BSGKeyMetadata] isKindOfClass:[NSDictionary class]]
            || [dict[@"metadata"] isKindOfClass:[NSDictionary class]] // react-native uses lowercase key
            )
        // Accept legacy 'name' value if provided.
        && ([dict[BSGKeyMessage] isKindOfClass:[NSString class]]
            || [dict[BSGKeyName] isKindOfClass:[NSString class]]);
    if (isValidCrumb) {
        return [self breadcrumbWithBlock:^(BugsnagBreadcrumb *crumb) {
            crumb.message = dict[BSGKeyMessage] ?: dict[BSGKeyName];
            crumb.metadata = dict[BSGKeyMetadata] ?: dict[@"metadata"];
            crumb.timestamp = [BSG_RFC3339DateTool dateFromString:dict[BSGKeyTimestamp]];
            crumb.type = BSGBreadcrumbTypeFromString(dict[BSGKeyType]);
        }];
    }
    return nil;
}

@end

