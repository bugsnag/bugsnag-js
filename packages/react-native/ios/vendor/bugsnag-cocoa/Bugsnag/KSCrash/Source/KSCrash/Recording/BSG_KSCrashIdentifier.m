#import "BSG_KSCrashIdentifier.h"
#import "BSG_KSCrashAdvanced.h"
#import <Foundation/Foundation.h>
#import <string.h>

const char *bsg_kscrash_generate_report_identifier(void) {
    return strdup([[[NSUUID UUID] UUIDString] UTF8String]);
}

const char *bsg_kscrash_generate_report_path(const char *identifier,
                                             bool is_recrash_report) {
    if (identifier == NULL) {
        return NULL;
    }
    BSG_KSCrashReportStore *store = [[BSG_KSCrash sharedInstance] crashReportStore];
    NSString *reportID = [NSString stringWithUTF8String:identifier];

    if (is_recrash_report) {
        return strdup([[store pathToRecrashReportWithID:reportID] UTF8String]);
    } else {
        return strdup([[store pathToFileWithId:reportID] UTF8String]);
    }
}
