#import <Foundation/Foundation.h>

#define PLATFORM_WORD_SIZE sizeof(void*)*8

@class BugsnagConfiguration;

@interface BSGOutOfMemoryWatchdog : NSObject

@property(nonatomic, strong, readonly) NSDictionary *lastBootCachedFileInfo;
@property(nonatomic, readonly) BOOL didOOMLastLaunch;

/**
 * Create a new watchdog using the sentinel path to store app/device state
 */
- (instancetype)initWithSentinelPath:(NSString *)sentinelFilePath
                       configuration:(BugsnagConfiguration *)config
    NS_DESIGNATED_INITIALIZER;

/**
 * Begin monitoring for lifecycle events
 */
- (void)start;

@end
