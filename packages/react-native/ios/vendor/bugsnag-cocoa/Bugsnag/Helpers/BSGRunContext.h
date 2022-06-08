//
//  BSGRunContext.h
//  Bugsnag
//
//  Copyright © 2022 Bugsnag Inc. All rights reserved.
//

#include <dispatch/dispatch.h>
#include <stdbool.h>
#include <stdint.h>
#include <uuid/uuid.h>

#include "BSGDefines.h"

//
// The struct version should be incremented prior to a release if changes have
// been made to BSGRunContext.
//
// During development this is not strictly necessary since last run's data will
// not be loaded if the struct's size has changed.
//
#define BSGRUNCONTEXT_VERSION 2

struct BSGRunContext {
    long structVersion;
    bool isDebuggerAttached;
    bool isLaunching;
    bool isForeground;
    bool isTerminating;
    long thermalState;
    uint64_t bootTime;
    uuid_t machoUUID;
    uuid_string_t sessionId;
    double sessionStartTime;
    unsigned long handledCount;
    unsigned long unhandledCount;
#if BSG_HAVE_BATTERY
    float batteryLevel;
    long batteryState;
#endif
#if TARGET_OS_IOS
    long lastKnownOrientation;
    dispatch_source_memorypressure_flags_t memoryPressure;
#endif
    double timestamp __attribute__((aligned(8)));
    size_t availableMemory;
};

/// Information about the current run of the app / process.
///
/// This structure is mapped to a file so that changes will be persisted by the OS.
///
/// Guaranteed to be non-null once BSGRunContextInit() is called.
extern struct BSGRunContext *_Nonnull bsg_runContext;

/// Information about the last run of the app / process, if it could be loaded.
extern const struct BSGRunContext *_Nullable bsg_lastRunContext;

#pragma mark -

void BSGRunContextInit(const char *_Nonnull path);

#pragma mark -

BSG_PRIVATE void BSGRunContextUpdateTimestamp(void);

#pragma mark -

#ifdef FOUNDATION_EXTERN
static inline bool BSGRunContextWasCriticalThermalState() {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wunguarded-availability-new"
    return bsg_lastRunContext && bsg_lastRunContext->thermalState == NSProcessInfoThermalStateCritical;
#pragma clang diagnostic pop
}
#endif

#if !TARGET_OS_WATCH
bool BSGRunContextWasKilled(void);
#endif

static inline bool BSGRunContextWasLaunching() {
    return bsg_lastRunContext && bsg_lastRunContext->isLaunching;
}

#if TARGET_OS_IOS
static inline bool BSGRunContextWasMemoryWarning() {
    return bsg_lastRunContext && bsg_lastRunContext->memoryPressure > DISPATCH_MEMORYPRESSURE_NORMAL;
}
#endif

static inline bool BSGRunContextWasTerminating() {
    return bsg_lastRunContext && bsg_lastRunContext->isTerminating;
}
