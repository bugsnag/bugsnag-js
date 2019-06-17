package com.bugsnag.reactnative;

import android.content.Context;
// import com.bugsnag.android.AppData;
// import com.bugsnag.android.BreadcrumbType;
import com.bugsnag.android.Bugsnag;
import com.bugsnag.android.Client;
import com.bugsnag.android.Configuration;
// import com.bugsnag.android.MetaData;
// import com.bugsnag.android.User;
import com.facebook.react.ReactPackage;
// import com.facebook.react.bridge.Arguments;
// import com.facebook.react.bridge.JavaScriptModule;
// import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
// import com.facebook.react.bridge.ReadableMapKeySetIterator;
// import com.facebook.react.bridge.WritableMap;

// import java.util.Arrays;
// import java.util.Collections;
// import java.util.HashMap;
// import java.util.List;
// import java.util.Map;
import java.util.logging.Logger;

public class BugsnagReactNative extends ReactContextBaseJavaModule {

  private ReactContext reactContext;
  private String libraryVersion;
  private String bugsnagAndroidVersion;
  static final Logger logger = Logger.getLogger("bugsnag-react-native");

  public static ReactPackage getPackage() {
    return new BugsnagPackage();
  }
  //
  // /**
  //  * Initializes the crash handler. Uses the default options and using the API key stored in the
  //  * following locations (in order of priority): * the package.json file nested under "bugsnag"
  //  *
  //  * <p>{"bugsnag":{"apiKey": "your-key"}}
  //  *
  //  * <p>* the AndroidManifest.xml file using a meta-data element
  //  *
  //  * <p><application> <meta-data android:name="com.bugsnag.android.API_KEY" android:value="your-key"
  //  * /> </application>
  //  *
  //  * <p>Native initialization is only required if you wish to see crash reports originating from
  //  * before React Native initializes (and have an accurate stability score).
  //  */
  // public static Client start(Context context) {
  //   Client client = Bugsnag.init(context);
  //   // The first session starts during JS initialization
  //   // Applications which have specific components in RN instead of the primary
  //   // way to interact with the application should instead leverage startSession
  //   // manually.
  //   client.setAutoCaptureSessions(false);
  //   return client;
  // }
  //
  // /**
  //  * Initializes the crash handler with the default options.
  //  *
  //  * <p>Native initialization is only required if you wish to see crash reports originating from
  //  * before React Native initializes (and have an accurate stability score).
  //  *
  //  * @param APIKey the API key to use when sending error reports
  //  */
  // public static Client startWithApiKey(Context context, String APIKey) {
  //   Client client = Bugsnag.init(context, APIKey);
  //   client.setAutoCaptureSessions(false);
  //   return client;
  // }
  //
  // /**
  //  * Initializes the crash handler with custom options. Any options passed here can be overridden
  //  * when initializing the JS layer.
  //  *
  //  * <p>Native initialization is only required if you wish to see crash reports originating from
  //  * before React Native initializes (and have an accurate stability score).
  //  *
  //  * @param config the configuration options to use
  //  */
  // public static Client startWithConfiguration(Context context, Configuration config) {
  //   config.setAutoCaptureSessions(false);
  //   return Bugsnag.init(context, config);
  // }

  public BugsnagReactNative(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
  }

  // @Override
  // public Map<String, Object> getConstants() {
  //   HashMap<String, Object> constants = new HashMap<>();
  //   Client client = getClient();
  //   if (client != null) {
  //     Configuration config = client.getConfig();
  //     String key = config.getApiKey();
  //     constants.put("apiKey", key);
  //   }
  //   // TODO: if bugsnag has not been started, it would be nice to read the manifest
  //   // and get the default api key. This is how it works on iOS.
  //   return constants;
  // }
  //
  // // @Override
  // public boolean hasConstants() {
  //   return true;
  // }
  //
  @Override
  public String getName() {
    return "BugsnagReactNative";
  }

  /** Start a new session. */
  @ReactMethod
  public void startSession() {
    Bugsnag.startSession();
  }

  /** Stop the current session. */
  @ReactMethod
  public void stopSession() {
    Bugsnag.stopSession();
  }

  /** Resume the previously started session or start a new one if none available. */
  @ReactMethod
  public void resumeSession() {
    Bugsnag.resumeSession();
  }
  //
  // /**
  //  * Updates the native configuration with any changes from the JavaScript layer. Resolves with the
  //  * final configuration once defaults for unspecified options are applied.
  //  *
  //  * @param options a serialized version of the JavaScript layer configuration
  //  */
  // @ReactMethod(isBlockingSynchronousMethod = true)
  // public WritableMap configureJSLayer(ReadableMap options) {
  //   WritableMap result = Arguments.createMap();
  //   // TODO: export updated config
  //   return result;
  // }
  //
  // private BreadcrumbType parseBreadcrumbType(String value) {
  //     for (BreadcrumbType type : BreadcrumbType.values()) {
  //         if (type.toString().equals(value)) {
  //             return type;
  //         }
  //     }
  //     return BreadcrumbType.MANUAL;
  // }
  //
  /** Leaves a breadcrumb. */
  @ReactMethod
  public void leaveBreadcrumb(ReadableMap options) {
    // Bugsnag.leaveBreadcrumb(
    //     options.getString("name"),
    //     parseBreadcrumbType(options.getString("type")),
    //     readStringMap(options.getMap("metadata")));
  }

  /** Deliver the report. */
  @ReactMethod
  public void deliver(ReadableMap payload, Promise promise) {
    // TODO: deliver payload immediately, caching upon failure
    promise.resolve(null);
  }

  /** Breadcrumbs, app info, and device info available in the native layer. */
  @ReactMethod
  public void nativePayloadInfo(Promise promise) {
  //   // TODO: fill in nativePayloadInfo: session, metadata, threads
  //   WritableMap result = Arguments.createMap();
  //   Client client = getClient();
  //   Configuration config = client.getConfig();
  //   MetaData metadata = config.getMetaData();
  //
  //   User user = client.getUser();
  //   WritableMap userInfo = Arguments.createMap();
  //   userInfo.putString("id", user.getId());
  //   userInfo.putString("name", user.getName());
  //   userInfo.putString("email", user.getEmail());
  //   result.putMap("user", userInfo);
  //
  //   result.putMap("device", Arguments.makeNativeMap(client.getDeviceData().getDeviceData()));
  //
  //   AppData appData = client.getAppData();
  //   result.putMap("app", Arguments.makeNativeMap(appData.getAppData()));
  //   String context = config.getContext();
  //   result.putString("context", context != null ? context : appData.getActiveScreenClass());
  //
  //   WritableMap breadcrumbs = Arguments.createMap();
  //   for (Breadcrumb crumb : client.getBreadcrumbs()) {
  //     WritableMap map = Arguments.createMap();
  //     map.putString("type", crumb.getType().toString());
  //     map.putString("name", crumb.getName());
  //     map.putString("timestamp", crumb.getTimestamp());
  //     map.putMap("metaData", Arguments.makeNativeMap(crumb.getMetadata()));
  //     breadcrumbs.pushMap(map);
  //   }
  //   result.putArray("breadcrumbs", breadcrumbs);
  //
    promise.resolve("");
  }

  /** Update configuration based on props set on the JavaScript layer client. */
  @ReactMethod
  public void updateClientProperty(ReadableMap options) {}

  // /** Convert a typed map into a string Map */
  // private Map<String, String> readStringMap(ReadableMap map) {
  //   Map<String, String> output = new HashMap<>();
  //   ReadableMapKeySetIterator iterator = map.keySetIterator();
  //   while (iterator.hasNextKey()) {
  //     String key = iterator.nextKey();
  //     ReadableMap pair = map.getMap(key);
  //     switch (pair.getString("type")) {
  //       case "boolean":
  //         output.put(key, String.valueOf(pair.getBoolean("value")));
  //         break;
  //       case "number":
  //         output.put(key, String.valueOf(pair.getDouble("value")));
  //         break;
  //       case "string":
  //         output.put(key, pair.getString("value"));
  //         break;
  //       case "map":
  //         output.put(key, String.valueOf(readStringMap(pair.getMap("value"))));
  //         break;
  //     }
  //   }
  //   return output;
  // }
  // //
  // private Client getClient() {
  //   try {
  //     return Bugsnag.getClient();
  //   } catch (IllegalStateException exception) {
  //     return null;
  //   }
  // }
  //
  // private Client getOrCreateClient(String apiKey) {
  //   Client client = getClient();
  //   if (client != null) {
  //     return client;
  //   } else if (apiKey != null) {
  //     return Bugsnag.init(this.reactContext, apiKey);
  //   } else {
  //     return Bugsnag.init(this.reactContext);
  //   }
  // }
}
