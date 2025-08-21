//
//  NativePromiseRejectionHandledScenario.swift
//  reactnative
//
//  Created by Nick Dowell on 02/12/2020.
//

class NativePromiseRejectionHandledScenario: Scenario {
  
  override func run(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    reject("NativeError", "NativePromiseRejectionHandledScenario", NSError(domain:"com.example", code:408))
  }
}
