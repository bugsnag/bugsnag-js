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

+ (BugsnagStackframe *)frameFromJson:(NSDictionary *)json {
    BugsnagStackframe *frame = [BugsnagStackframe new];
    frame.machoFile = json[BSGKeyMachoFile];
    frame.method = json[BSGKeyMethod];
    frame.isPc = [json[BSGKeyIsPC] boolValue];
    frame.isLr = [json[BSGKeyIsLR] boolValue];
    frame.machoUuid = json[BSGKeyMachoUUID];
    frame.machoVmAddress = [self readInt:json key:BSGKeyMachoVMAddress];
    frame.frameAddress = [self readInt:json key:BSGKeyFrameAddress];
    frame.symbolAddress = [self readInt:json key:BSGKeySymbolAddr];
    frame.machoLoadAddress = [self readInt:json key:BSGKeyMachoLoadAddr];
    return frame;
}

+ (NSNumber *)readInt:(NSDictionary *)json key:(NSString *)key {
    NSString *obj = json[key];
    if (obj) {
        return @(strtoul([obj UTF8String], NULL, 16));
    }
    return nil;
}

+ (BugsnagStackframe *)frameFromDict:(NSDictionary *)dict
                          withImages:(NSArray *)binaryImages {
    BugsnagStackframe *frame = [BugsnagStackframe new];
    frame.frameAddress = dict[BSGKeyInstructionAddress];
    frame.symbolAddress = dict[BSGKeySymbolAddress];
    frame.machoLoadAddress = dict[BSGKeyObjectAddress];
    frame.machoFile = dict[BSGKeyObjectName];
    frame.method = dict[BSGKeySymbolName];
    frame.isPc = [dict[BSGKeyIsPC] boolValue];
    frame.isLr = [dict[BSGKeyIsLR] boolValue];

    NSDictionary *image = [self findImageAddr:[frame.machoLoadAddress unsignedLongValue] inImages:binaryImages];

    if (image != nil) {
        frame.machoUuid = image[BSGKeyUuid];
        frame.machoVmAddress = image[BSGKeyImageVmAddress];
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

    if (self.frameAddress != nil) {
        NSString *frameAddr = [NSString stringWithFormat:BSGKeyFrameAddrFormat, [self.frameAddress unsignedLongValue]];
        BSGDictSetSafeObject(dict, frameAddr, BSGKeyFrameAddress);
    }
    if (self.symbolAddress != nil) {
        NSString *symbolAddr = [NSString stringWithFormat:BSGKeyFrameAddrFormat, [self.symbolAddress unsignedLongValue]];
        BSGDictSetSafeObject(dict, symbolAddr, BSGKeySymbolAddr);
    }
    if (self.machoLoadAddress != nil) {
        NSString *imageAddr = [NSString stringWithFormat:BSGKeyFrameAddrFormat, [self.machoLoadAddress unsignedLongValue]];
        BSGDictSetSafeObject(dict, imageAddr, BSGKeyMachoLoadAddr);
    }
    if (self.machoVmAddress != nil) {
        NSString *vmAddr = [NSString stringWithFormat:BSGKeyFrameAddrFormat, [self.machoVmAddress unsignedLongValue]];
        BSGDictSetSafeObject(dict, vmAddr, BSGKeyMachoVMAddress);
    }
    return dict;
}

@end
