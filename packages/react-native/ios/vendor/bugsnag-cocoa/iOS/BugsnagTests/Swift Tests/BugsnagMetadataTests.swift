//
//  BugsnagMetadataTests.swift
//  Tests
//
//  Created by Robin Macharg on 10/02/2020.
//  Copyright © 2020 Bugsnag. All rights reserved.
//

import XCTest

class BugsnagMetadataTests: XCTestCase {

    /**
     * Test that getMetadata() is exposed to Swift correctly
     */
    func testgetMetadataIsExposedCorrectly() {
        let metadata = BugsnagMetadata(dictionary:NSMutableDictionary())
        XCTAssertNil(metadata.getMetadata("dummySection"))
        
        metadata.addAttribute("aName", withValue: "aValue", toTabWithName: "dummySection")
        XCTAssertNotNil(metadata.getMetadata("dummySection"))
    }
}
