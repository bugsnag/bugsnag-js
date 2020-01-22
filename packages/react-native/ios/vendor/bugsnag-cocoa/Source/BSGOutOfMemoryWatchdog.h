#import <Foundation/Foundation.h>

@class BugsnagConfiguration;

@interface BSGOutOfMemoryWatchdog : NSObject

@property(nonatomic, strong, readonly) NSDictionary *lastBootCachedFileInfo;

/**
 * Create a new watchdog using the sentinel path to store app/device state
 */
- (instancetype)initWithSentinelPath:(NSString *)sentinelFilePath
                       configuration:(BugsnagConfiguration *)config NS_DESIGNATED_INITIALIZER;
/**
 * @return YES if the app was killed to end the previous app launch
 */
- (BOOL)didOOMLastLaunch;
/**
 * Begin monitoring for lifecycle events and report the OOM from the last launch (if any)
 */
- (void)enable;
/**
 * Stop monitoring for lifecycle events
 */
- (void)disable;
@end
