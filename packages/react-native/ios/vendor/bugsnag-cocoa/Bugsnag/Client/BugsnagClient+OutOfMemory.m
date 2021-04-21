//
//  BugsnagClient+OutOfMemory.m
//  Bugsnag
//
//  Created by Nick Dowell on 19/03/2021.
//  Copyright © 2021 Bugsnag Inc. All rights reserved.
//

#import "BugsnagClient+OutOfMemory.h"

#import "BugsnagAppWithState+Private.h"
#import "BugsnagBreadcrumbs.h"
#import "BugsnagClient+Private.h"
#import "BugsnagDeviceWithState+Private.h"
#import "BugsnagError+Private.h"
#import "BugsnagEvent+Private.h"
#import "BugsnagHandledState.h"
#import "BugsnagKeys.h"
#import "BugsnagSession+Private.h"
#import "BugsnagSystemState.h"

@implementation BugsnagClient (OutOfMemory)

- (BugsnagEvent *)generateOutOfMemoryEvent {
    NSDictionary *appDict = self.systemState.lastLaunchState[SYSTEMSTATE_KEY_APP];
    BugsnagAppWithState *app = [BugsnagAppWithState appFromJson:appDict];
    app.dsymUuid = appDict[BSGKeyMachoUUID];
    app.isLaunching = [self.stateMetadataFromLastLaunch[BSGKeyApp][BSGKeyIsLaunching] boolValue];
    
    NSDictionary *deviceDict = self.systemState.lastLaunchState[SYSTEMSTATE_KEY_DEVICE];
    BugsnagDeviceWithState *device = [BugsnagDeviceWithState deviceFromJson:deviceDict];
    device.manufacturer = @"Apple";
    device.orientation = self.stateMetadataFromLastLaunch[BSGKeyDeviceState][BSGKeyOrientation];
    
    BugsnagMetadata *metadata = [[BugsnagMetadata alloc] initWithDictionary:self.metadataFromLastLaunch ?: @{}];
    NSDictionary *deviceState = self.stateMetadataFromLastLaunch[BSGKeyDeviceState];
    if ([deviceState isKindOfClass:[NSDictionary class]]) {
        [metadata addMetadata:deviceState toSection:BSGKeyDevice];
    }
    
    NSDictionary *sessionDict = self.systemState.lastLaunchState[BSGKeySession];
    BugsnagSession *session = sessionDict ? [[BugsnagSession alloc] initWithDictionary:sessionDict] : nil;
    session.unhandledCount += 1;
    
    BugsnagError *error =
    [[BugsnagError alloc] initWithErrorClass:@"Out Of Memory"
                                errorMessage:@"The app was likely terminated by the operating system while in the foreground"
                                   errorType:BSGErrorTypeCocoa
                                  stacktrace:nil];
    
    BugsnagEvent *event =
    [[BugsnagEvent alloc] initWithApp:app
                               device:device
                         handledState:[BugsnagHandledState handledStateWithSeverityReason:LikelyOutOfMemory]
                                 user:session.user ?: [[BugsnagUser alloc] init]
                             metadata:metadata
                          breadcrumbs:self.breadcrumbs.breadcrumbs ?: @[]
                               errors:@[error]
                              threads:@[]
                              session:session];
    
    return event;
}

@end
