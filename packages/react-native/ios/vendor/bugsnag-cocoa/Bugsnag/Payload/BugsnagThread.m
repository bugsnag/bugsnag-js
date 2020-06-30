//
//  BugsnagThread.m
//  Bugsnag
//
//  Created by Jamie Lynch on 01/04/2020.
//  Copyright © 2020 Bugsnag. All rights reserved.
//

#import "BugsnagThread.h"
#import "BugsnagCollections.h"
#import "BugsnagStackframe.h"
#import "BugsnagStacktrace.h"
#import "BugsnagKeys.h"

BSGThreadType BSGParseThreadType(NSString *type) {
    return [@"cocoa" isEqualToString:type] ? BSGThreadTypeCocoa : BSGThreadTypeReactNativeJs;
}

NSString *BSGSerializeThreadType(BSGThreadType type) {
    return type == BSGThreadTypeCocoa ? @"cocoa" : @"reactnativejs";
}

@interface BugsnagStacktrace ()
- (NSArray *)toArray;
@end

@interface BugsnagStacktrace ()
+ (instancetype)stacktraceFromJson:(NSDictionary *)json;
@property NSMutableArray<BugsnagStackframe *> *trace;
@end

@interface BugsnagStackframe ()
- (NSDictionary *)toDictionary;
@end

@implementation BugsnagThread

+ (instancetype)threadFromJson:(NSDictionary *)json {
    if (json == nil) {
        return nil;
    }
    NSString *type = json[@"type"];
    BSGThreadType threadType = BSGParseThreadType(type);
    BOOL errorReportingThread = json[@"errorReportingThread"] && [json[@"errorReportingThread"] boolValue];
    BugsnagStacktrace *stacktrace = [BugsnagStacktrace stacktraceFromJson:json[BSGKeyStacktrace]];
    BugsnagThread *thread = [[BugsnagThread alloc] initWithId:json[@"id"]
                                                         name:json[@"name"]
                                         errorReportingThread:errorReportingThread
                                                         type:threadType
                                                        trace:stacktrace];
    return thread;
}

- (instancetype)initWithId:(NSString *)id
                      name:(NSString *)name
      errorReportingThread:(BOOL)errorReportingThread
                      type:(BSGThreadType)type
                     trace:(BugsnagStacktrace *)trace {
    if (self = [super init]) {
        _id = id;
        _name = name;
        _errorReportingThread = errorReportingThread;
        _type = type;
        _stacktrace = trace.trace;
    }
    return self;
}

- (instancetype)initWithThread:(NSDictionary *)thread binaryImages:(NSArray *)binaryImages {
    if (self = [super init]) {
        _errorReportingThread = [thread[@"crashed"] boolValue];
        self.id = [thread[@"index"] stringValue];
        self.type = BSGThreadTypeCocoa;

        NSArray *backtrace = thread[@"backtrace"][@"contents"];
        BugsnagStacktrace *frames = [[BugsnagStacktrace alloc] initWithTrace:backtrace binaryImages:binaryImages];
        self.stacktrace = frames.trace;
    }
    return self;
}

- (NSDictionary *)toDictionary {
    NSMutableDictionary *dict = [NSMutableDictionary new];
    BSGDictInsertIfNotNil(dict, self.id, @"id");
    BSGDictInsertIfNotNil(dict, self.name, @"name");
    BSGDictSetSafeObject(dict, @(self.errorReportingThread), @"errorReportingThread");
    BSGDictSetSafeObject(dict, BSGSerializeThreadType(self.type), @"type");
    BSGDictSetSafeObject(dict, @(self.errorReportingThread), @"errorReportingThread");

    NSMutableArray *array = [NSMutableArray new];
    for (BugsnagStackframe *frame in self.stacktrace) {
        [array addObject:[frame toDictionary]];
    }
    BSGDictSetSafeObject(dict, array, @"stacktrace");
    return dict;
}

/**
 * Converts bugsnag threads to JSON
 */
+ (NSMutableArray *)serializeThreads:(NSArray<BugsnagThread *> *)threads {
    NSMutableArray *threadArray = [NSMutableArray new];
    for (BugsnagThread *thread in threads) {
        [threadArray addObject:[thread toDictionary]];
    }
    return threadArray;
}

/**
 * Deerializes Bugsnag Threads from a KSCrash report
 */
+ (NSMutableArray<BugsnagThread *> *)threadsFromArray:(NSArray *)threads
                                         binaryImages:(NSArray *)binaryImages
                                                depth:(NSUInteger)depth
                                            errorType:(NSString *)errorType {
    NSMutableArray *bugsnagThreads = [NSMutableArray new];

    for (NSDictionary *thread in threads) {
        NSDictionary *threadInfo = [self enhanceThreadInfo:thread depth:depth errorType:errorType];
        BugsnagThread *obj = [[BugsnagThread alloc] initWithThread:threadInfo binaryImages:binaryImages];
        [bugsnagThreads addObject:obj];
    }
    return bugsnagThreads;
}

/**
 * Enhances the thread information recorded by KSCrash. Specifically, this will trim the error reporting thread frames
 * by the `depth` configured, and add information to each frame indicating whether they
 * are within the program counter/link register.
 *
 * The error reporting thread is the thread on which the error occurred, and is given more
 * prominence in the Bugsnag Dashboard - therefore we enhance it with extra info.
 *
 * @param thread the captured thread
 * @param depth the 'depth'. This is equivalent to the number of frames which should be discarded from a report,
 * and is configurable by the user.
 * @param errorType the type of error as recorded by KSCrash (e.g. mach, signal)
 * @return the enhanced thread information
 */
+ (NSDictionary *)enhanceThreadInfo:(NSDictionary *)thread
                              depth:(NSUInteger)depth
                          errorType:(NSString *)errorType {
    NSArray *backtrace = thread[@"backtrace"][@"contents"];
    BOOL isReportingThread = [thread[@"crashed"] boolValue];

    if (isReportingThread) {
        BOOL stackOverflow = [thread[@"stack"][@"overflow"] boolValue];
        NSUInteger seen = 0;
        NSMutableArray *stacktrace = [NSMutableArray array];

        for (NSDictionary *frame in backtrace) {
            NSMutableDictionary *mutableFrame = (NSMutableDictionary *) [frame mutableCopy];
            if (seen++ >= depth) {
                // Mark the frame so we know where it came from
                if (seen == 1 && !stackOverflow) {
                    BSGDictSetSafeObject(mutableFrame, @YES, BSGKeyIsPC);
                }
                if (seen == 2 && !stackOverflow && [@[BSGKeySignal, BSGKeyMach] containsObject:errorType]) {
                    BSGDictSetSafeObject(mutableFrame, @YES, BSGKeyIsLR);
                }
                BSGArrayInsertIfNotNil(stacktrace, mutableFrame);
            }
        }
        NSMutableDictionary *copy = [NSMutableDictionary dictionaryWithDictionary:thread];
        copy[@"backtrace"] = [NSMutableDictionary dictionaryWithDictionary:copy[@"backtrace"]];
        copy[@"backtrace"][@"contents"] = stacktrace;
        return copy;
    }
    return thread;
}

@end
