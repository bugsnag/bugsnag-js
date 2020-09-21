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

#import "BugsnagMetadata.h"
#import "BugsnagMetadataInternal.h"
#import "BSGSerialization.h"
#import "BugsnagLogger.h"
#import "BugsnagStateEvent.h"

@interface BugsnagMetadata ()
@property(atomic, readwrite, strong) NSMutableArray *stateEventBlocks;
@end

@implementation BugsnagMetadata

- (id)init {
    NSMutableDictionary *dict = [NSMutableDictionary dictionary];
    return [self initWithDictionary:dict];
}

- (id)initWithDictionary:(NSDictionary *)dict {
    if (self = [super init]) {
        // Ensure that the instantiating dictionary is mutable.
        // Saves checks later.
        self.dictionary = [self sanitizeDictionary:dict];
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

- (id)mutableCopyWithZone:(NSZone *)zone {
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

- (id)deepCopy {
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
    bool metadataChanged = false;
    @synchronized(self) {
        if (metadata && metadata != [NSNull null]) {
            id cleanedValue = BSGSanitizeObject(metadata);
            if (cleanedValue) {
                // Value is OK, try and set it
                NSMutableDictionary *section = [self getMetadataFromSection:sectionName];
                if (!section) {
                    section = [NSMutableDictionary new];
                    [[self dictionary] setObject:section forKey:sectionName];
                }
                section[key] = cleanedValue;
                [self dictionary][sectionName] = section;
                metadataChanged = true;
            } else {
                Class klass = [metadata class];
                bsg_log_err(@"Failed to add metadata: Value of class %@ is not "
                            @"JSON serializable",
                            klass);
            }
        }
        
        // It's some form of nil/null
        else {
            [self clearMetadataFromSection:sectionName withKey:key];
            metadataChanged = true;
        }
    }
    
    // Call the delegate if we've materially changed it
    if (metadataChanged) {
        [self notifyObservers];
    }
}

/**
 * Merge supplied and existing metadata.
 */
- (void)addMetadata:(NSDictionary *)metadataValues
          toSection:(NSString *)sectionName
{
    @synchronized(self) {
        if (metadataValues) {
            // Check each value in turn.  Remove nulls, add/replace others
            // Fast enumeration over the (unmodified) supplied values for simplicity
            bool metadataChanged = false;
            for (id key in metadataValues) {
                // Ensure keys are (JSON-serializable) strings
                if ([[key class] isSubclassOfClass:[NSString class]]) {
                    id value = [metadataValues objectForKey:key];
                    
                    // The common case: adding sensible values
                    if (value && value != [NSNull null]) {
                        id cleanedValue = BSGSanitizeObject(value);
                        if (cleanedValue) {
                            // We only want to create a tab if we have a valid value.
                            NSMutableDictionary *metadata = [self getMetadataFromSection:sectionName];
                            if (!metadata) {
                                metadata = [NSMutableDictionary new];
                                [self dictionary][sectionName] = metadata;
                            }
                            [metadata setObject:cleanedValue forKey:key];
                            [self.dictionary setObject:metadata forKey:sectionName];
                            metadataChanged = true;
                        }
                        // Log the failure but carry on
                        else {
                            Class klass = [value class];
                            bsg_log_err(@"Failed to add metadata: Value of class %@ is not "
                                        @"JSON serializable.", klass);
                        }
                    }
                    
                    // Remove existing value if supplied null.
                    // Ensure we don't inadvertently create a section.
                    else if (value == [NSNull null]
                             && [self.dictionary objectForKey:sectionName]
                             && [[self.dictionary objectForKey:sectionName] objectForKey:key])
                    {
                        [[self.dictionary objectForKey:sectionName] removeObjectForKey:key];
                        metadataChanged = true;
                    }
                }
                
                // Something went wrong...
                else {
                    bsg_log_err(@"Failed to update metadata: Section: %@, Values: %@", sectionName, metadataValues);
                }
            }
            
            // Call the delegate if we've materially changed it
            if (metadataChanged) {
                [self notifyObservers];
            }
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
        if ([[[self dictionary] objectForKey:section] objectForKey:key]) {
            [[[self dictionary] objectForKey:section] removeObjectForKey:key];
        }
    }
    [self notifyObservers];
}

@end
