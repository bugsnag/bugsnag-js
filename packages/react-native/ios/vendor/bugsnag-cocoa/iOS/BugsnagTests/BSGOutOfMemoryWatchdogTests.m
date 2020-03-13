#import <XCTest/XCTest.h>
#import "BSGOutOfMemoryWatchdog.h"
#import "BSG_KSSystemInfo.h"
#import "BugsnagConfiguration.h"
#import "Bugsnag.h"
#import "BugsnagClient.h"
#import "BugsnagTestConstants.h"

// Expose private identifiers for testing

@interface Bugsnag (Testing)
+ (BugsnagClient *)client;
@end

@interface BugsnagClient (Testing)
@property (nonatomic, strong) BSGOutOfMemoryWatchdog *oomWatchdog;
@end

@interface BSGOutOfMemoryWatchdog (Testing)
- (NSMutableDictionary *)generateCacheInfoWithConfig:(BugsnagConfiguration *)config;
@property(nonatomic, strong, readwrite) NSMutableDictionary *cachedFileInfo;
@end

@interface BSGOutOfMemoryWatchdogTests : XCTestCase
@end

@implementation BSGOutOfMemoryWatchdogTests

- (void)setUp {
    [super setUp];
    BugsnagConfiguration *config = [[BugsnagConfiguration alloc] initWithApiKey:DUMMY_APIKEY_32CHAR_1 error: nil];
    config.autoDetectErrors = NO;
    config.codeBundleId = @"codeBundleIdHere";
    config.releaseStage = @"MagicalTestingTime";

    [Bugsnag startBugsnagWithConfiguration:config];
}

- (void)testNilPathDoesNotCreateWatchdog {
    XCTAssertNil([[BSGOutOfMemoryWatchdog alloc] init]);
    XCTAssertNil([[BSGOutOfMemoryWatchdog alloc] initWithSentinelPath:nil
                                                        configuration:nil]);
}

/**
 * Test that the generated OOM report values exist and are correct (where that can be tested)
 */
- (void)testOOMFieldsSetCorrectly {
    NSMutableDictionary *cachedFileInfo = [[[Bugsnag client] oomWatchdog] cachedFileInfo];
    XCTAssertNotNil([cachedFileInfo objectForKey:@"app"]);
    XCTAssertNotNil([cachedFileInfo objectForKey:@"device"]);
    
    NSMutableDictionary *app = [cachedFileInfo objectForKey:@"app"];
    XCTAssertNotNil([app objectForKey:@"bundleVersion"]);
    XCTAssertNotNil([app objectForKey:@"id"]);
    XCTAssertNotNil([app objectForKey:@"inForeground"]);
    XCTAssertNotNil([app objectForKey:@"version"]);
    XCTAssertNotNil([app objectForKey:@"name"]);
    XCTAssertEqual([app valueForKey:@"codeBundleId"], @"codeBundleIdHere");
    XCTAssertEqual([app valueForKey:@"releaseStage"], @"MagicalTestingTime");
    
    NSMutableDictionary *device = [cachedFileInfo objectForKey:@"device"];
    XCTAssertNotNil([device objectForKey:@"osName"]);
    XCTAssertNotNil([device objectForKey:@"osBuild"]);
    XCTAssertNotNil([device objectForKey:@"osVersion"]);
    XCTAssertNotNil([device objectForKey:@"id"]);
    XCTAssertNotNil([device objectForKey:@"model"]);
    XCTAssertNotNil([device objectForKey:@"simulator"]);
    XCTAssertNotNil([device objectForKey:@"wordSize"]);
    XCTAssertEqual([device valueForKey:@"locale"], [[NSLocale currentLocale] localeIdentifier]);
}

@end
