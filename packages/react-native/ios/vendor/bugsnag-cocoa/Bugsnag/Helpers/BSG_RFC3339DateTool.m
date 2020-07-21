//
// RFC3339DateTool.m
//
// Copyright 2010 Karl Stenerud
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

@interface BSG_RFC3339DateTool ()
+ (NSDateFormatter *)iosFormatterInstance;
@end

@implementation BSG_RFC3339DateTool

static NSString *const kRfcDateFormatterKey = @"RfcDateFormatter";
static NSString *const kIsoDateFormatterKey = @"IsoDateFormatter";

+ (NSDateFormatter *)sharedInstance {
    NSMutableDictionary *threadDict = [[NSThread currentThread] threadDictionary];
    NSDateFormatter *formatter = threadDict[kRfcDateFormatterKey];
    if (formatter == nil) {
        formatter = [NSDateFormatter new];
        NSLocale *locale =
        [[NSLocale alloc] initWithLocaleIdentifier:@"en_US_POSIX"];
        [formatter setLocale:locale];
        [formatter setDateFormat:@"yyyy'-'MM'-'dd'T'HH':'mm':'ss'Z'"];
        [formatter setTimeZone:[NSTimeZone timeZoneForSecondsFromGMT:0]];
        threadDict[kRfcDateFormatterKey] = formatter;
    }

    formatter = threadDict[kRfcDateFormatterKey];
    return formatter;
}

/**
Used internally to convert any dates with timezones (from older notifier versions) to Zulu time
 */
+ (NSDateFormatter *)iosFormatterInstance {
    NSMutableDictionary *threadDict = [[NSThread currentThread] threadDictionary];
    NSDateFormatter *formatter = threadDict[kIsoDateFormatterKey];
    if (formatter == nil) {
        formatter = [NSDateFormatter new];
        NSLocale *locale =
        [[NSLocale alloc] initWithLocaleIdentifier:@"en_US_POSIX"];
        [formatter setLocale:locale];
        [formatter setDateFormat:@"yyyy'-'MM'-'dd'T'HH':'mm':'ssZZZ"];
        [formatter setTimeZone:[NSTimeZone timeZoneForSecondsFromGMT:0]];
        threadDict[kIsoDateFormatterKey] = formatter;
    }
    
    formatter = threadDict[kIsoDateFormatterKey];
    return formatter;
}

+ (NSString *)stringFromDate:(NSDate *)date {
    if (![date isKindOfClass:[NSDate class]]) {
        return nil;
    }
    return [[self sharedInstance] stringFromDate:date];
}

+ (NSDate *)dateFromString:(NSString *)string {
    if (![string isKindOfClass:[NSString class]]) {
        return nil;
    }
    NSDate *date = [[self sharedInstance] dateFromString:string];
    if (!date) {
        date = [[self iosFormatterInstance] dateFromString:string];
    }
    return date;
}

+ (NSString *)stringFromUNIXTimestamp:(unsigned long long)timestamp {
    return
        [self stringFromDate:[NSDate dateWithTimeIntervalSince1970:timestamp]];
}

@end
