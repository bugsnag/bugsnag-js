#import <Foundation/Foundation.h>
#import <EXUpdates/EXUpdatesAppController.h>
#import <React/RCTBridgeDelegate.h>
#import <UIKit/UIKit.h>
[BUGSNAG_IMPORT_PLACEHOLDER]

#import <UMCore/UMAppDelegateWrapper.h>

@interface AppDelegate : UMAppDelegateWrapper <RCTBridgeDelegate, EXUpdatesAppControllerDelegate>

BugsnagConfiguration *createConfiguration(void);
NSString *loadMazeRunnerAddress(void);

@end
