#import "BSG_KSCrashIdentifier.h"

#import "BSG_KSCrashAdvanced.h"

#import <Foundation/Foundation.h>

#include <stdio.h>
#include <string.h>

static char *report_directory;
static char *bundle_name;

void bsg_kscrash_generate_report_initialize(const char *directory, const char *bundleName) {
    report_directory = directory ? strdup(directory) : NULL;
    bundle_name = bundleName ? strdup(bundleName) : NULL;
}

const char *bsg_kscrash_generate_report_identifier(void) {
    return strdup([[[NSUUID UUID] UUIDString] UTF8String]);
}

const char *bsg_kscrash_generate_report_path(const char *identifier,
                                             bool is_recrash_report) {
    if (identifier == NULL) {
        return NULL;
    }
    char *type = is_recrash_report ? "RecrashReport" : "CrashReport";
    char *path = NULL;
    asprintf(&path, "%s/%s-%s-%s.json", report_directory, bundle_name, type, identifier);
    return path;
}
