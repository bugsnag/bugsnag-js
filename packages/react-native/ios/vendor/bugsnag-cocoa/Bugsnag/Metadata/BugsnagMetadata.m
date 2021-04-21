//
//  BugsnagMetaData.m
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

#import "BugsnagMetadata+Private.h"

#import "BSGSerialization.h"
#import "BugsnagLogger.h"
#import "BugsnagStateEvent.h"

@interface BugsnagMetadata ()
@property(atomic, readwrite, strong) NSMutableArray *stateEventBlocks;
@end

@implementation BugsnagMetadata

- (instancetype)init {
    NSMutableDictionary *dict = [NSMutableDictionary dictionary];
    return [self initWithDictionary:dict];
}

- (instancetype)initWithDictionary:(NSDictionary *)dict {
    if (self = [super init]) {
        // Ensure that the instantiating dictionary is mutable.
        // Saves checks later.
        _dictionary = [self sanitizeDictionary:dict];
        self.stateEventBlocks = [NSMutableArray new];
    }
    [self notifyObservers];
    return self;
}

/**
 * Sanitizes the given dictionary to prevent [NSNull null] values from being added
 * to the metadata when deserializing a payload.
 *
 * @param dictionary the input dictionary
 * @return a sanitized dictionary
 */
- (NSMutableDictionary *)sanitizeDictionary:(NSDictionary *)dictionary {
    NSMutableDictionary *input = [dictionary mutableCopy];

    for (NSString *key in [input allKeys]) {
        id obj = input[key];

        if (obj == [NSNull null]) {
            [input removeObjectForKey:key];
        } else if ([obj isKindOfClass:[NSDictionary class]]) {
            input[key] = [self sanitizeDictionary:obj];
        } else if ([obj isKindOfClass:[NSArray class]]) {
            input[key] = [self sanitizeArray:obj];
        }
    }
    return input;
}

- (NSMutableArray *)sanitizeArray:(NSArray *)obj {
    NSMutableArray *ary = [obj mutableCopy];
    [ary removeObject:[NSNull null]];

    for (NSUInteger k = 0; k < [ary count]; ++k) {
        if ([ary[k] isKindOfClass:[NSDictionary class]]) {
            ary[k] = [self sanitizeDictionary:ary[k]];
        } else if ([ary[k] isKindOfClass:[NSArray class]]) {
            ary[k] = [self sanitizeArray:ary[k]];
        }
    }
    return ary;
}

- (NSDictionary *)toDictionary {
    return [self.dictionary mutableCopy];
}

- (void)notifyObservers {
    for (BugsnagObserverBlock callback in self.stateEventBlocks) {
        BugsnagStateEvent *event = [[BugsnagStateEvent alloc] initWithName:kStateEventMetadata data:self];
        callback(event);
    }
}

- (void)addObserverWithBlock:(BugsnagObserverBlock _Nonnull)block {
    // Make a copy to avoid concurrency issues
    NSMutableArray *newStateEventBlocks = [self.stateEventBlocks mutableCopy];
    [newStateEventBlocks addObject:[block copy]];
    self.stateEventBlocks = newStateEventBlocks;
}

- (void)removeObserverWithBlock:(BugsnagObserverBlock _Nonnull)block {
    // Make a copy to avoid concurrency issues
    NSMutableArray *newStateEventBlocks = [self.stateEventBlocks mutableCopy];
    [newStateEventBlocks removeObject:block];
    self.stateEventBlocks = newStateEventBlocks;
}

// MARK: - <NSMutableCopying>

- (instancetype)mutableCopyWithZone:(__attribute__((unused)) NSZone *)zone {
    @synchronized(self) {
        NSMutableDictionary *dict = [self.dictionary mutableCopy];
        return [[BugsnagMetadata alloc] initWithDictionary:dict];
    }
}

- (NSMutableDictionary *)getMetadata:(NSString *)sectionName {
    @synchronized(self) {
        return self.dictionary[sectionName];
    }
}

- (NSMutableDictionary *)getMetadata:(NSString *)sectionName
                                 key:(NSString *)key
{
    @synchronized(self) {
        return self.dictionary[sectionName][key];
    }
}

- (instancetype)deepCopy {
    @synchronized(self) {
        return [[BugsnagMetadata alloc] initWithDictionary:self.dictionary];
    }
}

// MARK: - <BugsnagMetadataStore>

/**
 * Add a single key/value to a metadata Tab/Section.
 */
- (void)addMetadata:(id)metadata
            withKey:(NSString *)key
          toSection:(NSString *)sectionName
{
    if (key) {
        [self addMetadata:@{key: metadata ?: [NSNull null]} toSection:sectionName];
    }
}

/**
 * Merge supplied and existing metadata.
 */
- (void)addMetadata:(NSDictionary *)metadataValues
          toSection:(NSString *)sectionName
{
    @synchronized (self) {
        NSDictionary *oldValue = self.dictionary[sectionName] ?: @{};
        NSMutableDictionary *metadata = [oldValue mutableCopy];
        for (id key in metadataValues) {
            if ([key isKindOfClass:[NSString class]]) {
                id obj = metadataValues[key];
                if (obj == [NSNull null]) {
                    metadata[key] = nil;
                } else {
                    id sanitisedObject = BSGSanitizeObject(obj);
                    if (sanitisedObject) {
                        metadata[key] = sanitisedObject;
                    } else {
                        bsg_log_err(@"Failed to add metadata: %@ is not JSON serializable.", [obj class]);
                    }
                }
            }
        }
        if (![oldValue isEqual:metadata]) {
            self.dictionary[sectionName] = metadata.count ? metadata : nil;
            [self notifyObservers];
        }
    }
}

- (NSMutableDictionary *)getMetadataFromSection:(NSString *)sectionName
{
    @synchronized(self) {
        return [self.dictionary[sectionName] mutableCopy];
    }
}

- (id _Nullable)getMetadataFromSection:(NSString *)sectionName
                                        withKey:(NSString *)key
{
    @synchronized(self) {
        return [self.dictionary valueForKeyPath:[NSString stringWithFormat:@"%@.%@", sectionName, key]];
    }
}

- (void)clearMetadataFromSection:(NSString *)sectionName
{
    @synchronized(self) {
        [self.dictionary removeObjectForKey:sectionName];
    }
    [self notifyObservers];
}

- (void)clearMetadataFromSection:(NSString *)section
                         withKey:(NSString *)key
{
    @synchronized(self) {
        [(NSMutableDictionary *)self.dictionary[section] removeObjectForKey:key];
    }
    [self notifyObservers];
}

@end
