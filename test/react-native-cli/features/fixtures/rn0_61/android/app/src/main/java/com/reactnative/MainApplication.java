package com.reactnative;

import com.bugsnag.android.Configuration;
import com.bugsnag.android.EndpointConfiguration;
import android.app.Application;
import android.content.Context;
import android.util.Log;
import java.util.Map;
import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.soloader.SoLoader;
import java.lang.reflect.InvocationTargetException;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost =
      new ReactNativeHost(this) {
        @Override
        public boolean getUseDeveloperSupport() {
          return BuildConfig.DEBUG;
        }

        @Override
        protected List<ReactPackage> getPackages() {
          @SuppressWarnings("UnnecessaryLocalVariable")
          List<ReactPackage> packages = new PackageList(this).getPackages();
          packages.add(new CrashyPackage());
          return packages;
        }

        @Override
        protected String getJSMainModuleName() {
          return "index";
        }
      };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);
  }

  private Configuration createConfiguration() {
    TestUtils testUtils = new TestUtils();
    Map<String, String> defaultParams = testUtils.loadDefaultParams(this);
    Configuration config = new Configuration(defaultParams.get("apiKey"));
    String mazeAddress = testUtils.getMazeRunnerAddress(this);
    String notifyEndpoint = "http://" + mazeAddress + "/notify";
    String sessionEndpoint = "http://" + mazeAddress + "/sessions";
    config.setEndpoints(new EndpointConfiguration(notifyEndpoint, sessionEndpoint));
    config.addMetadata("default", defaultParams);
    return config;
  }
}
