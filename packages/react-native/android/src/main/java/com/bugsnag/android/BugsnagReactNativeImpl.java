package com.bugsnag.android;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import kotlin.Unit;
import kotlin.jvm.functions.Function1;

import java.util.Map;

import static com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter;

class BugsnagReactNativeImpl {

  static final String MODULE_NAME = "BugsnagReactNative";

  private static final String UPDATE_CONTEXT = "ContextUpdate";
  private static final String UPDATE_USER = "UserUpdate";
  private static final String UPDATE_METADATA = "MetadataUpdate";
  private static final String ADD_FEATURE_FLAG = "AddFeatureFlag";
  private static final String CLEAR_FEATURE_FLAG = "ClearFeatureFlag";
  private static final String SYNC_KEY = "bugsnag::sync";
  private static final String DATA_KEY = "data";

  private final ReactApplicationContext reactContext;

  private RCTDeviceEventEmitter bridge;
  private BugsnagReactNativePlugin plugin;
  private Logger logger;

  public BugsnagReactNativeImpl(ReactApplicationContext reactContext) {
    this.reactContext = reactContext;
  }

  private void logFailure(String msg, Throwable exc) {
    logger.e("Failed to call " + msg + " on bugsnag-plugin-react-native, continuing", exc);
  }

  public void configureAsync(ReadableMap env, Promise promise) {
    promise.resolve(configure(env));
  }

  public WritableMap configure(ReadableMap env) {
    Client client;
    try {
      client = Bugsnag.getClient();
    } catch (IllegalStateException ise) {
      throw new IllegalStateException("Failed to initialise the native Bugsnag Android client, please check you have " +
        "added Bugsnag.start() in the onCreate() method of your Application subclass");
    }

    try {
      bridge = reactContext.getJSModule(RCTDeviceEventEmitter.class);
      logger = client.getLogger();
      plugin = (BugsnagReactNativePlugin) client.getPlugin(BugsnagReactNativePlugin.class);
      plugin.registerForMessageEvents(new Function1<MessageEvent, Unit>() {
        @Override
        public Unit invoke(MessageEvent messageEvent) {
          emitEvent(messageEvent);
          return Unit.INSTANCE;
        }
      });

      return ReactNativeCompat.toWritableMap(plugin.configure(env.toHashMap()));
    } catch (Throwable error) {
      logFailure("configure", error);
      return new WritableNativeMap();
    }
  }

  @SuppressWarnings("unchecked")
  void emitEvent(MessageEvent event) {
    logger.d("Received MessageEvent: " + event.getType());

    WritableMap map = Arguments.createMap();
    map.putString("type", event.getType());

    switch (event.getType()) {
      case UPDATE_CONTEXT:
        map.putString(DATA_KEY, (String) event.getData());
        break;
      case UPDATE_USER:
      case UPDATE_METADATA:
      case ADD_FEATURE_FLAG:
      case CLEAR_FEATURE_FLAG:
        map.putMap(DATA_KEY, event.getData() != null
          ? Arguments.makeNativeMap((Map<String, Object>) event.getData())
          : null);
        break;
      default:
        logger.w("Received unknown message event " + event.getType() + ", ignoring");
    }

    bridge.emit(SYNC_KEY, map);
  }

  void updateCodeBundleId(@Nullable String id) {
    try {
      plugin.updateCodeBundleId(id);
    } catch (Throwable exc) {
      logFailure("updateCodeBundleId", exc);
    }
  }

  void leaveBreadcrumb(@NonNull ReadableMap map) {
    try {
      plugin.leaveBreadcrumb(map.toHashMap());
    } catch (Throwable exc) {
      logFailure("leaveBreadcrumb", exc);
    }
  }

  void startSession() {
    try {
      plugin.startSession();
    } catch (Throwable exc) {
      logFailure("startSession", exc);
    }
  }

  void pauseSession() {
    try {
      plugin.pauseSession();
    } catch (Throwable exc) {
      logFailure("pauseSession", exc);
    }
  }

  void resumeSession() {
    try {
      plugin.resumeSession();
    } catch (Throwable exc) {
      logFailure("resumeSession", exc);
    }
  }

  void resumeSessionOnStartup() {
    try {
      Client client = Bugsnag.getClient();
      if (Boolean.TRUE.equals(client.sessionTracker.isInForeground())) {
        plugin.resumeSession();
      }
    } catch (Throwable exc) {
      logFailure("resumeSessionOnStartup", exc);
    }
  }

  void updateContext(@Nullable String context) {
    try {
      plugin.updateContext(context);
    } catch (Throwable exc) {
      logFailure("updateContext", exc);
    }
  }

  void addMetadata(@NonNull String section, @Nullable ReadableMap data) {
    try {
      plugin.addMetadata(section, data != null ? data.toHashMap() : null);
    } catch (Throwable exc) {
      logFailure("addMetadata", exc);
    }
  }

  void clearMetadata(@NonNull String section, @Nullable String key) {
    try {
      plugin.clearMetadata(section, key);
    } catch (Throwable exc) {
      logFailure("clearMetadata", exc);
    }
  }

  void updateUser(@Nullable String id, @Nullable String email, @Nullable String name) {
    try {
      plugin.updateUser(id, email, name);
    } catch (Throwable exc) {
      logFailure("updateUser", exc);
    }
  }

  boolean dispatch(@NonNull ReadableMap payload) {
    try {
      plugin.dispatch(payload.toHashMap());
      return true;
    } catch (Throwable exc) {
      logFailure("dispatch", exc);
      return false;
    }
  }

  void dispatchAsync(@NonNull ReadableMap payload, @NonNull Promise promise) {
    promise.resolve(dispatch(payload));
  }

  WritableMap getPayloadInfo(@NonNull ReadableMap payload) {
    try {
      boolean unhandled = payload.getBoolean("unhandled");
      Map<String, Object> info = plugin.getPayloadInfo(unhandled);
      return ReactNativeCompat.toWritableMap(info);
    } catch (Throwable exc) {
      logFailure("dispatch", exc);
      return new WritableNativeMap();
    }
  }

  void getPayloadInfoAsync(@NonNull ReadableMap payload, @NonNull Promise promise) {
    promise.resolve(getPayloadInfo(payload));
  }

  void addFeatureFlag(@NonNull String name, @Nullable String variant) {
    try {
      plugin.addFeatureFlag(name, variant);
    } catch (Throwable exc) {
      logFailure("addFeatureFlag", exc);
    }
  }

  void addFeatureFlags(@NonNull ReadableArray flags) {
    try {
      final int flagCount = flags.size();
      for (int index = 0; index < flagCount; index++) {
        ReadableMap flag = flags.getMap(index);
        String name = safeGetString(flag, "name");

        if (name != null) {
          plugin.addFeatureFlag(name, safeGetString(flag, "variant"));
        }
      }
    } catch (Throwable exc) {
      logFailure("addFeatureFlags", exc);
    }
  }

  void clearFeatureFlag(@NonNull String name) {
    try {
      plugin.clearFeatureFlag(name);
    } catch (Throwable exc) {
      logFailure("clearFeatureFlag", exc);
    }
  }

  void clearFeatureFlags() {
    try {
      plugin.clearFeatureFlags();
    } catch (Throwable exc) {
      logFailure("clearFeatureFlags", exc);
    }
  }

  private String safeGetString(@NonNull ReadableMap map, @NonNull String key) {
    return map.hasKey(key) ? map.getString(key) : null;
  }
}
