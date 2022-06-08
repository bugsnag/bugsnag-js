//
//  BSGNotificationBreadcrumbs.m
//  Bugsnag
//
//  Created by Nick Dowell on 10/12/2020.
//  Copyright © 2020 Bugsnag Inc. All rights reserved.
//

#import "BSGNotificationBreadcrumbs.h"

#import "BugsnagBreadcrumbs.h"
#import "BugsnagConfiguration+Private.h"
#import "BSGKeys.h"
#import "BSGUtils.h"
#import "BSGDefines.h"
#import "BSGAppKit.h"
#import "BSGUIKit.h"

#define BSG_HAVE_TABLE_VIEW    (TARGET_OS_OSX || TARGET_OS_IOS || TARGET_OS_TV)
#define BSG_HAVE_TEXT_CONTROL  (TARGET_OS_OSX || TARGET_OS_IOS                )

@interface BSGNotificationBreadcrumbs ()

@property (nonatomic) NSDictionary<NSNotificationName, NSString *> *notificationNameMap;

@end


@implementation BSGNotificationBreadcrumbs

- (instancetype)initWithConfiguration:(BugsnagConfiguration *)configuration
                       breadcrumbSink:(id<BSGBreadcrumbSink>)breadcrumbSink {
    if ((self = [super init])) {
        _configuration = configuration;
        _notificationCenter = NSNotificationCenter.defaultCenter;
#if TARGET_OS_OSX
        _workspaceNotificationCenter = [NSWORKSPACE sharedWorkspace].notificationCenter;
#endif
        _breadcrumbSink = breadcrumbSink;
        _notificationNameMap = @{
            @"NSProcessInfoThermalStateDidChangeNotification" : @"Thermal State Changed", // Using string to avoid availability issues
            NSUndoManagerDidRedoChangeNotification : @"Redo Operation",
            NSUndoManagerDidUndoChangeNotification : @"Undo Operation",
#if TARGET_OS_TV
            UIScreenBrightnessDidChangeNotification : @"Screen Brightness Changed",
            UIWindowDidBecomeKeyNotification : @"Window Became Key",
            UIWindowDidResignKeyNotification : @"Window Resigned Key",
#elif TARGET_OS_IOS
            UIApplicationDidEnterBackgroundNotification : @"App Did Enter Background",
            UIApplicationDidReceiveMemoryWarningNotification : @"Memory Warning",
            UIApplicationUserDidTakeScreenshotNotification : @"Took Screenshot",
            UIApplicationWillEnterForegroundNotification : @"App Will Enter Foreground",
            UIApplicationWillTerminateNotification : BSGNotificationBreadcrumbsMessageAppWillTerminate,
            UIDeviceBatteryLevelDidChangeNotification : @"Battery Level Changed",
            UIDeviceBatteryStateDidChangeNotification : @"Battery State Changed",
            UIDeviceOrientationDidChangeNotification : @"Orientation Changed",
            UIKeyboardDidHideNotification : @"Keyboard Became Hidden",
            UIKeyboardDidShowNotification : @"Keyboard Became Visible",
            UIMenuControllerDidHideMenuNotification : @"Did Hide Menu",
            UIMenuControllerDidShowMenuNotification : @"Did Show Menu",
            UITextFieldTextDidBeginEditingNotification : @"Began Editing Text",
            UITextFieldTextDidEndEditingNotification : @"Stopped Editing Text",
            UITextViewTextDidBeginEditingNotification : @"Began Editing Text",
            UITextViewTextDidEndEditingNotification : @"Stopped Editing Text",
#elif TARGET_OS_OSX
            NSApplicationDidBecomeActiveNotification : @"App Became Active",
            NSApplicationDidHideNotification : @"App Did Hide",
            NSApplicationDidResignActiveNotification : @"App Resigned Active",
            NSApplicationDidUnhideNotification : @"App Did Unhide",
            NSApplicationWillTerminateNotification : BSGNotificationBreadcrumbsMessageAppWillTerminate,
            NSControlTextDidBeginEditingNotification : @"Control Text Began Edit",
            NSControlTextDidEndEditingNotification : @"Control Text Ended Edit",
            NSMenuWillSendActionNotification : @"Menu Will Send Action",
            NSTableViewSelectionDidChangeNotification : @"TableView Select Change",
            NSWindowDidBecomeKeyNotification : @"Window Became Key",
            NSWindowDidEnterFullScreenNotification : @"Window Entered Full Screen",
            NSWindowDidExitFullScreenNotification : @"Window Exited Full Screen",
            NSWindowWillCloseNotification : @"Window Will Close",
            NSWindowWillMiniaturizeNotification : @"Window Will Miniaturize",
            NSWorkspaceScreensDidSleepNotification : @"Workspace Screen Slept",
            NSWorkspaceScreensDidWakeNotification : @"Workspace Screen Awoke",
#endif
#if TARGET_OS_IOS || TARGET_OS_TV
            UISceneWillConnectNotification : @"Scene Will Connect",
            UISceneDidDisconnectNotification : @"Scene Disconnected",
            UISceneDidActivateNotification : @"Scene Activated",
            UISceneWillDeactivateNotification : @"Scene Will Deactivate",
            UISceneWillEnterForegroundNotification : @"Scene Will Enter Foreground",
            UISceneDidEnterBackgroundNotification : @"Scene Entered Background",
            UITableViewSelectionDidChangeNotification : @"TableView Select Change",
            UIWindowDidBecomeHiddenNotification : @"Window Became Hidden",
            UIWindowDidBecomeVisibleNotification : @"Window Became Visible",
#endif
        };
    }
    return self;
}

#if TARGET_OS_OSX
- (NSArray<NSNotificationName> *)workspaceBreadcrumbStateEvents {
    return @[
        NSWorkspaceScreensDidSleepNotification,
        NSWorkspaceScreensDidWakeNotification
    ];
}
#endif

- (NSArray<NSNotificationName> *)automaticBreadcrumbStateEvents {
    return @[
        NSUndoManagerDidRedoChangeNotification,
        NSUndoManagerDidUndoChangeNotification,
#if TARGET_OS_TV
        UIScreenBrightnessDidChangeNotification,
        UIWindowDidBecomeKeyNotification,
        UIWindowDidResignKeyNotification,
#elif TARGET_OS_IOS
        UIApplicationDidEnterBackgroundNotification,
        UIApplicationDidReceiveMemoryWarningNotification,
        UIApplicationUserDidTakeScreenshotNotification,
        UIApplicationWillEnterForegroundNotification,
        UIApplicationWillTerminateNotification,
        UIKeyboardDidHideNotification,
        UIKeyboardDidShowNotification,
        UIMenuControllerDidHideMenuNotification,
        UIMenuControllerDidShowMenuNotification,
#elif TARGET_OS_OSX
        NSApplicationDidBecomeActiveNotification,
        NSApplicationDidResignActiveNotification,
        NSApplicationDidHideNotification,
        NSApplicationDidUnhideNotification,
        NSApplicationWillTerminateNotification,
        
        NSWindowDidBecomeKeyNotification,
        NSWindowDidEnterFullScreenNotification,
        NSWindowDidExitFullScreenNotification,
        NSWindowWillCloseNotification,
        NSWindowWillMiniaturizeNotification,
#endif
#if TARGET_OS_IOS || TARGET_OS_TV
        UISceneWillConnectNotification,
        UISceneDidDisconnectNotification,
        UISceneDidActivateNotification,
        UISceneWillDeactivateNotification,
        UISceneWillEnterForegroundNotification,
        UISceneDidEnterBackgroundNotification,
        UIWindowDidBecomeHiddenNotification,
        UIWindowDidBecomeVisibleNotification,
#endif
    ];
}

- (NSArray<NSNotificationName> *)automaticBreadcrumbControlEvents {
#if !BSG_HAVE_TEXT_CONTROL
    return nil;
#elif BSG_HAVE_APPKIT
    return @[
        NSControlTextDidBeginEditingNotification,
        NSControlTextDidEndEditingNotification
    ];
#else
    return @[
        UITextFieldTextDidBeginEditingNotification,
        UITextFieldTextDidEndEditingNotification,
        UITextViewTextDidBeginEditingNotification,
        UITextViewTextDidEndEditingNotification
    ];
#endif
}

- (NSArray<NSNotificationName> *)automaticBreadcrumbTableItemEvents {
#if !BSG_HAVE_TABLE_VIEW
    return @[];
#elif BSG_HAVE_APPKIT
    return @[ NSTableViewSelectionDidChangeNotification ];
#else
    return @[ UITableViewSelectionDidChangeNotification ];
#endif
}

- (NSArray<NSNotificationName> *)automaticBreadcrumbMenuItemEvents {
#if TARGET_OS_OSX
    return @[ NSMenuWillSendActionNotification ];
#endif
    return nil;
}

- (void)dealloc {
    [_notificationCenter removeObserver:self];
}

#pragma mark -

- (NSString *)messageForNotificationName:(NSNotificationName)name {
    return self.notificationNameMap[name] ?: [name stringByReplacingOccurrencesOfString:@"Notification" withString:@""];
}

- (void)addBreadcrumbWithType:(BSGBreadcrumbType)type forNotificationName:(NSNotificationName)notificationName {
    [self addBreadcrumbWithType:type forNotificationName:notificationName metadata:nil];
}

- (void)addBreadcrumbWithType:(BSGBreadcrumbType)type forNotificationName:(NSNotificationName)notificationName metadata:(NSDictionary *)metadata {
    [self.breadcrumbSink leaveBreadcrumbWithMessage:[self messageForNotificationName:notificationName] metadata:metadata ?: @{} andType:type];
}

#pragma mark -

- (void)start {
    // State events
    if ([self.configuration shouldRecordBreadcrumbType:BSGBreadcrumbTypeState]) {
        // Generic state events
        for (NSNotificationName name in [self automaticBreadcrumbStateEvents]) {
            [self startListeningForStateChangeNotification:name];
        }
        
#if TARGET_OS_OSX
        // Workspace-specific events - macOS only
        for (NSNotificationName name in [self workspaceBreadcrumbStateEvents]) {
            [self.workspaceNotificationCenter addObserver:self
                                             selector:@selector(addBreadcrumbForNotification:)
                                                 name:name
                                               object:nil];
        }
        
        // NSMenu events (macOS only)
        for (NSNotificationName name in [self automaticBreadcrumbMenuItemEvents]) {
            [self.notificationCenter addObserver:self
                                    selector:@selector(addBreadcrumbForMenuItemNotification:)
                                        name:name
                                      object:nil];
        }
#endif
        
#if TARGET_OS_IOS
        [self.notificationCenter addObserver:self
                                    selector:@selector(orientationDidChange:)
                                        name:UIDeviceOrientationDidChangeNotification
                                      object:nil];
#endif
        
        if (@available(iOS 11.0, tvOS 11.0, watchOS 4.0, *)) {
            [self.notificationCenter addObserver:self
                                        selector:@selector(thermalStateDidChange:)
                                            name:NSProcessInfoThermalStateDidChangeNotification
                                          object:nil];
        }
    }
    
    // Navigation events
    if ([self.configuration shouldRecordBreadcrumbType:BSGBreadcrumbTypeNavigation]) {
        // UI/NSTableView events
        for (NSNotificationName name in [self automaticBreadcrumbTableItemEvents]) {
            [self.notificationCenter addObserver:self
                                    selector:@selector(addBreadcrumbForTableViewNotification:)
                                        name:name
                                      object:nil];
        }
    }
    
    // User events
    if ([self.configuration shouldRecordBreadcrumbType:BSGBreadcrumbTypeUser]) {
        // UITextField/NSControl events (text editing)
        for (NSNotificationName name in [self automaticBreadcrumbControlEvents]) {
            [self.notificationCenter addObserver:self
                                    selector:@selector(addBreadcrumbForControlNotification:)
                                        name:name
                                      object:nil];
        }
    }
}

- (void)startListeningForStateChangeNotification:(NSNotificationName)notificationName {
    [self.notificationCenter addObserver:self selector:@selector(addBreadcrumbForNotification:) name:notificationName object:nil];
}

- (BOOL)tryAddSceneNotification:(NSNotification *)notification {
#if !TARGET_OS_WATCH && \
    ((defined(__IPHONE_13_0) && __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_13_0) || \
    (defined(__TVOS_13_0) && __TV_OS_VERSION_MAX_ALLOWED >= __TVOS_13_0))
    if (@available(iOS 13.0, tvOS 13.0, *)) {
        if ([notification.name hasPrefix:@"UIScene"] && [notification.object isKindOfClass:UISCENE]) {
            UIScene *scene = notification.object;
            NSMutableDictionary *metadata = [NSMutableDictionary dictionary];
            metadata[@"configuration"] = scene.session.configuration.name;
            metadata[@"delegateClass"] = BSGStringFromClass(scene.session.configuration.delegateClass);
            metadata[@"role"] = scene.session.role;
            metadata[@"sceneClass"] = BSGStringFromClass(scene.session.configuration.sceneClass);
            metadata[@"title"] = scene.title.length ? scene.title : nil;
            [self addBreadcrumbWithType:BSGBreadcrumbTypeState forNotificationName:notification.name metadata:metadata];
            return YES;
        }
    }
#else
    (void)notification;
#endif
    return NO;
}

#if !TARGET_OS_WATCH
static NSString *nullStringIfBlank(NSString *str) {
    return str.length == 0 ? nil : str;
}
#endif

- (BOOL)tryAddWindowNotification:(NSNotification *)notification {
#if BSG_HAVE_WINDOW

#if !TARGET_OS_OSX && \
    (defined(__IPHONE_2_0) || (defined(__TVOS_9_0) && __TV_OS_VERSION_MAX_ALLOWED >= __TVOS_9_0))
    if ([notification.name hasPrefix:@"UIWindow"] && [notification.object isKindOfClass:UIWINDOW]) {
        UIWindow *window = notification.object;
        NSMutableDictionary *metadata = [NSMutableDictionary dictionary];
        metadata[@"description"] = nullStringIfBlank(window.description);
#if !TARGET_OS_TV && (defined(__IPHONE_13_0) && __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_13_0)
        if (@available(iOS 13.0, *)) {
            UIWindowScene *scene = window.windowScene;
            metadata[@"sceneTitle"] = nullStringIfBlank(scene.title);
#if defined(__IPHONE_15_0) && __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_15_0
            if (@available(iOS 15.0, *)) {
                metadata[@"sceneSubtitle"] = nullStringIfBlank(scene.subtitle);
            }
#endif
        }
#endif
        metadata[@"viewController"] = nullStringIfBlank(window.rootViewController.description);
        metadata[@"viewControllerTitle"] = nullStringIfBlank(window.rootViewController.title);
        [self addBreadcrumbWithType:BSGBreadcrumbTypeState forNotificationName:notification.name metadata:metadata];
        return YES;
    }
#endif
#if TARGET_OS_OSX
    if ([notification.name hasPrefix:@"NSWindow"] && [notification.object isKindOfClass:NSWINDOW]) {
        NSWindow *window = notification.object;
        NSMutableDictionary *metadata = [NSMutableDictionary dictionary];
        metadata[@"description"] = nullStringIfBlank(window.description);
        metadata[@"title"] = nullStringIfBlank(window.title);
#if defined(__MAC_11_0) && __MAC_OS_VERSION_MAX_ALLOWED >= __MAC_11_0
        if (@available(macOS 11.0, *)) {
            metadata[@"subtitle"] = nullStringIfBlank(window.subtitle);
        }
#endif
        metadata[@"representedURL"] = nullStringIfBlank(window.representedURL.absoluteString);
        metadata[@"viewController"] = nullStringIfBlank(window.contentViewController.description);
        metadata[@"viewControllerTitle"] = nullStringIfBlank(window.contentViewController.title);
        [self addBreadcrumbWithType:BSGBreadcrumbTypeState forNotificationName:notification.name metadata:metadata];
        return YES;
    }
#endif

#endif
    return NO;
}

- (void)addBreadcrumbForNotification:(NSNotification *)notification {
    if ([self tryAddSceneNotification:notification]) {
        return;
    }
    if ([self tryAddWindowNotification:notification]) {
        return;
    }
    [self addBreadcrumbWithType:BSGBreadcrumbTypeState forNotificationName:notification.name];
}

- (void)addBreadcrumbForTableViewNotification:(__attribute__((unused)) NSNotification *)notification {
#if BSG_HAVE_TABLE_VIEW

#if TARGET_OS_IOS || TARGET_OS_TV
    NSIndexPath *indexPath = ((UITableView *)notification.object).indexPathForSelectedRow;
    [self addBreadcrumbWithType:BSGBreadcrumbTypeNavigation forNotificationName:notification.name metadata:
     indexPath ? @{@"row" : @(indexPath.row), @"section" : @(indexPath.section)} : nil];
#elif TARGET_OS_OSX
    NSTableView *tableView = notification.object;
    [self addBreadcrumbWithType:BSGBreadcrumbTypeNavigation forNotificationName:notification.name metadata:
     tableView ? @{@"selectedRow" : @(tableView.selectedRow), @"selectedColumn" : @(tableView.selectedColumn)} : nil];
#endif

#endif
}

- (void)addBreadcrumbForMenuItemNotification:(__attribute__((unused)) NSNotification *)notification {
#if TARGET_OS_OSX
    NSMenuItem *menuItem = [[notification userInfo] valueForKey:@"MenuItem"];
    [self addBreadcrumbWithType:BSGBreadcrumbTypeState forNotificationName:notification.name metadata:
     [menuItem isKindOfClass:NSMENUITEM] ? @{BSGKeyAction : menuItem.title} : nil];
#endif
}

- (void)addBreadcrumbForControlNotification:(__attribute__((unused)) NSNotification *)notification {
#if TARGET_OS_IOS
    NSString *label = ((UIControl *)notification.object).accessibilityLabel;
    [self addBreadcrumbWithType:BSGBreadcrumbTypeUser forNotificationName:notification.name metadata:
     label.length ? @{BSGKeyLabel : label} : nil];
#elif TARGET_OS_OSX
    NSControl *control = notification.object;
    NSDictionary *metadata = nil;
    if ([control respondsToSelector:@selector(accessibilityLabel)]) {
        NSString *label = control.accessibilityLabel;
        if (label.length > 0) {
            metadata = @{BSGKeyLabel : label};
        }
    }
    [self addBreadcrumbWithType:BSGBreadcrumbTypeUser forNotificationName:notification.name metadata:metadata];
#endif
}

#pragma mark -

#if TARGET_OS_IOS

- (void)orientationDidChange:(NSNotification *)notification {
    UIDevice *device = notification.object;
    
    static UIDeviceOrientation previousOrientation;
    if (device.orientation == UIDeviceOrientationUnknown ||
        device.orientation == previousOrientation) {
        return;
    }
    
    NSMutableDictionary *metadata = [NSMutableDictionary dictionary];
    metadata[@"from"] = BSGStringFromDeviceOrientation(previousOrientation);
    metadata[@"to"] =  BSGStringFromDeviceOrientation(device.orientation);
    previousOrientation = device.orientation;
    
    [self addBreadcrumbWithType:BSGBreadcrumbTypeState
            forNotificationName:notification.name
                       metadata:metadata];
}

#endif

- (void)thermalStateDidChange:(NSNotification *)notification API_AVAILABLE(ios(11.0), tvos(11.0)) {
    NSProcessInfo *processInfo = notification.object;
    
    static NSProcessInfoThermalState previousThermalState;
    if (processInfo.thermalState == previousThermalState) {
        return;
    }
    
    NSMutableDictionary *metadata = [NSMutableDictionary dictionary];
    metadata[@"from"] = BSGStringFromThermalState(previousThermalState);
    metadata[@"to"] = BSGStringFromThermalState(processInfo.thermalState);
    previousThermalState = processInfo.thermalState;
    
    [self addBreadcrumbWithType:BSGBreadcrumbTypeState
            forNotificationName:notification.name
                       metadata:metadata];
}

@end
