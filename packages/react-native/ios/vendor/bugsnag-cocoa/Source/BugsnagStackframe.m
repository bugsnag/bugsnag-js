//
//  BugsnagStackframe.m
//  Bugsnag
//
//  Created by Jamie Lynch on 01/04/2020.
//  Copyright © 2020 Bugsnag. All rights reserved.
//

#import "BugsnagStackframe.h"
#import "BugsnagKeys.h"
#import "BugsnagCollections.h"

@implementation BugsnagStackframe

+ (NSDictionary *_Nullable)findImageAddr:(unsigned long)addr inImages:(NSArray *)images {
    for (NSDictionary *image in images) {
        if ([(NSNumber *)image[BSGKeyImageAddress] unsignedLongValue] == addr) {
            return image;
        }
    }
    return nil;
}

+ (BugsnagStackframe *)frameFromDict:(NSDictionary *)dict
                          withImages:(NSArray *)binaryImages {
    BugsnagStackframe *frame = [BugsnagStackframe new];
    frame.frameAddress = [dict[BSGKeyInstructionAddress] unsignedLongValue];
    frame.symbolAddress = [dict[BSGKeySymbolAddress] unsignedLongValue];
    frame.machoLoadAddress = [dict[BSGKeyObjectAddress] unsignedLongValue];
    frame.machoFile = dict[BSGKeyObjectName];
    frame.method = dict[BSGKeySymbolName];
    frame.isPc = [dict[BSGKeyIsPC] boolValue];
    frame.isLr = [dict[BSGKeyIsLR] boolValue];

    NSDictionary *image = [self findImageAddr:frame.machoLoadAddress inImages:binaryImages];

    if (image != nil) {
        frame.machoUuid = image[BSGKeyUuid];
        frame.machoVmAddress = [image[BSGKeyImageVmAddress] unsignedLongValue];
        return frame;
    } else { // invalid frame, skip
        return nil;
    }
}

- (NSDictionary *)toDictionary {
    NSMutableDictionary *dict = [NSMutableDictionary new];
    BSGDictInsertIfNotNil(dict, self.machoFile, BSGKeyMachoFile);
    BSGDictInsertIfNotNil(dict, self.method, BSGKeyMethod);
    BSGDictInsertIfNotNil(dict, self.machoUuid, BSGKeyMachoUUID);

    NSString *frameAddr = [NSString stringWithFormat:BSGKeyFrameAddrFormat, self.frameAddress];
    BSGDictSetSafeObject(dict, frameAddr, BSGKeyFrameAddress);

    NSString *symbolAddr = [NSString stringWithFormat:BSGKeyFrameAddrFormat, self.symbolAddress];
    BSGDictSetSafeObject(dict, symbolAddr, BSGKeySymbolAddr);

    NSString *imageAddr = [NSString stringWithFormat:BSGKeyFrameAddrFormat, self.machoLoadAddress];
    BSGDictSetSafeObject(dict, imageAddr, BSGKeyMachoLoadAddr);

    NSString *vmAddr = [NSString stringWithFormat:BSGKeyFrameAddrFormat, self.machoVmAddress];
    BSGDictSetSafeObject(dict, vmAddr, BSGKeyMachoVMAddress);
    return dict;
}

@end
