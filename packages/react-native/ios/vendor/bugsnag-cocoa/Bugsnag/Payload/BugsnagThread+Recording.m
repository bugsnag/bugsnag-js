//
//  BugsnagThread+Recording.m
//  Bugsnag
//
//  Created by Nick Dowell on 05/02/2021.
//  Copyright © 2021 Bugsnag Inc. All rights reserved.
//

#import "BugsnagThread+Recording.h"

#import "BugsnagStackframe+Private.h"
#import "BugsnagThread+Private.h"

#include "BSG_KSBacktrace_Private.h"
#include "BSG_KSCrashSentry_User.h"
#include "BSG_KSMach.h"


#define kMaxAddresses 150 // same as BSG_kMaxBacktraceDepth

struct backtrace_t {
    int length;
    uintptr_t addresses[kMaxAddresses];
};

static void backtrace_for_thread(thread_t thread, struct backtrace_t *output) {
    BSG_STRUCT_MCONTEXT_L machineContext = {0};
    if (bsg_ksmachthreadState(thread, &machineContext)) {
        output->length = bsg_ksbt_backtraceThreadState(&machineContext, output->addresses, 0, kMaxAddresses);
    } else {
        output->length = 0;
    }
}


// MARK: -

@implementation BugsnagThread (Recording)

+ (NSArray<BugsnagThread *> *)allThreads:(BOOL)allThreads callStackReturnAddresses:(NSArray<NSNumber *> *)callStackReturnAddresses {
    struct backtrace_t backtrace;
    backtrace.length = (int)MIN(callStackReturnAddresses.count, kMaxAddresses);
    for (int i = 0; i < backtrace.length; i++) {
        backtrace.addresses[i] = (uintptr_t)callStackReturnAddresses[i].unsignedLongLongValue;
    }
    if (allThreads) {
        return [BugsnagThread allThreadsWithCurrentThreadBacktrace:&backtrace];
    } else {
        return @[[BugsnagThread currentThreadWithBacktrace:&backtrace]];
    }
}

+ (NSArray<BugsnagThread *> *)allThreadsWithCurrentThreadBacktrace:(struct backtrace_t *)currentThreadBacktrace {
    thread_t *threads = NULL;
    mach_msg_type_number_t threadCount = 0;
    
    bsg_kscrashsentry_suspend_threads_user();
    
    // While threads are suspended only async-signal-safe functions should be used,
    // as another threads may have been suspended while holding a lock in malloc,
    // the Objective-C runtime, or other subsystems.
    
    if (task_threads(mach_task_self(), &threads, &threadCount) != KERN_SUCCESS) {
        bsg_kscrashsentry_resume_threads_user(false);
        return @[];
    }
    
    struct backtrace_t backtraces[threadCount];
    
    for (int i = 0; i < threadCount; i++) {
        BOOL isCurrentThread = MACH_PORT_INDEX(threads[i]) == MACH_PORT_INDEX(bsg_ksmachthread_self());
        if (isCurrentThread) {
            backtraces[i].length = 0; // currentThreadBacktrace will be used instead
        } else {
            backtrace_for_thread(threads[i], &backtraces[i]);
        }
    }
    
    bsg_kscrashsentry_resume_threads_user(false);
    
    NSMutableArray *objects = [NSMutableArray arrayWithCapacity:threadCount];
    
    for (int i = 0; i < threadCount; i++) {
        BOOL isCurrentThread = MACH_PORT_INDEX(threads[i]) == MACH_PORT_INDEX(bsg_ksmachthread_self());
        struct backtrace_t *backtrace = isCurrentThread ? currentThreadBacktrace : &backtraces[i];
        [objects addObject:[[BugsnagThread alloc] initWithMachThread:threads[i]
                                                  backtraceAddresses:backtrace->addresses
                                                     backtraceLength:backtrace->length
                                                errorReportingThread:isCurrentThread
                                                               index:i]];
    }
    
    for (int i = 0; i < threadCount; i++) {
        mach_port_deallocate(mach_task_self(), threads[i]);
    }
    vm_deallocate(mach_task_self(), (vm_address_t)threads, sizeof(thread_t) * threadCount);
    
    return objects;
}

+ (instancetype)currentThreadWithBacktrace:(struct backtrace_t *)backtrace {
    thread_t thread = mach_thread_self();
    thread_t *threads = NULL;
    mach_msg_type_number_t threadCount = 0;
    int threadIndex = 0;
    if (task_threads(mach_task_self(), &threads, &threadCount) == KERN_SUCCESS) {
        for (int i = 0; i < threadCount; i++) {
            if (MACH_PORT_INDEX(threads[i]) == MACH_PORT_INDEX(thread)) {
                threadIndex = i;
            }
            mach_port_deallocate(mach_task_self(), threads[i]);
        }
        vm_deallocate(mach_task_self(), (vm_address_t)threads, sizeof(thread_t) * threadCount);
    }
    BugsnagThread *object = [[BugsnagThread alloc] initWithMachThread:thread
                                                   backtraceAddresses:backtrace->addresses
                                                      backtraceLength:backtrace->length
                                                 errorReportingThread:YES
                                                                index:threadIndex];
    mach_port_deallocate(mach_task_self(), thread);
    return object;
}

+ (nullable instancetype)mainThread {
    thread_t *threads = NULL;
    mach_msg_type_number_t threadCount = 0;
    if (task_threads(mach_task_self(), &threads, &threadCount) != KERN_SUCCESS) {
        return nil;
    }
    
    BugsnagThread *object = nil;
    if (threadCount) {
        thread_t thread = threads[0];
        if (MACH_PORT_INDEX(thread) == MACH_PORT_INDEX(bsg_ksmachthread_self())) {
            return nil;
        }
        struct backtrace_t backtrace;
        BOOL needsResume = NO;
        needsResume = thread_suspend(thread) == KERN_SUCCESS;
        backtrace_for_thread(thread, &backtrace);
        if (needsResume) {
            thread_resume(thread);
        }
        object = [[BugsnagThread alloc] initWithMachThread:thread
                                        backtraceAddresses:backtrace.addresses
                                           backtraceLength:backtrace.length
                                      errorReportingThread:YES
                                                     index:0];
    }
    
    for (int i = 0; i < threadCount; i++) {
        mach_port_deallocate(mach_task_self(), threads[i]);
    }
    vm_deallocate(mach_task_self(), (vm_address_t)threads, sizeof(thread_t) * threadCount);
    
    return object;
}

- (instancetype)initWithMachThread:(thread_t)machThread
                backtraceAddresses:(uintptr_t *)backtraceAddresses
                   backtraceLength:(int)backtraceLength
              errorReportingThread:(BOOL)errorReportingThread
                             index:(int)index {
    
    char name[64] = "";
    if (!bsg_ksmachgetThreadName(machThread, name, sizeof(name)) || !name[0]) {
        bsg_ksmachgetThreadQueueName(machThread, name, sizeof(name));
    }
    
    return [self initWithId:[NSString stringWithFormat:@"%d", index]
                       name:name[0] ? @(name) : nil
       errorReportingThread:errorReportingThread
                       type:BSGThreadTypeCocoa
                 stacktrace:[BugsnagStackframe stackframesWithBacktrace:backtraceAddresses length:backtraceLength]];
}

@end
