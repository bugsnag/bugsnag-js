//
//  RegisterErrorData.m
//  Bugsnag
//
//  Created by Jamie Lynch on 07/04/2020.
//  Copyright © 2020 Bugsnag. All rights reserved.
//

#import "RegisterErrorData.h"
#import "BugsnagKeys.h"

@implementation RegisterErrorData
+ (instancetype)errorDataFromThreads:(NSArray *)threads {
    for (NSDictionary *thread in threads) {
        if (![thread[@"crashed"] boolValue]) {
            continue;
        }
        NSDictionary *notableAddresses = thread[@"notable_addresses"];
        NSMutableArray *interestingValues = [NSMutableArray new];
        NSString *reservedWord = nil;

        for (NSString *key in notableAddresses) {
            NSDictionary *data = notableAddresses[key];
            if (![@"string" isEqualToString:data[BSGKeyType]]) {
                continue;
            }
            NSString *contentValue = data[@"value"];

            if (contentValue == nil || ![contentValue isKindOfClass:[NSString class]]) {
                continue;
            }

            if ([self isReservedWord:contentValue]) {
                reservedWord = contentValue;
            } else if ([[contentValue componentsSeparatedByString:@"/"] count] <= 2) {
                // must be a string that isn't a reserved word and isn't a filepath
                [interestingValues addObject:contentValue];
            }
        }

        [interestingValues sortUsingSelector:@selector(localizedCaseInsensitiveCompare:)];

        NSString *message = [interestingValues componentsJoinedByString:@" | "];
        // reservedWord *shouldn't* equal nil, but since RegisterErrorData expects a non-nil
        // argument guard against it anyway, and fall through.
        if (reservedWord != nil) {
            return [[RegisterErrorData alloc] initWithClass:reservedWord
                                                    message:message];
       }
    }
    return nil;
}

/**
 * Determines whether a string is a "reserved word" that identifies it as a known value.
 *
 * For fatalError, preconditionFailure, and assertionFailure, "fatal error" will be in one of the registers.
 *
 * For assert, "assertion failed" will be in one of the registers.
 */
+ (BOOL)isReservedWord:(NSString *)contentValue {
    return [@"assertion failed" caseInsensitiveCompare:contentValue] == NSOrderedSame
    || [@"fatal error" caseInsensitiveCompare:contentValue] == NSOrderedSame
    || [@"precondition failed" caseInsensitiveCompare:contentValue] == NSOrderedSame;
}

- (instancetype)init {
    return [self initWithClass:@"Unknown" message:@"<unset>"];
}

- (instancetype)initWithClass:(NSString *)errorClass message:(NSString *)errorMessage {
    if (errorClass.length == 0) {
        return nil;
    }
    if (self = [super init]) {
        _errorClass = errorClass;
        _errorMessage = errorMessage;
    }
    return self;
}

@end
