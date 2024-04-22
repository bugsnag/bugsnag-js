//
//  NativeStackHandledScenario.swift
//  reactnative
//
//  Created by Nick Dowell on 02/12/2020.
//

class NativeStackHandledScenario: Scenario {
  
  override func run(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    reject("NativeError", "NativeStackHandledScenario", NSError(domain:"com.example", code:408))
  }
}
