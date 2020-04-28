//
//  BugsnagSwiftConfigurationTests.swift
//  Tests
//
//  Created by Robin Macharg on 22/01/2020.
//  Copyright © 2020 Bugsnag. All rights reserved.
//

import XCTest

class BugsnagSwiftConfigurationTests: XCTestCase {

    /**
     * Objective C trailing-NSError* initializers are translated into throwing
     * Swift methods, allowing us to fail gracefully (at the expense of a more-explicit
     * (read: longer) ObjC invocation).
     */
    func testDesignatedInitializerHasCorrectNS_SWIFT_NAME() {
        let config = BugsnagConfiguration(DUMMY_APIKEY_16CHAR)
        XCTAssertEqual(config.apiKey, DUMMY_APIKEY_16CHAR)
    }
}
