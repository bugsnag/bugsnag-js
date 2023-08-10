#import "AppDelegate.h"

#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>

#import <React/RCTAppSetupUtils.h>

#if RCT_NEW_ARCH_ENABLED
#import <React/CoreModulesPlugins.h>
#import <React/RCTCxxBridgeDelegate.h>
#import <React/RCTFabricSurfaceHostingProxyRootView.h>
#import <React/RCTSurfacePresenter.h>
#import <React/RCTSurfacePresenterBridgeAdapter.h>
#import <ReactCommon/RCTTurboModuleManager.h>

#import <react/config/ReactNativeConfig.h>

static NSString *const kRNConcurrentRoot = @"concurrentRoot";

@interface AppDelegate () <RCTCxxBridgeDelegate, RCTTurboModuleManagerDelegate> {
  RCTTurboModuleManager *_turboModuleManager;
  RCTSurfacePresenterBridgeAdapter *_bridgeAdapter;
  std::shared_ptr<const facebook::react::ReactNativeConfig> _reactNativeConfig;
  facebook::react::ContextContainer::Shared _contextContainer;
}
@end
#endif

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  NSLog(@"STARTING APP");
  RCTAppSetupPrepareApp(application);

  RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];

#if RCT_NEW_ARCH_ENABLED
  _contextContainer = std::make_shared<facebook::react::ContextContainer const>();
  _reactNativeConfig = std::make_shared<facebook::react::EmptyReactNativeConfig const>();
  _contextContainer->insert("ReactNativeConfig", _reactNativeConfig);
  _bridgeAdapter = [[RCTSurfacePresenterBridgeAdapter alloc] initWithBridge:bridge contextContainer:_contextContainer];
  bridge.surfacePresenter = _bridgeAdapter.surfacePresenter;
#endif

  NSDictionary *initProps = [self prepareInitialProps];
  UIView *rootView = RCTAppSetupDefaultRootView(bridge, @"rn0_69", initProps);

  if (@available(iOS 13.0, *)) {
    rootView.backgroundColor = [UIColor systemBackgroundColor];
  } else {
    rootView.backgroundColor = [UIColor whiteColor];
  }

  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];
  return YES;
}

BugsnagConfiguration *createConfiguration(void) {
  NSDictionary *options = [[NSBundle mainBundle] infoDictionary][@"bugsnag"];
  NSString *apiKey = options[@"apiKey"];
  NSString *endpoints = options[@"apiKey"];
  BugsnagConfiguration *config = [[BugsnagConfiguration alloc] initWithApiKey:options[@"apiKey"]];
  NSString *notifyEndpoint;
  NSString *sessionsEndpoint;
  NSLog(@"Searching for endpoints");
  NSString *baseAddress = loadMazeRunnerAddress();
  notifyEndpoint = [NSString stringWithFormat:@"%@/notify", baseAddress];
  sessionsEndpoint = [NSString stringWithFormat:@"%@/sessions", baseAddress];
  NSLog(@"Notify endpoint set to: %@\n", notifyEndpoint);
  NSLog(@"Sessions endpoint set to: %@\n", sessionsEndpoint);
  config.endpoints = [[BugsnagEndpointConfiguration alloc] initWithNotify:notifyEndpoint
                                                               sessions:sessionsEndpoint];
  [config setAutoTrackSessions:[[options objectForKey:@"autoTrackSessions"]boolValue]];
  // config.enabledErrorTypes.ooms = NO; // Set by default, will add an override as required
  return config;
}

NSString *loadMazeRunnerAddress(void) {
  static NSString *fieldName = @"maze_address";
  NSString * bsAddress = @"http://bs-local.com:9339";
  
  // Only iOS 12 and above will run on BitBar for now
  if (!@available(macOS 12.0, *)) {
    NSLog(@"Using bs-local.com address on pre iOS 12 devices");
    return bsAddress;
  }
  
  for(int i = 0; i < 60; i++) {
    NSURL *documentsUrl = [NSFileManager.defaultManager URLsForDirectory:NSDocumentDirectory inDomains:NSUserDomainMask][0];
    NSLog(@"Reading Maze Runner address from fixture_config.json");
    @try {
      NSURL *fileUrl = [[NSURL fileURLWithPath:@"fixture_config" relativeToURL:documentsUrl] URLByAppendingPathExtension:@"json"];
      NSData *savedData = [NSData dataWithContentsOfURL:fileUrl];
      if (savedData != nil) {
        NSError *error = nil;
        NSDictionary *json = [NSJSONSerialization JSONObjectWithData:savedData options:0 error:&error];
        if ([json isKindOfClass:NSDictionary.class]) {
          NSString *address = json[fieldName];
          if (address != nil) {
            return [NSString stringWithFormat:@"http://%@", address];
          } else {
            NSLog(@"Failed to read fixture_config.json: field %@ was not found", fieldName);
          }
        } else {
          NSLog(@"Failed to read fixture_config.json: Expected contents to be a dictionary but got %@", json.class);
        }
      }
    } @catch (NSException *exception) {
      NSLog(@"Failed to read fixture_config.json: %@", exception);
    }
    NSLog(@"Waiting for fixture_config.json to appear");
    sleep(1);
  }
  NSLog(@"Unable to read from fixture_config.json, defaulting to BrowserStack environment");
  return bsAddress;
}

/// This method controls whether the `concurrentRoot`feature of React18 is turned on or off.
///
/// @see: https://reactjs.org/blog/2022/03/29/react-v18.html
/// @note: This requires to be rendering on Fabric (i.e. on the New Architecture).
/// @return: `true` if the `concurrentRoot` feture is enabled. Otherwise, it returns `false`.
- (BOOL)concurrentRootEnabled
{
  // Switch this bool to turn on and off the concurrent root
  return true;
}

- (NSDictionary *)prepareInitialProps
{
  NSMutableDictionary *initProps = [NSMutableDictionary new];

#ifdef RCT_NEW_ARCH_ENABLED
  initProps[kRNConcurrentRoot] = @([self concurrentRootEnabled]);
#endif

  return initProps;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

#if RCT_NEW_ARCH_ENABLED

#pragma mark - RCTCxxBridgeDelegate

- (std::unique_ptr<facebook::react::JSExecutorFactory>)jsExecutorFactoryForBridge:(RCTBridge *)bridge
{
  _turboModuleManager = [[RCTTurboModuleManager alloc] initWithBridge:bridge
                                                             delegate:self
                                                            jsInvoker:bridge.jsCallInvoker];
  return RCTAppSetupDefaultJsExecutorFactory(bridge, _turboModuleManager);
}

#pragma mark RCTTurboModuleManagerDelegate

- (Class)getModuleClassFromName:(const char *)name
{
  return RCTCoreModulesClassProvider(name);
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const std::string &)name
                                                      jsInvoker:(std::shared_ptr<facebook::react::CallInvoker>)jsInvoker
{
  return nullptr;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const std::string &)name
                                                     initParams:
                                                         (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return nullptr;
}

- (id<RCTTurboModule>)getModuleInstanceFromClass:(Class)moduleClass
{
  return RCTAppSetupDefaultModuleFromClass(moduleClass);
}

#endif

@end
