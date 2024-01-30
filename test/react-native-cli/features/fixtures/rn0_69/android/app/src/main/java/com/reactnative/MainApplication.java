package com.reactnative;

import com.bugsnag.android.Configuration;
import com.bugsnag.android.EndpointConfiguration;
import android.app.Application;
import android.content.Context;
import android.util.Log;
import java.util.Map;
import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.config.ReactFeatureFlags;
import com.facebook.soloader.SoLoader;
import com.reactnative.newarchitecture.MainApplicationReactNativeHost;
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
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // packages.add(new MyReactNativePackage());
          packages.add(new CrashyPackage());

          return packages;
        }

        @Override
        protected String getJSMainModuleName() {
          return "index";
        }
      };

  private final ReactNativeHost mNewArchitectureNativeHost =
      new MainApplicationReactNativeHost(this);

  @Override
  public ReactNativeHost getReactNativeHost() {
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      return mNewArchitectureNativeHost;
    } else {
      return mReactNativeHost;
    }
  }

  @Override
  public void onCreate() {
    super.onCreate();
    // If you opted-in for the New Architecture, we enable the TurboModule system
    ReactFeatureFlags.useTurboModules = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED;
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
