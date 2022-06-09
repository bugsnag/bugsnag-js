//
//  KSMach.c
//
//  Created by Karl Stenerud on 2012-01-29.
//
//  Copyright (c) 2012 Karl Stenerud. All rights reserved.
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

#include "BSG_KSMach.h"

#include "BSG_KSMachApple.h"
#include "BSGDefines.h"

//#define BSG_KSLogger_LocalLevel TRACE
#include "BSG_KSLogger.h"

#include <errno.h>
#include <mach-o/arch.h>
#include <mach/mach_time.h>
#include <sys/sysctl.h>

#if __has_include(<os/proc.h>) && TARGET_OS_IPHONE && !TARGET_OS_MACCATALYST
#include <os/proc.h>
#endif

// Avoiding static functions due to linker issues.

/** Get the current VM stats.
 *
 * @param vmStats Gets filled with the VM stats.
 *
 * @param pageSize gets filled with the page size.
 *
 * @return true if the operation was successful.
 */
bool bsg_ksmachi_VMStats(vm_statistics_data_t *const vmStats,
                         vm_size_t *const pageSize);

static pthread_t bsg_g_topThread;

// ============================================================================
#pragma mark - General Information -
// ============================================================================

/**
 * A pointer to `os_proc_available_memory` if it is available and usable.
 *
 * We cannot use the `__builtin_available` check at runtime because its
 * implementation uses malloc() which is not async-signal-safe and can result in
 * a deadlock if called from a crash handler or while threads are suspended.
 */
static size_t (* get_available_memory)(void);

static void bsg_ksmachfreeMemory_init(void) {
#if __has_include(<os/proc.h>) && TARGET_OS_IPHONE && !TARGET_OS_MACCATALYST
    if (__builtin_available(iOS 13.0, tvOS 13.0, watchOS 6.0, *)) {
        // Only use `os_proc_available_memory` if it appears to be working.
        // 0 is returned if the calling process is not an app or is running
        // on a Simulator, and may also erroneously be returned by some early
        // implementations like iOS 13.0.
        if (os_proc_available_memory()) {
            get_available_memory = os_proc_available_memory;
        }
    }
#endif
}

uint64_t bsg_ksmachfreeMemory(void) {
    if (get_available_memory) {
        return get_available_memory();
    }
    vm_statistics_data_t vmStats;
    vm_size_t pageSize;
    if (bsg_ksmachi_VMStats(&vmStats, &pageSize)) {
        return ((uint64_t)pageSize) * vmStats.free_count;
    }
    return 0;
}

const char *bsg_ksmachcurrentCPUArch(void) {
    const NXArchInfo *archInfo = NXGetLocalArchInfo();
    return archInfo == NULL ? NULL : archInfo->name;
}

#define RETURN_NAME_FOR_ENUM(A)                                                \
    case A:                                                                    \
        return #A

const char *bsg_ksmachexceptionName(const exception_type_t exceptionType) {
    switch (exceptionType) {
        RETURN_NAME_FOR_ENUM(EXC_BAD_ACCESS);
        RETURN_NAME_FOR_ENUM(EXC_BAD_INSTRUCTION);
        RETURN_NAME_FOR_ENUM(EXC_ARITHMETIC);
        RETURN_NAME_FOR_ENUM(EXC_EMULATION);
        RETURN_NAME_FOR_ENUM(EXC_SOFTWARE);
        RETURN_NAME_FOR_ENUM(EXC_BREAKPOINT);
        RETURN_NAME_FOR_ENUM(EXC_SYSCALL);
        RETURN_NAME_FOR_ENUM(EXC_MACH_SYSCALL);
        RETURN_NAME_FOR_ENUM(EXC_RPC_ALERT);
        RETURN_NAME_FOR_ENUM(EXC_CRASH);
    }
    return NULL;
}

const char *bsg_ksmachkernelReturnCodeName(const kern_return_t returnCode) {
    switch (returnCode) {
        RETURN_NAME_FOR_ENUM(KERN_SUCCESS);
        RETURN_NAME_FOR_ENUM(KERN_INVALID_ADDRESS);
        RETURN_NAME_FOR_ENUM(KERN_PROTECTION_FAILURE);
        RETURN_NAME_FOR_ENUM(KERN_NO_SPACE);
        RETURN_NAME_FOR_ENUM(KERN_INVALID_ARGUMENT);
        RETURN_NAME_FOR_ENUM(KERN_FAILURE);
        RETURN_NAME_FOR_ENUM(KERN_RESOURCE_SHORTAGE);
        RETURN_NAME_FOR_ENUM(KERN_NOT_RECEIVER);
        RETURN_NAME_FOR_ENUM(KERN_NO_ACCESS);
        RETURN_NAME_FOR_ENUM(KERN_MEMORY_FAILURE);
        RETURN_NAME_FOR_ENUM(KERN_MEMORY_ERROR);
        RETURN_NAME_FOR_ENUM(KERN_ALREADY_IN_SET);
        RETURN_NAME_FOR_ENUM(KERN_NOT_IN_SET);
        RETURN_NAME_FOR_ENUM(KERN_NAME_EXISTS);
        RETURN_NAME_FOR_ENUM(KERN_ABORTED);
        RETURN_NAME_FOR_ENUM(KERN_INVALID_NAME);
        RETURN_NAME_FOR_ENUM(KERN_INVALID_TASK);
        RETURN_NAME_FOR_ENUM(KERN_INVALID_RIGHT);
        RETURN_NAME_FOR_ENUM(KERN_INVALID_VALUE);
        RETURN_NAME_FOR_ENUM(KERN_UREFS_OVERFLOW);
        RETURN_NAME_FOR_ENUM(KERN_INVALID_CAPABILITY);
        RETURN_NAME_FOR_ENUM(KERN_RIGHT_EXISTS);
        RETURN_NAME_FOR_ENUM(KERN_INVALID_HOST);
        RETURN_NAME_FOR_ENUM(KERN_MEMORY_PRESENT);
        RETURN_NAME_FOR_ENUM(KERN_MEMORY_DATA_MOVED);
        RETURN_NAME_FOR_ENUM(KERN_MEMORY_RESTART_COPY);
        RETURN_NAME_FOR_ENUM(KERN_INVALID_PROCESSOR_SET);
        RETURN_NAME_FOR_ENUM(KERN_POLICY_LIMIT);
        RETURN_NAME_FOR_ENUM(KERN_INVALID_POLICY);
        RETURN_NAME_FOR_ENUM(KERN_INVALID_OBJECT);
        RETURN_NAME_FOR_ENUM(KERN_ALREADY_WAITING);
        RETURN_NAME_FOR_ENUM(KERN_DEFAULT_SET);
        RETURN_NAME_FOR_ENUM(KERN_EXCEPTION_PROTECTED);
        RETURN_NAME_FOR_ENUM(KERN_INVALID_LEDGER);
        RETURN_NAME_FOR_ENUM(KERN_INVALID_MEMORY_CONTROL);
        RETURN_NAME_FOR_ENUM(KERN_INVALID_SECURITY);
        RETURN_NAME_FOR_ENUM(KERN_NOT_DEPRESSED);
        RETURN_NAME_FOR_ENUM(KERN_TERMINATED);
        RETURN_NAME_FOR_ENUM(KERN_LOCK_SET_DESTROYED);
        RETURN_NAME_FOR_ENUM(KERN_LOCK_UNSTABLE);
        RETURN_NAME_FOR_ENUM(KERN_LOCK_OWNED);
        RETURN_NAME_FOR_ENUM(KERN_LOCK_OWNED_SELF);
        RETURN_NAME_FOR_ENUM(KERN_SEMAPHORE_DESTROYED);
        RETURN_NAME_FOR_ENUM(KERN_RPC_SERVER_TERMINATED);
        RETURN_NAME_FOR_ENUM(KERN_RPC_TERMINATE_ORPHAN);
        RETURN_NAME_FOR_ENUM(KERN_RPC_CONTINUE_ORPHAN);
        RETURN_NAME_FOR_ENUM(KERN_NOT_SUPPORTED);
        RETURN_NAME_FOR_ENUM(KERN_NODE_DOWN);
        RETURN_NAME_FOR_ENUM(KERN_NOT_WAITING);
        RETURN_NAME_FOR_ENUM(KERN_OPERATION_TIMED_OUT);
        RETURN_NAME_FOR_ENUM(KERN_CODESIGN_ERROR);
        // Note: these are only valid for EXC_BAD_ACCESS
        RETURN_NAME_FOR_ENUM(EXC_ARM_DA_ALIGN);
        RETURN_NAME_FOR_ENUM(EXC_ARM_DA_DEBUG);
        RETURN_NAME_FOR_ENUM(EXC_ARM_SP_ALIGN);
        RETURN_NAME_FOR_ENUM(EXC_ARM_SWP);
    }
    return NULL;
}

// ============================================================================
#pragma mark - Thread State Info -
// ============================================================================

#if BSG_HAVE_MACH_THREADS
bool bsg_ksmachfillState(const thread_t thread, const thread_state_t state,
                         const thread_state_flavor_t flavor,
                         const mach_msg_type_number_t stateCount) {
    mach_msg_type_number_t stateCountBuff = stateCount;
    kern_return_t kr;

    kr = thread_get_state(thread, flavor, state, &stateCountBuff);
    if (kr != KERN_SUCCESS) {
        // When running under Rosetta 2, thread_get_state() sometimes fails
        // with MACH_SEND_INVALID_DEST and returns no data.
        BSG_KSLOG_ERROR("thread_get_state: %s", mach_error_string(kr));
        return false;
    }
    return true;
}
#endif

void bsg_ksmach_init(void) {
    static volatile sig_atomic_t initialized = 0;
    if (!initialized) {
        kern_return_t kr;
        const task_t thisTask = mach_task_self();
        thread_act_array_t threads;
        mach_msg_type_number_t numThreads;

        if ((kr = task_threads(thisTask, &threads, &numThreads)) !=
            KERN_SUCCESS) {
            BSG_KSLOG_ERROR("task_threads: %s", mach_error_string(kr));
#if !BSG_KSLOG_PRINTS_AT_LEVEL(BSG_KSLogger_Level_Error)
            (void)kr;
#endif
            return;
        }

        bsg_g_topThread = pthread_from_mach_thread_np(threads[0]);

        for (mach_msg_type_number_t i = 0; i < numThreads; i++) {
            mach_port_deallocate(thisTask, threads[i]);
        }
        vm_deallocate(thisTask, (vm_address_t)threads,
                      sizeof(thread_t) * numThreads);
        
        bsg_ksmachfreeMemory_init();
        
        initialized = true;
    }
}

thread_t bsg_ksmachthread_self() {
    thread_t thread_self = mach_thread_self();
    mach_port_deallocate(mach_task_self(), thread_self);
    return thread_self;
}

thread_t bsg_ksmachmachThreadFromPThread(const pthread_t pthread) {
    const internal_pthread_t threadStruct = (internal_pthread_t)pthread;
    thread_t machThread = 0;
    if (bsg_ksmachcopyMem(&threadStruct->kernel_thread, &machThread,
                          sizeof(machThread)) != KERN_SUCCESS) {
        BSG_KSLOG_TRACE("Could not copy mach thread from %u",
                        threadStruct->kernel_thread);
        return 0;
    }
    return machThread;
}

pthread_t bsg_ksmachpthreadFromMachThread(const thread_t thread) {
    internal_pthread_t threadStruct = (internal_pthread_t)bsg_g_topThread;
    thread_t machThread = 0;

    for (int i = 0; i < 50; i++) {
        if (bsg_ksmachcopyMem(&threadStruct->kernel_thread, &machThread,
                              sizeof(machThread)) != KERN_SUCCESS) {
            break;
        }
        if (machThread == thread) {
            return (pthread_t)threadStruct;
        }

        if (bsg_ksmachcopyMem(&threadStruct->plist.tqe_next, &threadStruct,
                              sizeof(threadStruct)) != KERN_SUCCESS) {
            break;
        }
    }
    return 0;
}

bool bsg_ksmachgetThreadName(const thread_t thread, char *const buffer,
                             size_t bufLength) {
    // WARNING: This implementation is no longer async-safe!

    const pthread_t pthread = pthread_from_mach_thread_np(thread);
    if (pthread == NULL) {
        return false;
    }
    return pthread_getname_np(pthread, buffer, bufLength) == 0;
}

bool bsg_ksmachgetThreadQueueName(const thread_t thread, char *const buffer,
                                  size_t bufLength) {
    // WARNING: This implementation is no longer async-safe!

    integer_t infoBuffer[THREAD_IDENTIFIER_INFO_COUNT] = {0};
    thread_info_t info = infoBuffer;
    mach_msg_type_number_t inOutSize = THREAD_IDENTIFIER_INFO_COUNT;
    kern_return_t kr = 0;

    kr = thread_info(thread, THREAD_IDENTIFIER_INFO, info, &inOutSize);
    if (kr != KERN_SUCCESS) {
        BSG_KSLOG_TRACE("Error getting thread_info with flavor "
                        "THREAD_IDENTIFIER_INFO from mach thread : %s",
                        mach_error_string(kr));
        return false;
    }

    thread_identifier_info_t idInfo = (thread_identifier_info_t)info;
    dispatch_queue_t dispatch_queue = NULL;
    uintptr_t junk = 0;
    // thread_handle shouldn't be 0 also, because
    // identifier_info->dispatch_qaddr =  identifier_info->thread_handle +
    // get_dispatchqueue_offset_from_proc(thread->task->bsd_info);
    if (!idInfo->dispatch_qaddr || !idInfo->thread_handle ||
        // sometimes the queue address is invalid, so avoid dereferencing
        bsg_ksmachcopyMem((const void *)idInfo->dispatch_qaddr, &dispatch_queue,
                          sizeof(dispatch_queue)) != KERN_SUCCESS ||
        // Sometimes dispatch_queue is invalid which causes an EXC_BAD_ACCESS
        // crash in dispatch_queue_get_label(). Check that dispatch_queue can
        // be dereferenced to work around this.
        bsg_ksmachcopyMem((const void *)dispatch_queue, &junk,
                          sizeof(junk)) != KERN_SUCCESS) {
        BSG_KSLOG_TRACE(
            "This thread doesn't have a dispatch queue attached : %u", thread);
        return false;
    }

    // If the thread is being / has recently been destroyed, we can end up with
    // pointers to deallocated memory. Using vm_read_overwrite allows us to
    // avoid crashing in this scenario, but we need to check that the copied
    // data looks like a valid string.
    const void *ptr = dispatch_queue_get_label(dispatch_queue);

    vm_size_t bytesRead = 0;
    // Not using bsg_ksmachcopyMem because it does not return bytesRead
    kr = vm_read_overwrite(mach_task_self(),
                           (vm_address_t)ptr, (vm_size_t)bufLength - 1,
                           (vm_address_t)buffer, &bytesRead);
    if (kr != KERN_SUCCESS) {
        BSG_KSLOG_TRACE("Error while getting dispatch queue name : %p",
                        dispatch_queue);
        buffer[0] = '\0';
        return false;
    }

    buffer[bytesRead] = '\0';

    BSG_KSLOG_TRACE("Dispatch queue name: %s", buffer);

    // Queue label must be a null terminated string.
    size_t iLabel;
    for (iLabel = 0; iLabel < bytesRead; iLabel++) {
        if (buffer[iLabel] < ' ' || buffer[iLabel] > '~') {
            break;
        }
    }
    if (buffer[iLabel] != 0) {
        // Found a non-null, invalid char.
        BSG_KSLOG_TRACE("Queue label contains invalid chars");
        buffer[0] = '\0';
        return false;
    }
    BSG_KSLOG_TRACE("Queue label = %s", buffer);
    return true;
}

integer_t bsg_ksmachgetThreadState(const thread_t thread) {
    integer_t infoBuffer[THREAD_BASIC_INFO_COUNT] = {0};
    thread_info_t info = infoBuffer;
    mach_msg_type_number_t inOutSize = THREAD_BASIC_INFO_COUNT;
    kern_return_t kr = 0;

    kr = thread_info(thread, THREAD_BASIC_INFO, info, &inOutSize);
    if (kr != KERN_SUCCESS) {
        BSG_KSLOG_TRACE("Error getting thread_info with flavor "
                        "THREAD_BASIC_INFO from mach thread : %s",
                        mach_error_string(kr));
        return -1;
    }

    thread_basic_info_t basicInfo = (thread_basic_info_t)info;
    return basicInfo->run_state;
}

// ============================================================================
#pragma mark - Utility -
// ============================================================================

static inline bool isThreadInList(thread_t thread, thread_t *list,
                                  unsigned listCount) {
    for (unsigned i = 0; i < listCount; i++) {
        if (list[i] == thread) {
            return true;
        }
    }
    return false;
}

thread_t *bsg_ksmachgetAllThreads(unsigned *threadCount) {
    kern_return_t kr;
    const task_t thisTask = mach_task_self();
    thread_act_array_t threads;
    mach_msg_type_number_t numThreads;

    if ((kr = task_threads(thisTask, &threads, &numThreads)) != KERN_SUCCESS) {
        BSG_KSLOG_ERROR("task_threads: %s", mach_error_string(kr));
#if !BSG_KSLOG_PRINTS_AT_LEVEL(BSG_KSLogger_Level_Error)
        (void)kr;
#endif
        return NULL;
    }

    *threadCount = numThreads;
    return threads;
}

void bsg_ksmachfreeThreads(thread_t *threads, unsigned threadCount) {
    const task_t thisTask = mach_task_self();
    for (unsigned i = 0; i < threadCount; i++) {
        mach_port_deallocate(thisTask, threads[i]);
    }
    vm_deallocate(thisTask, (vm_address_t)threads,
                  sizeof(*threads) * threadCount);
}

void bsg_ksmachgetThreadStates(thread_t *threads, integer_t *states, unsigned threadCount) {
    for (unsigned i = 0; i < threadCount; i++) {
        states[i] = bsg_ksmachgetThreadState(threads[i]);
    }
}

unsigned bsg_ksmachremoveThreadsFromList(thread_t *srcThreads, unsigned srcThreadCount,
                                         thread_t *omitThreads, unsigned omitThreadsCount,
                                         thread_t *dstThreads, unsigned maxDstThreads) {
    unsigned int iDst = 0;
    for (unsigned iSrc = 0; iSrc < srcThreadCount; iSrc++) {
        if (isThreadInList(srcThreads[iSrc], omitThreads, omitThreadsCount)) {
            continue;
        }
        dstThreads[iDst] = srcThreads[iSrc];
        iDst++;
        if (iDst >= maxDstThreads) {
            break;
        }
    }
    return iDst;
}

#if BSG_HAVE_MACH_THREADS
void bsg_ksmachsuspendThreads(thread_t *threads, unsigned threadsCount) {
    const thread_t thisThread = bsg_ksmachthread_self();
    for (unsigned i = 0; i < threadsCount; i++) {
        thread_t thread = threads[i];
        // IMPORTANT: Never suspend the current thread even if it's in the list!
        if (thread == thisThread) {
            continue;
        }
        kern_return_t kr = thread_suspend(thread);
        if (kr != KERN_SUCCESS) {
            // The thread may have completed running already
            // Don't treat this as a fatal error.
            BSG_KSLOG_DEBUG("thread_suspend (%08x): %s", thread,
                            mach_error_string(kr));
            // Suppress dead store warning when log level > debug
            (void)kr;
        }
    }
}

void bsg_ksmachresumeThreads(thread_t *threads, unsigned threadsCount) {
    const thread_t thisThread = bsg_ksmachthread_self();
    for (unsigned i = 0; i < threadsCount; i++) {
        thread_t thread = threads[i];
        // IMPORTANT: Never resume the current thread even if it's in the list!
        if (thread == thisThread) {
            continue;
        }
        kern_return_t kr = thread_resume(thread);
        if (kr != KERN_SUCCESS) {
            // The thread may have completed running already
            // Don't treat this as a fatal error.
            BSG_KSLOG_DEBUG("thread_resume (%08x): %s", thread,
                            mach_error_string(kr));
            // Suppress dead store warning when log level > debug
            (void)kr;
        }
    }
}
#endif

kern_return_t bsg_ksmachcopyMem(const void *const src, void *const dst,
                                const size_t numBytes) {
    vm_size_t bytesCopied = 0;
    return vm_read_overwrite(mach_task_self(), (vm_address_t)src,
                             (vm_size_t)numBytes, (vm_address_t)dst,
                             &bytesCopied);
}

size_t bsg_ksmachcopyMaxPossibleMem(const void *const src, void *const dst,
                                    const size_t numBytes) {
    const uint8_t *pSrc = src;
    const uint8_t *pSrcMax = (const uint8_t *)src + numBytes;
    const uint8_t *pSrcEnd = (const uint8_t *)src + numBytes;
    uint8_t *pDst = dst;

    size_t bytesCopied = 0;

    // Short-circuit if no memory is readable
    if (bsg_ksmachcopyMem(src, dst, 1) != KERN_SUCCESS) {
        return 0;
    } else if (numBytes <= 1) {
        return numBytes;
    }

    for (;;) {
        ssize_t copyLength = pSrcEnd - pSrc;
        if (copyLength <= 0) {
            break;
        }

        if (bsg_ksmachcopyMem(pSrc, pDst, (size_t)copyLength) == KERN_SUCCESS) {
            bytesCopied += (size_t)copyLength;
            pSrc += copyLength;
            pDst += copyLength;
            pSrcEnd = pSrc + (pSrcMax - pSrc) / 2;
        } else {
            if (copyLength <= 1) {
                break;
            }
            pSrcMax = pSrcEnd;
            pSrcEnd = pSrc + copyLength / 2;
        }
    }
    return bytesCopied;
}

double bsg_ksmachtimeDifferenceInSeconds(const uint64_t endTime,
                                         const uint64_t startTime) {
    // From
    // http://lists.apple.com/archives/perfoptimization-dev/2005/Jan/msg00039.html

    static double conversion = 0;

    if (conversion == 0) {
        mach_timebase_info_data_t info = {0};
        kern_return_t kr = mach_timebase_info(&info);
        if (kr != KERN_SUCCESS) {
            BSG_KSLOG_ERROR("mach_timebase_info: %s", mach_error_string(kr));
            return 0;
        }

        conversion = 1e-9 * (double)info.numer / (double)info.denom;
    }

    return conversion * (double)(endTime - startTime);
}

/** Check if the current process is being traced or not.
 *
 * @return true if we're being traced.
 */
bool bsg_ksmachisBeingTraced(void) {
    struct kinfo_proc procInfo;
    size_t structSize = sizeof(procInfo);
    int mib[] = {CTL_KERN, KERN_PROC, KERN_PROC_PID, getpid()};

    if (sysctl(mib, sizeof(mib) / sizeof(*mib), &procInfo, &structSize, NULL,
               0) != 0) {
        BSG_KSLOG_ERROR("sysctl: %s", strerror(errno));
        return false;
    }

    return (procInfo.kp_proc.p_flag & P_TRACED) != 0;
}

// ============================================================================
#pragma mark - (internal) -
// ============================================================================

bool bsg_ksmachi_VMStats(vm_statistics_data_t *const vmStats,
                         vm_size_t *const pageSize) {
    kern_return_t kr;
    const mach_port_t hostPort = mach_host_self();

    if ((kr = host_page_size(hostPort, pageSize)) != KERN_SUCCESS) {
        BSG_KSLOG_ERROR("host_page_size: %s", mach_error_string(kr));
#if !BSG_KSLOG_PRINTS_AT_LEVEL(BSG_KSLogger_Level_Error)
        (void)kr;
#endif
        return false;
    }

    mach_msg_type_number_t hostSize = sizeof(*vmStats) / sizeof(natural_t);
    kr = host_statistics(hostPort, HOST_VM_INFO, (host_info_t)vmStats,
                         &hostSize);
    if (kr != KERN_SUCCESS) {
        BSG_KSLOG_ERROR("host_statistics: %s", mach_error_string(kr));
        return false;
    }

    return true;
}
