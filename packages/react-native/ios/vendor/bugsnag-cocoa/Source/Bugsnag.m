//
//  Bugsnag.m
//
//  Created by Conrad Irwin on 2014-10-01.
//
//  Copyright (c) 2014 Bugsnag, Inc. All rights reserved.
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

#import "Bugsnag.h"
#import "BSG_KSCrash.h"
#import "BugsnagLogger.h"
#import "BugsnagClient.h"
#import "BugsnagKeys.h"
#import "BugsnagPlugin.h"

static BugsnagClient *bsg_g_bugsnag_client = NULL;

@interface Bugsnag ()
+ (BugsnagClient *)client;
+ (BOOL)bugsnagStarted;
@end

@interface NSDictionary (BSGKSMerge)
- (NSDictionary *)BSG_mergedInto:(NSDictionary *)dest;
@end

@implementation Bugsnag

+ (void)startBugsnagWithApiKey:(NSString *)apiKey {
    BugsnagConfiguration *configuration = [BugsnagConfiguration new];
    configuration.apiKey = apiKey;
    [self startBugsnagWithConfiguration:configuration];
}

+ (void)startBugsnagWithConfiguration:(BugsnagConfiguration *)configuration {
    @synchronized(self) {
        bsg_g_bugsnag_client =
                [[BugsnagClient alloc] initWithConfiguration:configuration];
        [bsg_g_bugsnag_client start];
    }
}

+ (BugsnagConfiguration *)configuration {
    if ([self bugsnagStarted]) {
        return self.client.configuration;
    }
    return nil;
}

+ (BugsnagConfiguration *)instance {
    return [self configuration];
}

+ (BugsnagClient *)client {
    return bsg_g_bugsnag_client;
}

+ (BOOL)appDidCrashLastLaunch {
    if ([self bugsnagStarted]) {
        return [self.client appCrashedLastLaunch];
    }
    return NO;
}

+ (void)notify:(NSException *)exception {
    if ([self bugsnagStarted]) {
        [self.client notifyException:exception
                                 block:^(BugsnagEvent *_Nonnull report) {
                                     report.depth += 2;
                                 }];
    }
}

+ (void)notify:(NSException *)exception block:(BugsnagOnErrorBlock)block {
    if ([self bugsnagStarted]) {
        [[self client] notifyException:exception
                                   block:^(BugsnagEvent *_Nonnull report) {
                                       report.depth += 2;

                                       if (block) {
                                           block(report);
                                       }
                                   }];
    }
}

+ (void)notifyError:(NSError *)error {
    if ([self bugsnagStarted]) {
        [self.client notifyError:error
                             block:^(BugsnagEvent *_Nonnull report) {
                                 report.depth += 2;
                             }];
    }
}

+ (void)notifyError:(NSError *)error block:(BugsnagOnErrorBlock)block {
    if ([self bugsnagStarted]) {
        [[self client] notifyError:error
                               block:^(BugsnagEvent *_Nonnull report) {
                                   report.depth += 2;

                                   if (block) {
                                       block(report);
                                   }
                               }];
    }
}

+ (void)notify:(NSException *)exception withData:(NSDictionary *)metadata {
    if ([self bugsnagStarted]) {
        [[self client]
                notifyException:exception
                          block:^(BugsnagEvent *_Nonnull report) {
                              report.depth += 2;
                              report.metadata = [metadata
                                      BSG_mergedInto:[self.client.configuration
                                              .metadata toDictionary]];
                          }];
    }
}

+ (void)notify:(NSException *)exception
      withData:(NSDictionary *)metadata
    atSeverity:(NSString *)severity {
    if ([self bugsnagStarted]) {
        [[self client]
                notifyException:exception
                     atSeverity:BSGParseSeverity(severity)
                          block:^(BugsnagEvent *_Nonnull report) {
                              report.depth += 2;
                              report.metadata = [metadata
                                      BSG_mergedInto:[self.client.configuration
                                              .metadata toDictionary]];
                              report.severity = BSGParseSeverity(severity);
                          }];
    }
}

+ (void)internalClientNotify:(NSException *_Nonnull)exception
                    withData:(NSDictionary *_Nullable)metadata
                       block:(BugsnagOnErrorBlock _Nullable)block {
    if ([self bugsnagStarted]) {
        [self.client internalClientNotify:exception
                                   withData:metadata
                                      block:block];
    }
}

/**
 * Add custom data to send to Bugsnag with every exception. If value is nil,
 * delete the current value for attributeName
 */
+ (void)addMetadataToSection:(NSString *_Nonnull)section
                         key:(NSString *_Nonnull)key
                       value:(id _Nullable)value {
    if ([self bugsnagStarted]) {
        [self.client.configuration.metadata addAttribute:key
                                                 withValue:value
                                             toTabWithName:section];
    }
}

+ (void)clearMetadataInSection:(NSString *)section {
    if ([self bugsnagStarted]) {
        [self.client.configuration.metadata clearMetadataInSection:section];
    }
}

+ (BOOL)bugsnagStarted {
    if (!self.client.started) {
        bsg_log_err(@"Ensure you have started Bugsnag with startWithApiKey: "
                    @"before calling any other Bugsnag functions.");

        return NO;
    }
    return YES;
}

+ (void)leaveBreadcrumbWithMessage:(NSString *)message {
    if ([self bugsnagStarted]) {
        [self leaveBreadcrumbWithBlock:^(BugsnagBreadcrumb *_Nonnull crumbs) {
            crumbs.message = message;
        }];
    }
}

+ (void)leaveBreadcrumbWithBlock:
    (void (^_Nonnull)(BugsnagBreadcrumb *_Nonnull))block {
    if ([self bugsnagStarted]) {
        [self.client addBreadcrumbWithBlock:block];
    }
}

+ (void)leaveBreadcrumbForNotificationName:
    (NSString *_Nonnull)notificationName {
    if ([self bugsnagStarted]) {
        [self.client crumbleNotification:notificationName];
    }
}

+ (void)leaveBreadcrumbWithMessage:(NSString *_Nonnull)message
                          metadata:(NSDictionary *_Nullable)metadata
                           andType:(BSGBreadcrumbType)type
{
    if ([self bugsnagStarted]) {
        [self leaveBreadcrumbWithBlock:^(BugsnagBreadcrumb *_Nonnull crumbs) {
            crumbs.message = message;
            crumbs.metadata = metadata;
            crumbs.type = type;
        }];
    }
}

+ (void)setBreadcrumbCapacity:(NSUInteger)capacity {
    if ([self bugsnagStarted]) {
        [self.client.configuration setMaxBreadcrumbs:capacity];
    }
}

+ (void)clearBreadcrumbs {
    if ([self bugsnagStarted]) {
        [self.client clearBreadcrumbs];
    }
}

+ (void)startSession {
    if ([self bugsnagStarted]) {
        [self.client startSession];
    }
}

+ (void)pauseSession {
    if ([self bugsnagStarted]) {
        [self.client pauseSession];
    }
}

+ (BOOL)resumeSession {
    if ([self bugsnagStarted]) {
        return [self.client resumeSession];
    } else {
        return false;
    }
}

+ (NSDateFormatter *)payloadDateFormatter {
    static NSDateFormatter *formatter;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
      formatter = [NSDateFormatter new];
      formatter.dateFormat = @"yyyy'-'MM'-'dd'T'HH':'mm':'ssZZZ";
    });
    return formatter;
}

+ (void)clearMetadataInSection:(NSString *_Nonnull)sectionName
                       withKey:(NSString *_Nonnull)key
{
    if ([self bugsnagStarted]) {
        [self.client.configuration.metadata clearMetadataInSection:sectionName
                                                                 key:key];
    }
}

+ (NSMutableDictionary *)getMetadata:(NSString *)section {
    return [[[self configuration] metadata] getMetadata:section];
}

+ (id _Nullable )getMetadata:(NSString *_Nonnull)section
                         key:(NSString *_Nonnull)key
{
    return [[[self configuration] metadata] getMetadata:section key:key];
}

+ (void)setContext:(NSString *_Nullable)context {
    [self configuration].context = context;
}

+ (void)setUser:(NSString *_Nullable)userId
       withName:(NSString *_Nullable)name
       andEmail:(NSString *_Nullable)email {
    [[self configuration] setUser:userId withName:name andEmail:email];
}

+ (void)addOnSessionBlock:(BugsnagOnSessionBlock _Nonnull)block
{
    [[self configuration] addOnSessionBlock:block];
}

+ (void)removeOnSessionBlock:(BugsnagOnSessionBlock _Nonnull )block
{
    [[self configuration] removeOnSessionBlock:block];
}

@end

//
//  NSDictionary+Merge.m
//
//  Created by Karl Stenerud on 2012-10-01.
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

@implementation NSDictionary (BSGKSMerge)

- (NSDictionary *)BSG_mergedInto:(NSDictionary *)dest {
    if ([dest count] == 0) {
        return self;
    }
    if ([self count] == 0) {
        return dest;
    }

    NSMutableDictionary *dict = [dest mutableCopy];
    for (id key in [self allKeys]) {
        id srcEntry = self[key];
        id dstEntry = dest[key];
        if ([dstEntry isKindOfClass:[NSDictionary class]] &&
            [srcEntry isKindOfClass:[NSDictionary class]]) {
            srcEntry = [srcEntry BSG_mergedInto:dstEntry];
        }
        dict[key] = srcEntry;
    }
    return dict;
}

@end
