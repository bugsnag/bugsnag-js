//
//  BSG_KSCrashSentry_MachException.h
//
//  Created by Karl Stenerud on 2012-02-04.
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

/* Catches mach exceptions.
 */

#ifndef HDR_BSG_KSCrashSentry_MachException_h
#define HDR_BSG_KSCrashSentry_MachException_h

#ifdef __cplusplus
extern "C" {
#endif

#include "BSG_KSCrashSentry.h"
#include <stdbool.h>
#include <TargetConditionals.h>

/**
 * Implementing a Mach exception handler requires use of the following APIs that
 * are prohibited on tvOS and watchOS:
 * - mach_msg
 * - task_get_exception_ports
 * - task_set_exception_ports
 */
#if TARGET_OS_IOS || TARGET_OS_OSX
#define MACH_EXCEPTION_HANDLING_AVAILABLE 1
#else
#define MACH_EXCEPTION_HANDLING_AVAILABLE 0
#endif

/** Install our custom mach exception handler.
 *
 * @param context Contextual information for the crash handler.
 *
 * @return true if installation was succesful.
 */
bool bsg_kscrashsentry_installMachHandler(BSG_KSCrash_SentryContext *context);

/** Uninstall our custom mach exception handler.
 */
void bsg_kscrashsentry_uninstallMachHandler(void);

#ifdef __cplusplus
}
#endif

#endif // HDR_KSCrashSentry_MachException_h
