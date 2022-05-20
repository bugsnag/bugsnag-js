//
//  BugsnagThread.m
//  Bugsnag
//
//  Created by Jamie Lynch on 01/04/2020.
//  Copyright © 2020 Bugsnag. All rights reserved.
//

#import "BugsnagThread+Private.h"

#import "BSGKeys.h"
#import "BSG_KSBacktrace_Private.h"
#import "BSG_KSCrashReportFields.h"
#import "BSG_KSCrashSentry_Private.h"
#import "BSG_KSMach.h"
#import "BugsnagCollections.h"
#import "BugsnagStackframe+Private.h"
#import "BugsnagStacktrace.h"
#import "BugsnagThread+Private.h"
#import "BSG_KSCrashNames.h"

#include <pthread.h>

// Protect access to thread-unsafe bsg_kscrashsentry_suspendThreads()
static pthread_mutex_t bsg_suspend_threads_mutex = PTHREAD_MUTEX_INITIALIZER;

static void suspend_threads() {
    pthread_mutex_lock(&bsg_suspend_threads_mutex);
    bsg_kscrashsentry_suspendThreads();
}

static void resume_threads() {
    bsg_kscrashsentry_resumeThreads();
    pthread_mutex_unlock(&bsg_suspend_threads_mutex);
}

static NSString * thread_state_name(integer_t threadState) {
    const char* stateCName = bsg_kscrashthread_state_name(threadState);
    return stateCName ? [NSString stringWithUTF8String:stateCName] : nil;
}

#define kMaxAddresses 150 // same as BSG_kMaxBacktraceDepth

struct backtrace_t {
    NSUInteger length;
    uintptr_t addresses[kMaxAddresses];
};

static void backtrace_for_thread(thread_t thread, struct backtrace_t *output) {
    BSG_STRUCT_MCONTEXT_L machineContext = {{0}};
    if (bsg_ksmachthreadState(thread, &machineContext)) {
        output->length = (NSUInteger)bsg_ksbt_backtraceThreadState(&machineContext, output->addresses, 0, kMaxAddresses);
    } else {
        output->length = 0;
    }
}

BSGThreadType BSGParseThreadType(NSString *type) {
    return [@"cocoa" isEqualToString:type] ? BSGThreadTypeCocoa : BSGThreadTypeReactNativeJs;
}

NSString *BSGSerializeThreadType(BSGThreadType type) {
    return type == BSGThreadTypeCocoa ? @"cocoa" : @"reactnativejs";
}

@implementation BugsnagThread

+ (instancetype)threadFromJson:(NSDictionary *)json {
    if (json == nil) {
        return nil;
    }
    NSString *type = json[@"type"];
    BSGThreadType threadType = BSGParseThreadType(type);
    BOOL errorReportingThread = json[@"errorReportingThread"] && [json[@"errorReportingThread"] boolValue];
    NSArray<BugsnagStackframe *> *stacktrace = [BugsnagStacktrace stacktraceFromJson:json[BSGKeyStacktrace]].trace;
    BugsnagThread *thread = [[BugsnagThread alloc] initWithId:json[@"id"]
                                                         name:json[@"name"]
                                         errorReportingThread:errorReportingThread
                                                         type:threadType
                                                        state:json[@"state"]
                                                   stacktrace:stacktrace];
    return thread;
}

- (instancetype)initWithId:(NSString *)id
                      name:(NSString *)name
      errorReportingThread:(BOOL)errorReportingThread
                      type:(BSGThreadType)type
                     state:(NSString *)state
                stacktrace:(NSArray<BugsnagStackframe *> *)stacktrace {
    if ((self = [super init])) {
        _id = id;
        _name = name;
        _errorReportingThread = errorReportingThread;
        _type = type;
        _state = state;
        _stacktrace = stacktrace;
    }
    return self;
}

- (instancetype)initWithThread:(NSDictionary *)thread binaryImages:(NSArray *)binaryImages {
    if ((self = [super init])) {
        _errorReportingThread = [thread[@BSG_KSCrashField_Crashed] boolValue];
        _id = [thread[@BSG_KSCrashField_Index] stringValue];
        _type = BSGThreadTypeCocoa;
        _state = thread[@BSG_KSCrashField_State];
        _crashInfoMessage = [thread[@BSG_KSCrashField_CrashInfoMessage] copy];
        NSArray *backtrace = thread[@BSG_KSCrashField_Backtrace][@BSG_KSCrashField_Contents];
        BugsnagStacktrace *frames = [[BugsnagStacktrace alloc] initWithTrace:backtrace binaryImages:binaryImages];
        _stacktrace = [frames.trace copy];
    }
    return self;
}

- (NSDictionary *)toDictionary {
    NSMutableDictionary *dict = [NSMutableDictionary new];
    dict[@"id"] = self.id;
    dict[@"name"] = self.name;
    dict[@"errorReportingThread"] = @(self.errorReportingThread);
    dict[@"type"] = BSGSerializeThreadType(self.type);
    dict[@"state"] = self.state;
    dict[@"errorReportingThread"] = @(self.errorReportingThread);

    NSMutableArray *array = [NSMutableArray new];
    for (BugsnagStackframe *frame in self.stacktrace) {
        [array addObject:[frame toDictionary]];
    }
    dict[@"stacktrace"] = array;
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
            NSMutableDictionary *mutableFrame = [frame mutableCopy];
            if (seen++ >= depth) {
                // Mark the frame so we know where it came from
                if (seen == 1 && !stackOverflow) {
                    mutableFrame[BSGKeyIsPC] = @YES;
                }
                if (seen == 2 && !stackOverflow && [@[BSGKeySignal, BSGKeyMach] containsObject:errorType]) {
                    mutableFrame[BSGKeyIsLR] = @YES;
                }
                [stacktrace addObject:mutableFrame];
            }
        }
        NSMutableDictionary *mutableBacktrace = [thread[@"backtrace"] mutableCopy];
        mutableBacktrace[@"contents"] = stacktrace;
        NSMutableDictionary *mutableThread = [thread mutableCopy];
        mutableThread[@"backtrace"] = mutableBacktrace;
        return mutableThread;
    }
    return thread;
}

// MARK: - Recording

+ (NSArray<BugsnagThread *> *)allThreads:(BOOL)allThreads callStackReturnAddresses:(NSArray<NSNumber *> *)callStackReturnAddresses {
    struct backtrace_t backtrace;
    backtrace.length = MIN(callStackReturnAddresses.count, kMaxAddresses);
    for (NSUInteger i = 0; i < (NSUInteger)backtrace.length; i++) {
        backtrace.addresses[i] = (uintptr_t)callStackReturnAddresses[i].unsignedLongLongValue;
    }
    if (allThreads) {
        return [BugsnagThread allThreadsWithCurrentThreadBacktrace:&backtrace];
    } else {
        return @[[BugsnagThread currentThreadWithBacktrace:&backtrace]];
    }
}

+ (NSArray<BugsnagThread *> *)allThreadsWithCurrentThreadBacktrace:(struct backtrace_t *)currentThreadBacktrace {
    integer_t *threadStates = NULL;
    unsigned threadCount = 0;

    thread_t *threads = bsg_ksmachgetAllThreads(&threadCount);
    if (threads == NULL) {
        return @[];
    }

    NSMutableArray *objects = [NSMutableArray arrayWithCapacity:threadCount];

    struct backtrace_t *backtraces = calloc(threadCount, sizeof(struct backtrace_t));
    if (!backtraces) {
        goto cleanup;
    }

    threadStates = calloc(threadCount, sizeof(*threadStates));
    if (!threadStates) {
        goto cleanup;
    }
    bsg_ksmachgetThreadStates(threads, threadStates, threadCount);

    suspend_threads();

    // While threads are suspended only async-signal-safe functions should be used,
    // as another threads may have been suspended while holding a lock in malloc,
    // the Objective-C runtime, or other subsystems.

    for (mach_msg_type_number_t i = 0; i < threadCount; i++) {
        BOOL isCurrentThread = MACH_PORT_INDEX(threads[i]) == MACH_PORT_INDEX(bsg_ksmachthread_self());
        if (isCurrentThread) {
            backtraces[i].length = 0; // currentThreadBacktrace will be used instead
        } else {
            backtrace_for_thread(threads[i], &backtraces[i]);
        }
    }

    resume_threads();

    for (mach_msg_type_number_t i = 0; i < threadCount; i++) {
        BOOL isCurrentThread = MACH_PORT_INDEX(threads[i]) == MACH_PORT_INDEX(bsg_ksmachthread_self());
        struct backtrace_t *backtrace = isCurrentThread ? currentThreadBacktrace : &backtraces[i];
        [objects addObject:[[BugsnagThread alloc] initWithMachThread:threads[i]
                                                               state:thread_state_name(threadStates[i])
                                                  backtraceAddresses:backtrace->addresses
                                                     backtraceLength:backtrace->length
                                                errorReportingThread:isCurrentThread
                                                               index:i]];
    }

cleanup:
    bsg_ksmachfreeThreads(threads, threadCount);
    free(backtraces);
    free(threadStates);
    return objects;
}

+ (instancetype)currentThreadWithBacktrace:(struct backtrace_t *)backtrace {
    thread_t selfThread = mach_thread_self();
    NSString *threadState = thread_state_name(bsg_ksmachgetThreadState(selfThread));

    unsigned threadCount = 0;
    thread_t *threads = bsg_ksmachgetAllThreads(&threadCount);
    unsigned threadIndex = 0;
    if (threads != NULL) {
        for (unsigned i = 0; i < threadCount; i++) {
            if (MACH_PORT_INDEX(threads[i]) == MACH_PORT_INDEX(selfThread)) {
                threadIndex = i;
                break;
            }
        }
    }
    bsg_ksmachfreeThreads(threads, threadCount);

    return [[BugsnagThread alloc] initWithMachThread:selfThread
                                               state:threadState
                                  backtraceAddresses:backtrace->addresses
                                     backtraceLength:backtrace->length
                                errorReportingThread:YES
                                               index:threadIndex];
}

+ (nullable instancetype)mainThread {
    unsigned threadCount = 0;
    thread_t *threads = bsg_ksmachgetAllThreads(&threadCount);
    if (threads == NULL) {
        return nil;
    }

    struct backtrace_t backtrace;
    NSString *threadState = nil;
    BugsnagThread *object = nil;

    if (threadCount == 0) {
        goto cleanup;
    }

    thread_t thread = threads[0];
    if (MACH_PORT_INDEX(thread) == MACH_PORT_INDEX(bsg_ksmachthread_self())) {
        goto cleanup;
    }

    threadState = thread_state_name(bsg_ksmachgetThreadState(thread));
    BOOL needsResume = thread_suspend(thread) == KERN_SUCCESS;
    backtrace_for_thread(thread, &backtrace);
    if (needsResume) {
        thread_resume(thread);
    }
    object = [[BugsnagThread alloc] initWithMachThread:thread
                                                 state:threadState
                                    backtraceAddresses:backtrace.addresses
                                       backtraceLength:backtrace.length
                                  errorReportingThread:YES
                                                 index:0];

cleanup:
    bsg_ksmachfreeThreads(threads, threadCount);
    return object;
}

- (instancetype)initWithMachThread:(thread_t)machThread
                             state:(NSString *)state
                backtraceAddresses:(uintptr_t *)backtraceAddresses
                   backtraceLength:(NSUInteger)backtraceLength
              errorReportingThread:(BOOL)errorReportingThread
                             index:(unsigned)index {

    char name[64] = "";
    if (!bsg_ksmachgetThreadName(machThread, name, sizeof(name)) || !name[0]) {
        bsg_ksmachgetThreadQueueName(machThread, name, sizeof(name));
    }

    return [self initWithId:[NSString stringWithFormat:@"%d", index]
                       name:name[0] ? @(name) : nil
       errorReportingThread:errorReportingThread
                       type:BSGThreadTypeCocoa
                      state:state
                 stacktrace:[BugsnagStackframe stackframesWithBacktrace:backtraceAddresses length:backtraceLength]];
}

@end
