//
//  BugsnagBreadcrumbs.m
//  Bugsnag
//
//  Created by Jamie Lynch on 26/03/2020.
//  Copyright © 2020 Bugsnag. All rights reserved.
//


#import "BugsnagBreadcrumbs.h"

#import "BSGFileLocations.h"
#import "BSGJSONSerialization.h"
#import "BSG_KSCrashReportWriter.h"
#import "BugsnagBreadcrumb+Private.h"
#import "BugsnagConfiguration+Private.h"
#import "BugsnagLogger.h"

/**
 * Information that can be accessed in an async-safe manner from the crash handler.
 */
typedef struct {
    char directoryPath[PATH_MAX];
    unsigned int firstFileNumber;
    unsigned int nextFileNumber;
} BugsnagBreadcrumbsContext;

static BugsnagBreadcrumbsContext g_context;

#pragma mark -

@interface BugsnagBreadcrumbs ()

@property (readonly) NSString *breadcrumbsPath;

@property BugsnagConfiguration *config;
@property unsigned int nextFileNumber;
@property unsigned int maxBreadcrumbs;

@end

#pragma mark -

@implementation BugsnagBreadcrumbs

- (instancetype)initWithConfiguration:(BugsnagConfiguration *)config {
    if (!(self = [super init])) {
        return nil;
    }
    
    _config = config;
    // Capture maxBreadcrumbs to protect against config being changed after initialization
    _maxBreadcrumbs = (unsigned int)config.maxBreadcrumbs;
    
    _breadcrumbsPath = [BSGFileLocations current].breadcrumbs;
    [_breadcrumbsPath getFileSystemRepresentation:g_context.directoryPath maxLength:sizeof(g_context.directoryPath)];
    
    return self;
}

- (NSArray<BugsnagBreadcrumb *> *)breadcrumbs {
    return [self loadBreadcrumbsAsDictionaries:NO] ?: @[];
}

- (void)addBreadcrumb:(NSString *)breadcrumbMessage {
    [self addBreadcrumbWithBlock:^(BugsnagBreadcrumb *_Nonnull crumb) {
        crumb.message = breadcrumbMessage;
    }];
}

- (void)addBreadcrumbWithBlock:(BSGBreadcrumbConfiguration)block {
    if (self.maxBreadcrumbs == 0) {
        return;
    }
    BugsnagBreadcrumb *crumb = [BugsnagBreadcrumb breadcrumbWithBlock:block];
    if (!crumb || ![self shouldSendBreadcrumb:crumb]) {
        return;
    }
    NSData *data = [self dataForBreadcrumb:crumb];
    if (!data) {
        return;
    }
    unsigned int fileNumber;
    @synchronized (self) {
        fileNumber = self.nextFileNumber;
        self.nextFileNumber = fileNumber + 1;
        if (fileNumber + 1 > self.maxBreadcrumbs) {
            g_context.firstFileNumber = fileNumber + 1 - self.maxBreadcrumbs;
        }
        g_context.nextFileNumber = fileNumber + 1;
    }
    [self writeBreadcrumbData:(NSData *)data toFileNumber:fileNumber];
}

- (BOOL)shouldSendBreadcrumb:(BugsnagBreadcrumb *)crumb {
    for (BugsnagOnBreadcrumbBlock block in self.config.onBreadcrumbBlocks) {
        @try {
            if (!block(crumb)) {
                return NO;
            }
        } @catch (NSException *exception) {
            bsg_log_err(@"Error from onBreadcrumb callback: %@", exception);
        }
    }
    return YES;
}

- (void)removeAllBreadcrumbs {
    @synchronized (self) {
        self.nextFileNumber = 0;
        g_context.firstFileNumber = 0;
        g_context.nextFileNumber = 0;
    }
    [self deleteBreadcrumbFiles];
}

#pragma mark - File storage

- (NSData *)dataForBreadcrumb:(BugsnagBreadcrumb *)breadcrumb {
    id JSONObject = [breadcrumb objectValue];
    if (![BSGJSONSerialization isValidJSONObject:JSONObject]) {
        bsg_log_err(@"Unable to serialize breadcrumb: Not a valid JSON object");
        return nil;
    }
    NSError *error = nil;
    NSData *data = [BSGJSONSerialization dataWithJSONObject:JSONObject options:0 error:&error];
    if (!data) {
        bsg_log_err(@"Unable to serialize breadcrumb: %@", error);
    }
    return data;
}

- (NSString *)pathForFileNumber:(unsigned int)fileNumber {
    return [self.breadcrumbsPath stringByAppendingPathComponent:[NSString stringWithFormat:@"%u.json", fileNumber]];
}

- (void)writeBreadcrumbData:(NSData *)data toFileNumber:(unsigned int)fileNumber {
    NSString *path = [self pathForFileNumber:fileNumber];
    
    NSError *error = nil;
    if (![data writeToFile:path options:NSDataWritingAtomic error:&error]) {
        bsg_log_err(@"Unable to write breadcrumb: %@", error);
        return;
    }
    
    if (fileNumber >= self.maxBreadcrumbs) {
        NSString *path = [self pathForFileNumber:fileNumber - self.maxBreadcrumbs];
        if (![[NSFileManager defaultManager] removeItemAtPath:path error:&error]) {
            bsg_log_err(@"Unable to delete old breadcrumb: %@", error);
        }
    }
}

- (nullable NSArray<NSDictionary *> *)cachedBreadcrumbs {
    return [self loadBreadcrumbsAsDictionaries:YES];
}

- (nullable NSArray *)loadBreadcrumbsAsDictionaries:(BOOL)asDictionaries {
    NSError *error = nil;
    
    NSArray<NSString *> *filenames = [[NSFileManager defaultManager] contentsOfDirectoryAtPath:self.breadcrumbsPath error:&error];
    if (!filenames) {
        bsg_log_err(@"Unable to read breadcrumbs: %@", error);
        return nil;
    }
    
    NSMutableArray<NSDictionary *> *breadcrumbs = [NSMutableArray array];
    
    for (NSString *file in [filenames sortedArrayUsingSelector:@selector(compare:)]) {
        NSString *path = [self.breadcrumbsPath stringByAppendingPathComponent:file];
        NSData *data = [NSData dataWithContentsOfFile:path];
        if (!data) {
            bsg_log_err(@"Unable to read breadcrumb from %@", path);
            continue;
        }
        id JSONObject = [BSGJSONSerialization JSONObjectWithData:data options:0 error:&error];
        if (!JSONObject) {
            bsg_log_err(@"Unable to parse breadcrumb: %@", error);
            continue;
        }
        BugsnagBreadcrumb *breadcrumb;
        if (![JSONObject isKindOfClass:[NSDictionary class]] ||
            !(breadcrumb = [BugsnagBreadcrumb breadcrumbFromDict:JSONObject])) {
            bsg_log_err(@"Unexpected breadcrumb payload in file %@", file);
            continue;
        }
        [breadcrumbs addObject:asDictionaries ? JSONObject : breadcrumb];
    }
    
    return breadcrumbs;
}

- (void)deleteBreadcrumbFiles {
    [[NSFileManager defaultManager] removeItemAtPath:self.breadcrumbsPath error:NULL];
    
    NSError *error = nil;
    if (![[NSFileManager defaultManager] createDirectoryAtPath:self.breadcrumbsPath withIntermediateDirectories:YES attributes:nil error:&error]) {
        bsg_log_err(@"Unable to create breadcrumbs directory: %@", error);
    }
}

@end

#pragma mark -

void BugsnagBreadcrumbsWriteCrashReport(const BSG_KSCrashReportWriter *writer) {
    char path[PATH_MAX];
    writer->beginArray(writer, "breadcrumbs");
    for (unsigned int i = g_context.firstFileNumber; i < g_context.nextFileNumber; i++) {
        int result = snprintf(path, sizeof(path), "%s/%u.json", g_context.directoryPath, i);
        if (result < 0 || result >= sizeof(path)) {
            bsg_log_err(@"Breadcrumb path is too long");
            continue;
        }
        writer->addJSONFileElement(writer, NULL, path);
    }
    writer->endContainer(writer);
}
