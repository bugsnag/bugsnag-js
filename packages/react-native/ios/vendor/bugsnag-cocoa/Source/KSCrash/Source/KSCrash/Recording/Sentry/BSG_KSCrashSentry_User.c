//
//  BSG_KSCrashSentry_User.c
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

#include "BSG_KSCrashSentry_User.h"
#include "BSG_KSCrashSentry_Private.h"
#include "BSG_KSMach.h"
#include "BSG_KSCrashC.h"
#include "BSG_KSCrashIdentifier.h"

//#define BSG_KSLogger_LocalLevel TRACE
#include "BSG_KSLogger.h"

#include <execinfo.h>
#include <stdlib.h>

/** Context to fill with crash information. */
static BSG_KSCrash_SentryContext *bsg_g_context;

/** Lock for suspending threads from reportUserException() */
static pthread_mutex_t bsg_suspend_threads_mutex = PTHREAD_MUTEX_INITIALIZER;

bool bsg_kscrashsentry_installUserExceptionHandler(
    BSG_KSCrash_SentryContext *const context) {
    BSG_KSLOG_DEBUG("Installing user exception handler.");
    bsg_g_context = context;
    return true;
}

void bsg_kscrashsentry_uninstallUserExceptionHandler(void) {
    BSG_KSLOG_DEBUG("Uninstalling user exception handler.");
    bsg_g_context = NULL;
}

/**
 * Copies the global crash context, setting new crash report paths
 */
BSG_KSCrash_Context *bsg_kscrashsentry_generateReportContext() {
    BSG_KSCrash_Context *localContext = malloc(sizeof(BSG_KSCrash_Context));
    memcpy(localContext, crashContext(), sizeof(BSG_KSCrash_Context));
    localContext->config.crashID = bsg_kscrash_generate_report_identifier();
    localContext->config.crashReportFilePath =
        bsg_kscrash_generate_report_path(localContext->config.crashID, false);
    localContext->config.recrashReportFilePath =
        bsg_kscrash_generate_report_path(localContext->config.crashID, true);

    return localContext;
}

/**
 * Frees a crash context
 */
void bsg_kscrashsentry_freeReportContext(BSG_KSCrash_Context *context) {
    free((void *)context->config.crashID);
    free((void *)context->config.crashReportFilePath);
    free((void *)context->config.recrashReportFilePath);
    free(context);
}

void bsg_kscrashsentry_reportUserException(const char *name,
                                           const char *reason,
                                           uintptr_t *stackAddresses,
                                           unsigned long stackLength,
                                           const char *severity,
                                           const char *handledState,
                                           const char *overrides,
                                           const char *metadata,
                                           const char *appState,
                                           const char *config,
                                           int discardDepth,
                                           bool terminateProgram) {
    if (bsg_g_context == NULL) {
        BSG_KSLOG_WARN("User-reported exception sentry is not installed. "
                       "Exception has not been recorded.");
    } else {
        BSG_KSCrash_Context *reportContext = bsg_kscrashsentry_generateReportContext();
        BSG_KSCrash_SentryContext *localContext = &reportContext->crash;

        // We want these variables to persist until the onCrash
        // call later
        int callstackCount = 100;
        uintptr_t callstack[callstackCount];

        if (localContext->suspendThreadsForUserReported) {
            pthread_mutex_lock(&bsg_suspend_threads_mutex);
            BSG_KSLOG_DEBUG("Suspending all threads");
            bsg_kscrashsentry_suspendThreads();
        }

        if (stackAddresses != NULL && stackLength > 0) {
            localContext->stackTrace = stackAddresses;
            localContext->stackTraceLength = (int)stackLength;
        } else {
            BSG_KSLOG_DEBUG("Fetching call stack.");
            callstackCount = backtrace((void **)callstack, callstackCount);
            if (callstackCount <= 0) {
                BSG_KSLOG_ERROR("backtrace() returned call stack length of %d",
                                callstackCount);
                callstackCount = 0;
            }
            BSG_KSLOG_DEBUG("Filling out stack context entries.");
            localContext->stackTrace = callstack;
            localContext->stackTraceLength = callstackCount;
        }

        BSG_KSLOG_DEBUG("Filling out context.");
        localContext->crashType = BSG_KSCrashTypeUserReported;
        localContext->offendingThread = bsg_ksmachthread_self();
        localContext->registersAreValid = false;
        localContext->crashReason = reason;
        localContext->userException.name = name;
        localContext->userException.handledState = handledState;
        localContext->userException.overrides = overrides;
        localContext->userException.config = config;
        localContext->userException.discardDepth = discardDepth;
        localContext->userException.metadata = metadata;
        localContext->userException.state = appState;

        BSG_KSLOG_DEBUG("Calling main crash handler.");
        localContext->onCrash(reportContext);

        if (terminateProgram) {
            bsg_kscrashsentry_uninstall(BSG_KSCrashTypeAll);
            bsg_kscrashsentry_resumeThreads();
            abort();
        } else {
            bsg_kscrashsentry_resumeThreads();
        }
        if (localContext->suspendThreadsForUserReported) {
            pthread_mutex_unlock(&bsg_suspend_threads_mutex);
        }

        bsg_kscrashsentry_freeReportContext(reportContext);
    }
}
