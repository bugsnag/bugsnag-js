//
//  BugsnagBreadcrumbs.m
//  Bugsnag
//
//  Created by Jamie Lynch on 26/03/2020.
//  Copyright © 2020 Bugsnag. All rights reserved.
//


#import "BugsnagBreadcrumbs.h"
#import "BugsnagBreadcrumb.h"
#import "BugsnagLogger.h"
#import "Private.h"

@interface BugsnagConfiguration ()
@property(nonatomic) NSMutableArray *onBreadcrumbBlocks;
@end

@interface BugsnagBreadcrumb ()
+ (instancetype _Nullable)breadcrumbWithBlock:
    (BSGBreadcrumbConfiguration _Nonnull)block;
+ (instancetype _Nullable)breadcrumbFromDict:(NSDictionary *_Nonnull)dict;
@end

@interface BugsnagBreadcrumbs ()

@property(nonatomic, readwrite, strong) NSMutableArray *breadcrumbs;
@property(nonatomic, readonly, strong) dispatch_queue_t readWriteQueue;
@end

@implementation BugsnagBreadcrumbs

NSUInteger BreadcrumbsDefaultCapacity = 25;

- (instancetype)init {
    static NSString *const BSGBreadcrumbCacheFileName = @"bugsnag_breadcrumbs.json";
    if (self = [super init]) {
        _breadcrumbs = [NSMutableArray new];
        _capacity = BreadcrumbsDefaultCapacity;
        _enabledBreadcrumbTypes = BSGEnabledBreadcrumbTypeAll;
        _readWriteQueue = dispatch_queue_create("com.bugsnag.BreadcrumbRead",
                                                DISPATCH_QUEUE_SERIAL);
        NSString *cacheDir = [NSSearchPathForDirectoriesInDomains(
                                 NSCachesDirectory, NSUserDomainMask, YES) firstObject];
        if (cacheDir != nil) {
            _cachePath = [cacheDir stringByAppendingPathComponent:
                             BSGBreadcrumbCacheFileName];
        }
    }
    return self;
}

- (void)addBreadcrumb:(NSString *)breadcrumbMessage {
    [self addBreadcrumbWithBlock:^(BugsnagBreadcrumb *_Nonnull crumb) {
        crumb.message = breadcrumbMessage;
    }];
}

- (void)addBreadcrumbWithBlock:
    (void (^_Nonnull)(BugsnagBreadcrumb *_Nonnull))block {
    if (self.capacity == 0) {
        return;
    }
    BugsnagBreadcrumb *crumb = [BugsnagBreadcrumb breadcrumbWithBlock:block];

    if (crumb != nil && [self shouldSendBreadcrumb:crumb]) {
        [self resizeToFitCapacity:self.capacity - 1];
        dispatch_barrier_sync(self.readWriteQueue, ^{
            [self.breadcrumbs addObject:crumb];
            // Serialize crumbs to disk inside barrier to avoid simultaneous
            // access to the file
            if (self.cachePath != nil) {
                static NSString *const arrayKeyPath = @"objectValue";
                NSArray *items = [self.breadcrumbs valueForKeyPath:arrayKeyPath];
                if ([NSJSONSerialization isValidJSONObject:items]) {
                    NSError *error = nil;
                    NSData *data = [NSJSONSerialization dataWithJSONObject:items
                                                                   options:0
                                                                     error:&error];
                    [data writeToFile:self.cachePath atomically:NO];
                    if (error != nil) {
                        bsg_log_err(@"Failed to write breadcrumbs to disk: %@", error);
                    }
                }
            }
        });
    }
}

- (BOOL)shouldSendBreadcrumb:(BugsnagBreadcrumb *)crumb {
    BugsnagConfiguration *configuration = [Bugsnag configuration];
    for (BugsnagOnBreadcrumbBlock block in configuration.onBreadcrumbBlocks) {
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

- (NSArray *)cachedBreadcrumbs {
    __block NSArray *cache = nil;
    dispatch_barrier_sync(self.readWriteQueue, ^{
        NSError *error = nil;
        NSData *data = [NSData dataWithContentsOfFile:self.cachePath options:0 error:&error];
        if (error == nil) {
            cache = [NSJSONSerialization JSONObjectWithData:data options:0 error:&error];
        }
        if (error != nil) {
            bsg_log_err(@"Failed to read breadcrumbs from disk: %@", error);
        }
    });
    return [cache isKindOfClass:[NSArray class]] ? cache : nil;
}

@synthesize capacity = _capacity;

- (NSUInteger)capacity {
    @synchronized (self) {
        return _capacity;
    }
}

- (void)setCapacity:(NSUInteger)capacity {
    @synchronized (self) {
        if (capacity == _capacity) {
            return;
        }
        [self resizeToFitCapacity:capacity];
        [self willChangeValueForKey:NSStringFromSelector(@selector(capacity))];
        _capacity = MIN(100, capacity);
        [self didChangeValueForKey:NSStringFromSelector(@selector(capacity))];
    }
}

- (NSUInteger)count {
    return self.breadcrumbs.count;
}

- (BugsnagBreadcrumb *)objectAtIndexedSubscript:(NSUInteger)index {
    if (index < [self count]) {
        __block BugsnagBreadcrumb *crumb = nil;
        dispatch_barrier_sync(self.readWriteQueue, ^{
          crumb = self.breadcrumbs[index];
        });
        return crumb;
    }
    return nil;
}

- (NSArray *)arrayValue {
    if ([self count] == 0) {
        return nil;
    }
    __block NSMutableArray *contents =
        [[NSMutableArray alloc] initWithCapacity:[self count]];
    dispatch_barrier_sync(self.readWriteQueue, ^{
      for (BugsnagBreadcrumb *crumb in self.breadcrumbs) {
          NSDictionary *objectValue = [crumb objectValue];
          NSError *error = nil;
          @try {
              if (![NSJSONSerialization isValidJSONObject:objectValue]) {
                  bsg_log_err(@"Unable to serialize breadcrumb: Not a valid "
                              @"JSON object");
                  continue;
              }
              [contents addObject:objectValue];
          } @catch (NSException *exception) {
              bsg_log_err(@"Unable to serialize breadcrumb: %@", error);
          }
      }
    });
    return contents;
}

- (void)resizeToFitCapacity:(NSUInteger)capacity {
    if ([self count] > capacity) {
        dispatch_barrier_sync(self.readWriteQueue, ^{
          [self.breadcrumbs
              removeObjectsInRange:NSMakeRange(0, self.count - capacity)];
        });
    }
}

@end
