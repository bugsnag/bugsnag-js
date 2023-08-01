#import <React/RCTBridgeDelegate.h>
#import <UIKit/UIKit.h>
#import <Bugsnag/Bugsnag.h>

@interface AppDelegate : UIResponder <UIApplicationDelegate, RCTBridgeDelegate>

@property (nonatomic, strong) UIWindow *window;

BugsnagConfiguration *createConfiguration(void);
NSString *loadMazeRunnerAddress(void);

@end
