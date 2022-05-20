//
//  BSG_KSCrashSentry_Private.h
//
//  Created by Karl Stenerud on 2012-09-29.
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

#ifndef HDR_BSG_KSCrashSentry_Private_h
#define HDR_BSG_KSCrashSentry_Private_h

#ifdef __cplusplus
extern "C" {
#endif

#include "BSG_KSCrashSentry.h"

/** Suspend all non-reserved threads.
 *
 * Reserved threads include the current thread and all threads in
 "reservedThreads" in the context.
 */
void bsg_kscrashsentry_suspendThreads(void);

/** Resume all non-reserved threads.
 *
 * Reserved threads include the current thread and all threads in
 * "reservedThreads" in the context.
 */
void bsg_kscrashsentry_resumeThreads(void);

/**
 * Prepares the context for handling a crash.
 *
 * Only a single crash report can be written per process lifetime, with the
 * exception of a crash in a crash handling thread for which a "recrash" report
 * can be written.
 *
 * True is returned if this crash should be processed. The caller should fill in
 * the context's crash details and call bsg_g_context->onCrash(). The caller
 * must call endHandlingCrash() once processing is complete. The process is
 * then expected to die once the default crash handler executes.
 *
 * False is returned if a crash has already been handled, to prevent
 * interrupting its processing and / or overwriting the existing crash report.
 * In this case the call to beginHandlingCrash() blocks until the crash handling
 * thread calls endHandlingCrash().
 */
bool bsg_kscrashsentry_beginHandlingCrash(const thread_t offender);

/**
 * Sentries must call this to unblock any sencondary crashed threads that are
 * waiting in beginHandlingCrash().
 */
void bsg_kscrashsentry_endHandlingCrash(void);

/** Clear a crash sentry context.
 */
void bsg_kscrashsentry_clearContext(BSG_KSCrash_SentryContext *context);

#ifdef __cplusplus
}
#endif

#endif // HDR_KSCrashSentry_Private_h
