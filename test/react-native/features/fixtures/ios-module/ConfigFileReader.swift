//
//  ConfigFileReader.swift
//  reactnative
//
//  Created by Alex Moinet on 04/05/2023.
//  Copyright © 2023 Facebook. All rights reserved.
//

import Foundation

class FixtureConfig: Codable {
    var maze_address: String
}

class ConfigFileReader:NSObject {
  func loadMazeRunnerAddress() -> String {
          let bsAddress = "http://bs-local.com:9339"
          
          // Only iOS 12 and above will run on BitBar for now
          if #available(iOS 12.0, *) {} else {
              return bsAddress;
          }
          
          for _ in 1...60 {
              let documentsUrl = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]

                NSLog("Reading Maze Runner address from fixture_config.json")
              do {
                  let fileUrl = URL(fileURLWithPath: "fixture_config",
                                    relativeTo: documentsUrl).appendingPathExtension("json")
                  let savedData = try Data(contentsOf: fileUrl)
                  if let contents = String(data: savedData, encoding: .utf8) {
                      let decoder = JSONDecoder()
                      let jsonData = contents.data(using: .utf8)
                      let config = try decoder.decode(FixtureConfig.self, from: jsonData!)
                      let address = "http://" + config.maze_address
                      NSLog("Using Maze Runner address: " + address)
                      return address
                  }
              }
              catch let error as NSError {
                NSLog("Failed to read fixture_config.json: \(error)")
              }
            NSLog("Waiting for fixture_config.json to appear")
              sleep(1)
          }

      NSLog("Unable to read from fixture_config.json, defaulting to BrowserStack environment")
          return bsAddress;
      }
}
