//
//  BugsnagError.m
//  Bugsnag
//
//  Created by Jamie Lynch on 01/04/2020.
//  Copyright © 2020 Bugsnag. All rights reserved.
//

#import "BugsnagError+Private.h"

#import "BSG_KSCrashReportFields.h"
#import "BugsnagCollections.h"
#import "BugsnagKeys.h"
#import "BugsnagLogger.h"
#import "BugsnagStackframe+Private.h"
#import "BugsnagStacktrace.h"
#import "BugsnagThread+Private.h"


NSString *_Nonnull BSGSerializeErrorType(BSGErrorType errorType) {
    switch (errorType) {
        case BSGErrorTypeCocoa:
            return @"cocoa";
        case BSGErrorTypeC:
            return @"c";
        case BSGErrorTypeReactNativeJs:
            return @"reactnativejs";
    }
}

BSGErrorType BSGParseErrorType(NSString *errorType) {
    if ([@"cocoa" isEqualToString:errorType]) {
        return BSGErrorTypeCocoa;
    } else if ([@"c" isEqualToString:errorType]) {
        return BSGErrorTypeC;
    } else if ([@"reactnativejs" isEqualToString:errorType]) {
        return BSGErrorTypeReactNativeJs;
    } else {
        return BSGErrorTypeCocoa;
    }
}


NSString *_Nonnull BSGParseErrorClass(NSDictionary *error, NSString *errorType) {
    NSString *errorClass;

    if ([errorType isEqualToString:BSGKeyCppException]) {
        errorClass = error[BSGKeyCppException][BSGKeyName];
    } else if ([errorType isEqualToString:BSGKeyMach]) {
        errorClass = error[BSGKeyMach][BSGKeyExceptionName];
    } else if ([errorType isEqualToString:BSGKeySignal]) {
        errorClass = error[BSGKeySignal][BSGKeyName];
    } else if ([errorType isEqualToString:@"nsexception"]) {
        errorClass = error[@"nsexception"][BSGKeyName];
    } else if ([errorType isEqualToString:BSGKeyUser]) {
        errorClass = error[@"user_reported"][BSGKeyName];
    }

    if (!errorClass) { // use a default value
        errorClass = @"Exception";
    }
    return errorClass;
}

NSString *BSGParseErrorMessage(NSDictionary *report, NSDictionary *error, NSString *errorType) {
    if ([errorType isEqualToString:BSGKeyMach] || error[BSGKeyReason] == nil) {
        NSString *diagnosis = [report valueForKeyPath:@"crash.diagnosis"];
        if (diagnosis && ![diagnosis hasPrefix:@"No diagnosis"]) {
            return [[diagnosis componentsSeparatedByString:@"\n"] firstObject];
        }
    }
    return error[BSGKeyReason] ?: @"";
}

@implementation BugsnagError

- (instancetype)initWithErrorReportingThread:(BugsnagThread *)thread {
    return [self initWithEvent:@{} errorReportingThread:thread];
}

- (instancetype)initWithEvent:(NSDictionary *)event errorReportingThread:(BugsnagThread *)thread {
    if (self = [super init]) {
        NSDictionary *error = [event valueForKeyPath:@"crash.error"];
        NSString *errorType = error[BSGKeyType];
        _errorClass = BSGParseErrorClass(error, errorType);
        _errorMessage = BSGParseErrorMessage(event, error, errorType);
        _type = BSGErrorTypeCocoa;

        if (![[event valueForKeyPath:@"user.state.didOOM"] boolValue]) {
            _stacktrace = thread.stacktrace;
        }
    }
    return self;
}

- (instancetype)initWithErrorClass:(NSString *)errorClass
                      errorMessage:(NSString *)errorMessage
                         errorType:(BSGErrorType)errorType
                        stacktrace:(NSArray<BugsnagStackframe *> *)stacktrace {
    if (self = [super init]) {
        _errorClass = errorClass;
        _errorMessage = errorMessage;
        _type = errorType;
        _stacktrace = stacktrace;
    }
    return self;
}

+ (BugsnagError *)errorFromJson:(NSDictionary *)json {
    NSArray *trace = json[BSGKeyStacktrace];
    NSMutableArray *data = [NSMutableArray new];

    if (trace != nil) {
        for (NSDictionary *dict in trace) {
            BugsnagStackframe *frame = [BugsnagStackframe frameFromJson:dict];

            if (frame != nil) {
                [data addObject:frame];
            }
        }
    }
    BugsnagError *error = [[BugsnagError alloc] initWithErrorClass:json[BSGKeyErrorClass]
                                                      errorMessage:json[BSGKeyMessage]
                                                         errorType:BSGParseErrorType(json[BSGKeyType])
                                                        stacktrace:data];
    return error;
}

- (void)updateWithCrashInfoMessage:(NSString *)crashInfoMessage {
    NSArray<NSString *> *patterns = @[
        // From Swift 2.2: https://github.com/apple/swift/blob/swift-2.2-RELEASE/stdlib/public/stubs/Assert.cpp#L24-L39
        @"^(assertion failed|fatal error|precondition failed): ((.+): )?file .+, line \\d+\n$",
        // From Swift 4.1: https://github.com/apple/swift/commit/d03a575279cf5c523779ef68f8d7903f09ba901e
        @"^(Assertion failed|Fatal error|Precondition failed): ((.+): )?file .+, line \\d+\n$",
        // From Swift 5.4: https://github.com/apple/swift/commit/1a051719e3b1b7c37a856684dd037d482fef8e59
        @"^.+:\\d+: (Assertion failed|Fatal error|Precondition failed)(: (.+))?\n$",
    ];
    
    for (NSString *pattern in patterns) {
        NSArray<NSTextCheckingResult *> *matches = nil;
        @try {
            NSRegularExpression *regex = [[NSRegularExpression alloc] initWithPattern:pattern options:0 error:nil];
            matches = [regex matchesInString:crashInfoMessage options:0 range:NSMakeRange(0, crashInfoMessage.length)];
        } @catch (NSException *exception) {
            bsg_log_err(@"Exception thrown while parsing crash info message: %@", exception);
        }
        if (matches.count != 1 || matches[0].numberOfRanges != 4) {
            continue;
        }
        NSRange errorClassRange = [matches[0] rangeAtIndex:1];
        if (errorClassRange.location != NSNotFound) {
            self.errorClass = [crashInfoMessage substringWithRange:errorClassRange];
        }
        NSRange errorMessageRange = [matches[0] rangeAtIndex:3];
        if (errorMessageRange.location != NSNotFound) {
            self.errorMessage = [crashInfoMessage substringWithRange:errorMessageRange];
        }
        return; //!OCLint
    }
    
    if (!self.errorMessage.length) {
        // It's better to fall back to the raw string than have an empty errorMessage.
        self.errorMessage = crashInfoMessage;
    }
}

- (NSDictionary *)findErrorReportingThread:(NSDictionary *)event {
    NSArray *threads = [event valueForKeyPath:@"crash.threads"];

    for (NSDictionary *thread in threads) {
        if ([thread[@"crashed"] boolValue]) {
            return thread;
        }
    }
    return nil;
}

- (NSDictionary *)toDictionary {
    NSMutableDictionary *dict = [NSMutableDictionary new];
    dict[BSGKeyErrorClass] = self.errorClass;
    dict[BSGKeyMessage] = self.errorMessage;
    dict[BSGKeyType] = BSGSerializeErrorType(self.type);

    NSMutableArray *frames = [NSMutableArray new];
    for (BugsnagStackframe *frame in self.stacktrace) {
        [frames addObject:[frame toDictionary]];
    }

    dict[BSGKeyStacktrace] = frames;
    return dict;
}

@end
