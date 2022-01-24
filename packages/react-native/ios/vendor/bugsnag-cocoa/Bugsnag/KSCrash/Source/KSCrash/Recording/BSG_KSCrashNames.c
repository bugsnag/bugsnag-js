//
//  BSG_KSCrashNames.c
//  Bugsnag
//
//  Created by Karl Stenerud on 28.09.21.
//  Copyright © 2021 Bugsnag Inc. All rights reserved.
//

#include "BSG_KSCrashNames.h"
#include <mach/thread_info.h>
#include <stdio.h>

static const char* thread_state_names[] = {
    // Defined in mach/thread_info.h
    NULL,
    "TH_STATE_RUNNING",
    "TH_STATE_STOPPED",
    "TH_STATE_WAITING",
    "TH_STATE_UNINTERRUPTIBLE",
    "TH_STATE_HALTED",
};
static const int thread_state_names_count = sizeof(thread_state_names) / sizeof(*thread_state_names);

const char *bsg_kscrashthread_state_name(integer_t state) {
    if (state < 1 || state >= thread_state_names_count) {
        return NULL;
    }
    return thread_state_names[state];
}
