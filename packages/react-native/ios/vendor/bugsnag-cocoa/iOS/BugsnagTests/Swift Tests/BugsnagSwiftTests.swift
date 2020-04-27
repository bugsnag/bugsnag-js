//
//  BugsnagSwiftTests.swift
//  Tests
//
//  Created by Robin Macharg on 05/02/2020.
//  Copyright © 2020 Bugsnag. All rights reserved.
//
//  Swift unit tests of global Bugsnag behaviour

import XCTest

class BugsnagSwiftTests: XCTestCase {

    /**
     * Confirm that the addMetadata() method is exposed to Swift correctly
     */
    func testAddMetadataToSectionIsExposedToSwiftCorrectly() {
        let configuration = BugsnagConfiguration(DUMMY_APIKEY_32CHAR_1)
        Bugsnag.start(with: configuration)
        Bugsnag.addMetadata("myValue1", key: "myKey1", section: "mySection1")
        
        let exception1 = NSException(name: NSExceptionName(rawValue: "exception1"), reason: "reason1", userInfo: nil)
        
        Bugsnag.notify(exception1) { (event) in
            // Arbitrary test, replicating the ObjC one
            let value = event.getMetadata(section: "mySection1", key: "myKey1") as? String
            XCTAssertEqual(value, "myValue1")
            return true
        }
    }
    
    /**
     * Confirm that the clearMetadata() method is exposed to Swift correctly
     */
    func testClearMetadataInSectionIsExposedToSwiftCorrectly() {
        Bugsnag.start(with: BugsnagConfiguration(DUMMY_APIKEY_32CHAR_1))
        // We don't need to check method's functioning, only that we can call it this way
        Bugsnag.clearMetadata(section: "testSection")
   }
    
    /**
     * Confirm that the callback-free methods for leaving metadata are exposed to Swift correctly
     */
    func testCallbackFreeMetadataMethods() {
        Bugsnag.leaveBreadcrumb("test2", metadata: nil, type: .manual)
    }
}
