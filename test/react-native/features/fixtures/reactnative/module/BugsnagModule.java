package com.reactnative.module;

import android.util.Log;

import com.bugsnag.android.BreadcrumbType;
import com.bugsnag.android.Bugsnag;
import com.bugsnag.android.Configuration;
import com.bugsnag.android.EndpointConfiguration;
import com.bugsnag.android.Logger;
import com.facebook.react.bridge.NoSuchKeyException;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.reactnative.scenarios.Scenario;

import java.io.File;
import java.util.HashSet;
import java.util.Set;

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
  public void clearPersistentData() {
    File cache = reactContext.getCacheDir();
    deleteRecursive(cache, "bugsnag-native");
    deleteRecursive(cache, "bugsnag-errors");
    deleteRecursive(cache, "bugsnag-sessions");
  }

  public void deleteRecursive(File file) {
    if (file.isDirectory()) {
      for (File child : file.listFiles()) {
        deleteRecursive(child);
      }
    }
    file.delete();
  }

  public void deleteRecursive(File basedir, String subdir) {
    try {
        deleteRecursive(new File(basedir, subdir));
    } catch (Exception ignored) {
    }
  }

  @ReactMethod
  public void runScenario(String scenarioName, Promise promise) {
      Scenario testScenario = factory.testScenarioForName(scenarioName, reactContext);
      testScenario.run(promise);

      // this is a no-op if the promise did not get resolved/rejected, but it means the scenarios
      // don't have to do anything with the promise if they don't want.
      promise.resolve(true);
  }

  @ReactMethod
  public void startBugsnag(ReadableMap options, Promise promise) {
    Configuration bugsnagConfig = createConfiguration(options);
    bugsnagConfig.setLogger(new Logger() {
      private static final String TAG = "Bugsnag";

      @Override
      public void e(String msg) {
          Log.e(TAG, msg);
      }

      @Override
      public void e(String msg, Throwable throwable) {
          Log.e(TAG, msg, throwable);
      }

      @Override
      public void w(String msg) {
          Log.w(TAG, msg);
      }

      @Override
      public void w(String msg, Throwable throwable) {
          Log.w(TAG, msg, throwable);
      }

      @Override
      public void i(String msg) {
          Log.i(TAG, msg);
      }

      @Override
      public void i(String msg, Throwable throwable) {
          Log.i(TAG, msg, throwable);
      }

      @Override
      public void d(String msg) {
          Log.d(TAG, msg);
      }

      @Override
      public void d(String msg, Throwable throwable) {
          Log.d(TAG, msg, throwable);
      }
    });
    Bugsnag.start(reactContext, bugsnagConfig);
    promise.resolve(true);
  }

  @ReactMethod
  public String getMazeRunnerAddress() {
    ConfigFileReader configReader = new ConfigFileReader();
    String mazeAddress = configReader.getMazeRunnerAddress(reactContext);
    Log.i("Bugsnag", "Got maze address ")
    return mazeAddress;
  }

  private Configuration createConfiguration(ReadableMap options) {
      Configuration config = new Configuration(options.getString("apiKey"));
      config.setAutoTrackSessions(options.getBoolean("autoTrackSessions"));

      if (options.hasKey("endpoint")) {
        config.setEndpoints(new EndpointConfiguration(options.getString("endpoint"), options.getString("endpoint")));
      }
      else if (options.hasKey("endpoints")) {
          ReadableMap endpoints = options.getMap("endpoints");
          config.setEndpoints(new EndpointConfiguration(endpoints.getString("notify"), endpoints.getString("sessions")));
      }

      if (options.hasKey("appVersion")) {
        String appVersion = null;
        appVersion = options.getString("appVersion");
        config.setAppVersion(appVersion);
      }

      if (options.hasKey("appType")) {
        String appType = options.getString("appType");
        config.setAppType(appType);
      }

      if (options.hasKey("releaseStage")) {
        String releaseStage = options.getString("releaseStage");
        config.setReleaseStage(releaseStage);
      }

      if (options.hasKey("enabledReleaseStages")) {
        Set<String> enabledReleaseStages = new HashSet<String>();
        ReadableArray ar = options.getArray("enabledReleaseStages");
        for (int i = 0; i < ar.size(); i++) enabledReleaseStages.add(ar.getString(i));
        config.setEnabledReleaseStages(enabledReleaseStages);
      }

      if (options.hasKey("enabledBreadcrumbTypes")) {
        if (options.isNull("enabledBreadcrumbTypes")) {
            config.setEnabledBreadcrumbTypes(null);
        } else {
            Set<BreadcrumbType> enabledBreadcrumbTypes = new HashSet<BreadcrumbType>();
            ReadableArray ar = options.getArray("enabledBreadcrumbTypes");
            for (int i = 0; i < ar.size(); i++) {
                BreadcrumbType type = BreadcrumbType.valueOf(ar.getString(i).toUpperCase());
                enabledBreadcrumbTypes.add(type);
            }
            config.setEnabledBreadcrumbTypes(enabledBreadcrumbTypes);
        }
      }

      if (options.hasKey("redactedKeys")) {
        Set<String> redactedKeys = new HashSet<String>();
        ReadableArray rkAr = options.getArray("redactedKeys");
        for (int i = 0; i < rkAr.size(); i++) redactedKeys.add(rkAr.getString(i));
        config.setRedactedKeys(redactedKeys);
      }

      try {
        ReadableMap configMetaData = options.getMap("configMetaData");
        if (configMetaData != null) {
          config.addMetadata("nativedata", configMetaData.toHashMap());
        }
      } catch (NoSuchKeyException e) {
        // ignore NoSuchKeyException
      }

      return config;
  }
}
