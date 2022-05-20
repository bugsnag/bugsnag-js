//
//  BSG_KSCrashState.c
//
//  Created by Karl Stenerud on 2012-02-05.
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

#import "BSG_KSCrashState.h"

#import "BSGJSONSerialization.h"
#import "BSGRunContext.h"
#import "BSG_KSFile.h"
#import "BSG_KSJSONCodec.h"
#import "BSG_KSLogger.h"
#import "BSG_KSMach.h"
#import "BSG_KSSystemInfo.h"

#if TARGET_OS_IOS || TARGET_OS_TV
#import "BSGUIKit.h"
#endif

#if TARGET_OS_IOS
#import <mach/mach_init.h>
#import <mach/task.h>
#import <mach/task_policy.h>
#endif

#import <errno.h>
#import <fcntl.h>
#import <mach/mach_time.h>
#import <stdlib.h>
#import <unistd.h>

// ============================================================================
#pragma mark - Constants -
// ============================================================================

#define BSG_kFormatVersion 1

#define BSG_kKeyFormatVersion "version"
#define BSG_kKeyCrashedLastLaunch "crashedLastLaunch"

// ============================================================================
#pragma mark - Globals -
// ============================================================================

/** Location where stat file is stored. */
static const char *bsg_g_stateFilePath;

/** Current state. */
static BSG_KSCrash_State *bsg_g_state;

// ============================================================================
#pragma mark - JSON Encoding -
// ============================================================================

/** Callback for adding JSON data.
 */
static
int bsg_kscrashstate_i_addJSONData(const char *const data, const size_t length,
                                   void *const userData) {
    bool success = BSG_KSFileWrite(userData, data, length);
    return success ? BSG_KSJSON_OK : BSG_KSJSON_ERROR_CANNOT_ADD_DATA;
}

// ============================================================================
#pragma mark - Utility -
// ============================================================================

/** Load the persistent state portion of a crash context.
 *
 * @param context The context to load into.
 *
 * @param path The path to the file to read.
 *
 * @return true if the operation was successful.
 */
bool bsg_kscrashstate_i_loadState(BSG_KSCrash_State *const context,
                                  const char *const path) {
    NSString *file = path ? @(path) : nil;
    if (!file) {
        bsg_log_err(@"Invalid path: %s", path);
        return false;
    }
    NSError *error;
    NSDictionary *dict = BSGJSONDictionaryFromFile(file, 0, &error);
    if (!dict) {
        if (!(error.domain == NSCocoaErrorDomain &&
              error.code == NSFileReadNoSuchFileError)) {
            bsg_log_err(@"%s: Could not load file: %@", path, error);
        }
        return false;
    }
    if (![dict[@ BSG_kKeyFormatVersion] isEqual:@ BSG_kFormatVersion]) {
        bsg_log_err(@"Version mismatch");
        return false;
    }
    context->crashedLastLaunch = [dict[@ BSG_kKeyCrashedLastLaunch] boolValue];
    return true;
}

/** Save the persistent state portion of a crash context.
 *
 * @param state The context to save from.
 *
 * @param path The path to the file to create.
 *
 * @return true if the operation was successful.
 */
bool bsg_kscrashstate_i_saveState(const BSG_KSCrash_State *const state,
                                  const char *const path) {
    int fd = open(path, O_RDWR | O_CREAT | O_TRUNC, 0644);
    if (fd < 0) {
        bsg_log_err(@"Could not open file %s for writing: %s", path, strerror(errno));
        return false;
    }

    BSG_KSFile file;
    char buffer[256];
    BSG_KSFileInit(&file, fd, buffer, sizeof(buffer) / sizeof(*buffer));

    BSG_KSJSONEncodeContext JSONContext;
    bsg_ksjsonbeginEncode(&JSONContext, false, bsg_kscrashstate_i_addJSONData,
                          &file);

    int result;
    if ((result = bsg_ksjsonbeginObject(&JSONContext, NULL)) != BSG_KSJSON_OK) {
        goto done;
    }
    if ((result = bsg_ksjsonaddIntegerElement(
             &JSONContext, BSG_kKeyFormatVersion, BSG_kFormatVersion)) !=
        BSG_KSJSON_OK) {
        goto done;
    }
    // Record this launch crashed state into "crashed last launch" field.
    if ((result = bsg_ksjsonaddBooleanElement(
             &JSONContext, BSG_kKeyCrashedLastLaunch,
             state->crashedThisLaunch)) != BSG_KSJSON_OK) {
        goto done;
    }
    result = bsg_ksjsonendEncode(&JSONContext);

done:
    BSG_KSFileFlush(&file);
    close(fd);

    if (result != BSG_KSJSON_OK) {
        bsg_log_err(@"%s: %s", path, bsg_ksjsonstringForError(result));
        return false;
    }
    return true;
}

// ============================================================================
#pragma mark - API -
// ============================================================================

bool bsg_kscrashstate_init(const char *const stateFilePath,
                           BSG_KSCrash_State *const state) {
    bsg_g_stateFilePath = stateFilePath;
    bsg_g_state = state;

    uint64_t timeNow = mach_absolute_time();
    memset(state, 0, sizeof(*state));
    bsg_kscrashstate_i_loadState(state, stateFilePath);
    state->appLaunchTime = timeNow;
    state->lastUpdateDurationsTime = timeNow;
    state->applicationIsInForeground = bsg_runContext->isForeground;

    return bsg_kscrashstate_i_saveState(state, stateFilePath);
}

void bsg_kscrashstate_notifyAppInForeground(const bool isInForeground) {
    BSG_KSCrash_State *const state = bsg_g_state;

    if (state->applicationIsInForeground == isInForeground) {
        return;
    }
    state->applicationIsInForeground = isInForeground;
    uint64_t timeNow = mach_absolute_time();
    double duration = bsg_ksmachtimeDifferenceInSeconds(
        timeNow, state->lastUpdateDurationsTime);
    if (isInForeground) {
        state->backgroundDurationSinceLaunch += duration;
    } else {
        state->foregroundDurationSinceLaunch += duration;
    }
    state->lastUpdateDurationsTime = timeNow;
}

void bsg_kscrashstate_notifyAppCrash(void) {
    BSG_KSCrash_State *const state = bsg_g_state;
    const char *const stateFilePath = bsg_g_stateFilePath;
    bsg_kscrashstate_updateDurationStats(state);
    state->crashedThisLaunch = YES;
    bsg_kscrashstate_i_saveState(state, stateFilePath);
}

void bsg_kscrashstate_updateDurationStats(BSG_KSCrash_State *const state) {
    uint64_t timeNow = mach_absolute_time();
    const double duration = bsg_ksmachtimeDifferenceInSeconds(
        timeNow, state->lastUpdateDurationsTime ?: state->appLaunchTime);
    if (state->applicationIsInForeground) {
        state->foregroundDurationSinceLaunch += duration;
    } else {
        state->backgroundDurationSinceLaunch += duration;
    }
    state->lastUpdateDurationsTime = timeNow;
}

const BSG_KSCrash_State *bsg_kscrashstate_currentState(void) {
    return bsg_g_state;
}
