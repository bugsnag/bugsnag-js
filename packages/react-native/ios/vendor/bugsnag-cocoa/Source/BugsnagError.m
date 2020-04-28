//
//  BugsnagError.m
//  Bugsnag
//
//  Created by Jamie Lynch on 01/04/2020.
//  Copyright © 2020 Bugsnag. All rights reserved.
//

#import "BugsnagError.h"
#import "BugsnagKeys.h"
#import "BugsnagStackframe.h"
#import "BugsnagStacktrace.h"
#import "BugsnagCollections.h"
#import "RegisterErrorData.h"
#import "BugsnagThread.h"

NSString *_Nonnull BSGSerializeErrorType(BSGErrorType errorType) {
    switch (errorType) {
        case BSGErrorTypeCocoa:
            return @"cocoa";
        case BSGErrorTypeC:
            return @"c";
        case BSGErrorTypeReactNativeJs:
            return @"reactnativejs";
        default:
            return nil;
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

@interface BugsnagStackframe ()
- (NSDictionary *)toDictionary;
@end

@interface BugsnagStacktrace ()
@property NSMutableArray<BugsnagStackframe *> *trace;
@end

@implementation BugsnagError

- (instancetype)initWithEvent:(NSDictionary *)event errorReportingThread:(BugsnagThread *)thread {
    if (self = [super init]) {
        NSDictionary *error = [event valueForKeyPath:@"crash.error"];
        NSString *errorType = error[BSGKeyType];
        _errorClass = BSGParseErrorClass(error, errorType);
        _errorMessage = BSGParseErrorMessage(event, error, errorType);
        _type = BSGErrorTypeCocoa;

        if (![[event valueForKeyPath:@"user.state.didOOM"] boolValue]) {
            NSArray *threadDict = [event valueForKeyPath:@"crash.threads"];
            RegisterErrorData *data = [RegisterErrorData errorDataFromThreads:threadDict];
            if (data) {
                _errorClass = data.errorClass;
                _errorMessage = data.errorMessage;
            }
            _stacktrace = thread.stacktrace;
        }
    }
    return self;
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
    BSGDictInsertIfNotNil(dict, self.errorClass, BSGKeyErrorClass);
    BSGDictInsertIfNotNil(dict, self.errorMessage, BSGKeyMessage);
    BSGDictInsertIfNotNil(dict, BSGSerializeErrorType(self.type), BSGKeyType);

    NSMutableArray *frames = [NSMutableArray new];
    for (BugsnagStackframe *frame in self.stacktrace) {
        [frames addObject:[frame toDictionary]];
    }

    BSGDictSetSafeObject(dict, frames, BSGKeyStacktrace);
    return dict;
}

@end
