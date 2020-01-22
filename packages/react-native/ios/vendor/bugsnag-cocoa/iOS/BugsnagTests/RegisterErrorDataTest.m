//
// Created by Jamie Lynch on 11/06/2018.
// Copyright (c) 2018 Bugsnag. All rights reserved.
//


#import <Foundation/Foundation.h>
#import <XCTest/XCTest.h>

@interface RegisterErrorData
+ (instancetype)errorDataFromThreads:(NSArray *)threads;
@property (nonatomic, strong) NSString *errorClass;
@property (nonatomic, strong) NSString *errorMessage;
@end

@interface RegisterErrorDataTest : XCTestCase
@end

@implementation RegisterErrorDataTest


- (void)testNilAddresses {
    XCTAssertNil([RegisterErrorData errorDataFromThreads:nil]);
}

- (void)testEmptyAddresses {
    XCTAssertNil([RegisterErrorData errorDataFromThreads:@[]]);
}

- (void)testEmptyCrashedThreadDict {
    NSDictionary *thread = @{
            @"crashed": @YES
    };
    XCTAssertNil([RegisterErrorData errorDataFromThreads:@[thread]]);
}

- (void)testEmptyNotableAddresses {
    NSDictionary *thread = @{
            @"crashed": @YES,
            @"notable_addresses": @{}
    };
    RegisterErrorData *data = [RegisterErrorData errorDataFromThreads:@[thread]];
    XCTAssertNil(data);
}

- (void)testEmptyContentValue {
    NSDictionary *thread = @{
            @"crashed": @YES,
            @"notable_addresses": @{
                    @"hello_world": @{}
            }
    };
    RegisterErrorData *data = [RegisterErrorData errorDataFromThreads:@[thread]];
    XCTAssertNil(data);
}

- (void)testNilValueImplicit {
    NSDictionary *thread = @{
            @"crashed": @YES,
            @"notable_addresses": @{
                    @"hello_world": @{
                            @"type": @"string"
                    }
            }
    };
    RegisterErrorData *data = [RegisterErrorData errorDataFromThreads:@[thread]];
    XCTAssertNil(data);
}

- (void)testNilValueExplicit {
    NSDictionary *thread = @{
            @"crashed": @YES,
            @"notable_addresses": @{
                    @"hello_world": @{
                            @"type": @"string",
                            @"value": [NSNull null]
                    }
            }
    };
    RegisterErrorData *data = [RegisterErrorData errorDataFromThreads:@[thread]];
    XCTAssertNil(data);
}

- (void)testHasTypeAndValue{
    NSDictionary *thread = @{
            @"crashed": @YES,
            @"notable_addresses": @{
                    @"hello_world": @{
                            @"type": @"string",
                            @"value": @"Hello, World!"
                    }
            }
    };
    RegisterErrorData *data = [RegisterErrorData errorDataFromThreads:@[thread]];
    XCTAssertNil(data);
}

- (void)testFatalError {
    NSDictionary *thread = @{
            @"crashed": @YES,
            @"notable_addresses": @{
                    @"hello_world": @{
                            @"type": @"string",
                            @"value": @"fatal error"
                    }
            }
    };
    RegisterErrorData *data = [RegisterErrorData errorDataFromThreads:@[thread]];
    XCTAssertNotNil(data);
    XCTAssertEqualObjects(@"fatal error", data.errorClass);
    XCTAssertEqualObjects(@"", data.errorMessage);
}

- (void)testAssertionFailed {
    NSDictionary *thread = @{
            @"crashed": @YES,
            @"notable_addresses": @{
                    @"hello_world": @{
                            @"type": @"string",
                            @"value": @"assertion failed"
                    }
            }
    };
    RegisterErrorData *data = [RegisterErrorData errorDataFromThreads:@[thread]];
    XCTAssertNotNil(data);
    XCTAssertEqualObjects(@"assertion failed", data.errorClass);
    XCTAssertEqualObjects(@"", data.errorMessage);
}

- (void)testPreconditionFailed {
    NSDictionary *thread = @{
            @"crashed": @YES,
            @"notable_addresses": @{
                    @"hello_world": @{
                            @"type": @"string",
                            @"value": @"precondition failed"
                    }
            }
    };
    RegisterErrorData *data = [RegisterErrorData errorDataFromThreads:@[thread]];
    XCTAssertNotNil(data);
    XCTAssertEqualObjects(@"precondition failed", data.errorClass);
    XCTAssertEqualObjects(@"", data.errorMessage);
}

- (void)testSingleMessageValue {
    NSDictionary *thread = @{
            @"crashed": @YES,
            @"notable_addresses": @{
                    @"hello_world": @{
                            @"type": @"string",
                            @"value": @"fatal error"
                    },
                    @"message": @{
                            @"type": @"string",
                            @"value": @"Single Message"
                    }
            }
    };
    RegisterErrorData *data = [RegisterErrorData errorDataFromThreads:@[thread]];
    XCTAssertEqualObjects(@"Single Message", data.errorMessage);
}

- (void)testMultiMessageValue {
    NSDictionary *thread = @{
            @"crashed": @YES,
            @"notable_addresses": @{
                    @"hello_world": @{
                            @"type": @"string",
                            @"value": @"fatal error"
                    },
                    @"message": @{
                            @"type": @"string",
                            @"value": @"A is for aardvark"
                    },
                    @"message2": @{
                            @"type": @"string",
                            @"value": @"Z is for zebra"
                    },
                    @"message3": @{
                            @"type": @"string",
                            @"value": @"C is for crayfish"
                    }
            }
    };
    RegisterErrorData *data = [RegisterErrorData errorDataFromThreads:@[thread]];
    XCTAssertEqualObjects(@"A is for aardvark | C is for crayfish | Z is for zebra", data.errorMessage);
}

- (void)testStackExcluded {
    NSDictionary *thread = @{
            @"crashed": @YES,
            @"notable_addresses": @{
                    @"hello_world": @{
                            @"type": @"string",
                            @"value": @"fatal error"
                    },
                    @"message": @{
                            @"type": @"stack",
                            @"value": @"0xf0924501"
                    }
            }
    };
    RegisterErrorData *data = [RegisterErrorData errorDataFromThreads:@[thread]];
    XCTAssertEqualObjects(@"", data.errorMessage);
}

- (void)testOtherTypesExcluded {
    NSDictionary *thread = @{
            @"crashed": @YES,
            @"notable_addresses": @{
                    @"hello_world": @{
                            @"type": @"string",
                            @"value": @"fatal error"
                    },
                    @"message": @{
                            @"type": @"someOtherType",
                            @"value": @"do not serialise"
                    }
            }
    };
    RegisterErrorData *data = [RegisterErrorData errorDataFromThreads:@[thread]];
    XCTAssertEqualObjects(@"", data.errorMessage);
}

- (void)testFilepathExcluded {
    NSDictionary *thread = @{
            @"crashed": @YES,
            @"notable_addresses": @{
                    @"hello_world": @{
                            @"type": @"string",
                            @"value": @"fatal error"
                    },
                    @"message": @{
                            @"type": @"string",
                            @"value": @"/usr/share/locale"
                    }
            }
    };
    RegisterErrorData *data = [RegisterErrorData errorDataFromThreads:@[thread]];
    XCTAssertEqualObjects(@"", data.errorMessage);
}

- (void)testForwardSlashIncluded {
    NSDictionary *thread = @{
            @"crashed": @YES,
            @"notable_addresses": @{
                    @"hello_world": @{
                            @"type": @"string",
                            @"value": @"fatal error"
                    },
                    @"message": @{
                            @"type": @"string",
                            @"value": @"usr/share"
                    }
            }
    };
    RegisterErrorData *data = [RegisterErrorData errorDataFromThreads:@[thread]];
    XCTAssertEqualObjects(@"usr/share", data.errorMessage);
}

@end
