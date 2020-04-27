//
// Created by Jamie Lynch on 02/08/2018.
// Copyright (c) 2018 Bugsnag. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <XCTest/XCTest.h>

#import "BugsnagEvent.h"

@interface BugsnagThreadSerializationTest : XCTestCase
@end

@interface BugsnagEvent ()
- (NSDictionary *)toJson;
- (instancetype)initWithKSReport:(NSDictionary *)report;
@end

@implementation BugsnagThreadSerializationTest

- (void)testEmptyThreads {
    BugsnagEvent *event = [self generateReportWithThreads:@[]];
    NSArray *threads = [event toJson][@"threads"];
    XCTAssertTrue(threads.count == 0);
}

- (void)testThreadSerialisation {
    NSArray *trace = @[
            @{
                    @"backtrace": @{
                    @"contents": @[
                            @{
                                    @"instruction_addr": @4438096107,
                                    @"object_addr": @4438048768,
                                    @"object_name": @"Bugsnag Test App",
                                    @"symbol_addr": @4438048768,
                                    @"symbol_name": @"_mh_execute_header",
                            }
                    ],
                    @"skipped": @NO,
            },
                    @"crashed": @YES,
                    @"current_thread": @YES,
                    @"index": @0
            },
            @{
                    @"backtrace": @{
                    @"contents": @[
                            @{
                                    @"instruction_addr": @4510040722,
                                    @"object_addr": @4509921280,
                                    @"object_name": @"libsystem_kernel.dylib",
                                    @"symbol_addr": @4510040712,
                                    @"symbol_name": @"__workq_kernreturn",
                            }
                    ],
                    @"skipped": @NO,
            },
                    @"crashed": @NO,
                    @"current_thread": @NO,
                    @"index": @1
            },
    ];

    BugsnagEvent *event = [self generateReportWithThreads:trace];
    NSArray *threads = [event toJson][@"threads"];
    XCTAssertTrue(threads.count == 2);

    // first thread is crashed, should be serialised and contain 'errorReportingThread' flag
    NSDictionary *firstThread = threads[0];
    XCTAssertEqualObjects(@"0", firstThread[@"id"]);
    XCTAssertEqualObjects(@"cocoa", firstThread[@"type"]);
    XCTAssertNotNil(firstThread[@"stacktrace"]);
    XCTAssertTrue(firstThread[@"errorReportingThread"]);

    // second thread is not crashed, should not contain 'errorReportingThread' flag
    NSDictionary *secondThread = threads[1];
    XCTAssertEqualObjects(@"1", secondThread[@"id"]);
    XCTAssertEqualObjects(@"cocoa", secondThread[@"type"]);
    XCTAssertNotNil(secondThread[@"stacktrace"]);
    XCTAssertFalse([secondThread[@"errorReportingThread"] boolValue]);
}

- (BugsnagEvent *)generateReportWithThreads:(NSArray *)threads {
    return [[BugsnagEvent alloc] initWithKSReport:@{@"crash": @{@"threads": threads}}];
}

@end
