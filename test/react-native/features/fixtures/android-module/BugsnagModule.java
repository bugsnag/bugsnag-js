package com.<ANDROID_PACKAGE_PATH>;

import java.util.HashSet;
import java.util.Set;

import com.bugsnag.android.Bugsnag;
import com.bugsnag.android.Configuration;
import com.bugsnag.android.EndpointConfiguration;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.NoSuchKeyException;
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

      try {
        String appVersion = null;
        appVersion = options.getString("appVersion");
        config.setAppVersion(appVersion);
      } catch (NoSuchKeyException e) {
        // ignore NoSuchKeyException
      }

      try {
        String appType = options.getString("appType");
        config.setAppType(appType);
      } catch (NoSuchKeyException e) {
        // ignore NoSuchKeyException
      }

      try {
        String releaseStage = options.getString("releaseStage");
        config.setReleaseStage(releaseStage);
      } catch (NoSuchKeyException e) {
        // ignore NoSuchKeyException
      }

      try {
        Set<String> enabledReleaseStages = new HashSet<String>();
        ReadableArray ar = options.getArray("enabledReleaseStages");
        for (int i = 0; i < ar.size(); i++) enabledReleaseStages.add(ar.getString(i));
        config.setEnabledReleaseStages(enabledReleaseStages);
      } catch (NoSuchKeyException e) {
        // ignore NoSuchKeyException
      }

      return config;
  }
}
