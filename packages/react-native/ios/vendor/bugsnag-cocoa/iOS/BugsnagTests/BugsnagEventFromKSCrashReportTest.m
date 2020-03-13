//
//  CreateCrashReportTests.m
//  Tests
//
//  Created by Paul Zabelin on 6/6/19.
//  Copyright © 2019 Bugsnag. All rights reserved.
//

@import XCTest;
@import Bugsnag;

@interface BugsnagEventFromKSCrashReportTest : XCTestCase
@property BugsnagEvent *report;
@end

@implementation BugsnagEventFromKSCrashReportTest

- (void)setUp {
    [super setUp];
    NSBundle *bundle = [NSBundle bundleForClass:[self class]];
    NSString *path = [bundle pathForResource:@"report" ofType:@"json"];
    NSString *contents = [NSString stringWithContentsOfFile:path
                                                   encoding:NSUTF8StringEncoding
                                                      error:nil];
    NSDictionary *dictionary = [NSJSONSerialization
                                JSONObjectWithData:[contents dataUsingEncoding:NSUTF8StringEncoding]
                                options:0
                                error:nil];
    self.report = [[BugsnagEvent alloc] initWithKSReport:dictionary];
}

- (void)tearDown {
    [super tearDown];
    self.report = nil;
}

- (void)testReportDepth {
    XCTAssertEqual(7, self.report.depth);
}

- (void)testReadReleaseStage {
    XCTAssertEqualObjects(self.report.releaseStage, @"production");
}

- (void)testReadNotifyReleaseStages {
    XCTAssertEqualObjects(self.report.notifyReleaseStages,
                          (@[ @"production", @"development" ]));
}

- (void)testReadNotifyReleaseStagesSends {
    XCTAssertTrue([self.report shouldBeSent]);
}

- (void)testAddMetadataAddsNewTab {
    NSDictionary *metadata = @{@"color" : @"blue", @"beverage" : @"tea"};
    [self.report addMetadata:metadata toSectionNamed:@"user prefs"];
    NSDictionary *prefs = self.report.metadata[@"user prefs"];
    XCTAssertEqual(@"blue", prefs[@"color"]);
    XCTAssertEqual(@"tea", prefs[@"beverage"]);
    XCTAssert([prefs count] == 2);
}

- (void)testAddMetadataMergesExistingTab {
    NSDictionary *oldMetadata = @{@"color" : @"red", @"food" : @"carrots"};
    [self.report addMetadata:oldMetadata toSectionNamed:@"user prefs"];
    NSDictionary *metadata = @{@"color" : @"blue", @"beverage" : @"tea"};
    [self.report addMetadata:metadata toSectionNamed:@"user prefs"];
    NSDictionary *prefs = self.report.metadata[@"user prefs"];
    XCTAssertEqual(@"blue", prefs[@"color"]);
    XCTAssertEqual(@"tea", prefs[@"beverage"]);
    XCTAssertEqual(@"carrots", prefs[@"food"]);
    XCTAssert([prefs count] == 3);
}

- (void)testAddAttributeAddsNewTab {
    [self.report addMetadataToSectionNamed:@"prefs"
                                       key:@"color"
                                     value:@"blue"];
    NSDictionary *prefs = self.report.metadata[@"prefs"];
    XCTAssertEqual(@"blue", prefs[@"color"]);
}

- (void)testAddAttributeOverridesExistingValue {
    [self.report addMetadataToSectionNamed:@"prefs"
                                       key:@"color"
                                     value:@"red"];
    [self.report addMetadataToSectionNamed:@"prefs"
                                       key:@"color"
                                     value:@"blue"];
    NSDictionary *prefs = self.report.metadata[@"prefs"];
    XCTAssertEqual(@"blue", prefs[@"color"]);
}

- (void)testAddAttributeRemovesValue {
    [self.report addMetadataToSectionNamed:@"prefs"
                                       key:@"color"
                                     value:@"red"];
    [self.report addMetadataToSectionNamed:@"prefs"
                                       key:@"color"
                                     value:nil];
    NSDictionary *prefs = self.report.metadata[@"prefs"];
    XCTAssertNil(prefs[@"color"]);
}

- (void)testAppVersion {
    NSDictionary *dictionary = [self.report toJson];
    XCTAssertEqualObjects(@"1.0", dictionary[@"app"][@"version"]);
    XCTAssertEqualObjects(@"1", dictionary[@"app"][@"bundleVersion"]);
}

@end
