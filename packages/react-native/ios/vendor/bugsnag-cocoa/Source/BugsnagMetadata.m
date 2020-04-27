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
#import "BSGSerialization.h"
#import "BugsnagLogger.h"

@interface BugsnagMetadata ()
@property(atomic, strong) NSMutableDictionary *dictionary;
- (NSDictionary *_Nonnull)toDictionary;
@property(unsafe_unretained) id<BugsnagMetadataDelegate> _Nullable delegate;
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
        self.dictionary = [dict mutableCopy];
    }
    [self.delegate metadataChanged:self];
    return self;
}

- (NSDictionary *)toDictionary
{
    @synchronized(self) {
        return [NSDictionary dictionaryWithDictionary:self.dictionary];
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
        [self.delegate metadataChanged:self];
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
                [self.delegate metadataChanged:self];
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
    [self.delegate metadataChanged:self];
}

- (void)clearMetadataFromSection:(NSString *)section
                         withKey:(NSString *)key
{
    @synchronized(self) {
        if ([[[self dictionary] objectForKey:section] objectForKey:key]) {
            [[[self dictionary] objectForKey:section] removeObjectForKey:key];
        }
    }
    [self.delegate metadataChanged:self];
}

@end
