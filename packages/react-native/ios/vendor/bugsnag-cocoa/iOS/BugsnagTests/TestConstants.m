//
//  TestConstants.m
//  Tests
//
//  Created by Robin Macharg on 24/01/2020.
//  Copyright © 2020 Bugsnag. All rights reserved.
//

#import <XCTest/XCTest.h>
#import "BugsnagConfiguration.h"

@interface TestConstants : XCTestCase

@end

@implementation TestConstants

- (void)testConfigurationConstants {
    XCTAssertTrue([BSGConfigurationErrorDomain isEqualToString:@"com.Bugsnag.CocoaNotifier.Configuration"]);
    XCTAssertEqual(BSGConfigurationErrorInvalidApiKey, 0);
}

@end
