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
        
        do {
            let _ = try BugsnagConfiguration(DUMMY_APIKEY_16CHAR)
            XCTFail("Erronoeusly initialized a BugsnagConfiguration object with an invalid apiKey")
        }
        catch let e as NSError {
            XCTAssertEqual(e.domain, BSGConfigurationErrorDomain)
            XCTAssertEqual(e.code, BSGConfigurationErrorCode.invalidApiKey.rawValue)
        }
        
        do {
            let config = try BugsnagConfiguration(DUMMY_APIKEY_32CHAR_1)
            XCTAssertEqual(config?.apiKey, DUMMY_APIKEY_32CHAR_1)
        }
        catch let e as NSError {
            XCTFail("Failed to initialize a BugsnagConfiguration object with a correct apiKey: \(e.domain), \(e.code)")
        }
    }
}
