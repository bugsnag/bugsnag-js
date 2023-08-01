#import "AppDelegate.h"

#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import <React/RCTLinkingManager.h>

#import <UMCore/UMModuleRegistry.h>
#import <UMReactNativeAdapter/UMNativeModulesProxy.h>
#import <UMReactNativeAdapter/UMModuleRegistryAdapter.h>
#import <EXSplashScreen/EXSplashScreenService.h>
#import <UMCore/UMModuleRegistryProvider.h>

@interface AppDelegate () <RCTBridgeDelegate>

@property (nonatomic, strong) UMModuleRegistryAdapter *moduleRegistryAdapter;
@property (nonatomic, strong) NSDictionary *launchOptions;

@end

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleRegistryAdapter = [[UMModuleRegistryAdapter alloc] initWithModuleRegistryProvider:[[UMModuleRegistryProvider alloc] init]];
  self.launchOptions = launchOptions;
  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  #ifdef DEBUG
    [self initializeReactNativeApp];
  #else
    EXUpdatesAppController *controller = [EXUpdatesAppController sharedInstance];
    controller.delegate = self;
    [controller startAndShowLaunchScreen:self.window];
  #endif

  [super application:application didFinishLaunchingWithOptions:launchOptions];

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

- (RCTBridge *)initializeReactNativeApp
{
  RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:self.launchOptions];
  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge moduleName:@"main" initialProperties:nil];
  rootView.backgroundColor = [[UIColor alloc] initWithRed:1.0f green:1.0f blue:1.0f alpha:1];

  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];

  return bridge;
 }

- (NSArray<id<RCTBridgeModule>> *)extraModulesForBridge:(RCTBridge *)bridge
{
  NSArray<id<RCTBridgeModule>> *extraModules = [_moduleRegistryAdapter extraModulesForBridge:bridge];
  // If you'd like to export some custom RCTBridgeModules that are not Expo modules, add them here!
  return extraModules;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge {
 #ifdef DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
 #else
  return [[EXUpdatesAppController sharedInstance] launchAssetUrl];
 #endif
}

- (void)appController:(EXUpdatesAppController *)appController didStartWithSuccess:(BOOL)success {
  appController.bridge = [self initializeReactNativeApp];
  EXSplashScreenService *splashScreenService = (EXSplashScreenService *)[UMModuleRegistryProvider getSingletonModuleForClass:[EXSplashScreenService class]];
  [splashScreenService showSplashScreenFor:self.window.rootViewController];
}

// Linking API
- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {
  return [RCTLinkingManager application:application openURL:url options:options];
}

// Universal Links
- (BOOL)application:(UIApplication *)application continueUserActivity:(nonnull NSUserActivity *)userActivity restorationHandler:(nonnull void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler {
 return [RCTLinkingManager application:application
                  continueUserActivity:userActivity
                    restorationHandler:restorationHandler];
}

@end
