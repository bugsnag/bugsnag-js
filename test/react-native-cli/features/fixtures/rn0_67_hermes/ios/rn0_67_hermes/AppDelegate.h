#import <React/RCTBridgeDelegate.h>
#import <UIKit/UIKit.h>
[BUGSNAG_IMPORT_PLACEHOLDER]

@interface AppDelegate : UIResponder <UIApplicationDelegate, RCTBridgeDelegate>

@property (nonatomic, strong) UIWindow *window;

BugsnagConfiguration *createConfiguration(void);
NSString *loadMazeRunnerAddress(void);

@end
