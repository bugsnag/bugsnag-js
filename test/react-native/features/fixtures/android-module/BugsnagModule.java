package com.<ANDROID_PACKAGE_PATH>;

import com.bugsnag.android.Bugsnag;
import com.bugsnag.android.Configuration;
import com.bugsnag.android.EndpointConfiguration;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.Callback;
import com.<ANDROID_PACKAGE_PATH>.scenarios.Scenario;

public class BugsnagModule extends ReactContextBaseJavaModule {
  private static ReactApplicationContext reactContext;

  private ScenarioFactory factory = new ScenarioFactory();

  BugsnagModule(ReactApplicationContext context) {
    super(context);
    reactContext = context;
  }

  @Override
  public String getName() {
    return "BugsnagTestInterface";
  }

  @ReactMethod
  public void runScenario(String scenarioName, Callback completeCallback) {
      Scenario testScenario = factory.testScenarioForName(scenarioName, reactContext);
      testScenario.run();
      completeCallback.invoke();
  }

  @ReactMethod
  public void startBugsnag(ReadableMap options, Callback readyCallback) {
    Configuration bugsnagConfig = createConfiguration(options);
    Bugsnag.start(reactContext, bugsnagConfig);
    readyCallback.invoke();
  }

  private Configuration createConfiguration(ReadableMap options) {
      Configuration config = new Configuration(options.getString("apiKey"));
      config.setEndpoints(new EndpointConfiguration(options.getString("endpoint"), options.getString("endpoint")));
      config.setAutoTrackSessions(options.getBoolean("autoTrackSessions"));
      return config;
  }
}