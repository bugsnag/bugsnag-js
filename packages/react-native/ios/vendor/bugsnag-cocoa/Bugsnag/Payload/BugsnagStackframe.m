//
//  BugsnagStackframe.m
//  Bugsnag
//
//  Created by Jamie Lynch on 01/04/2020.
//  Copyright © 2020 Bugsnag. All rights reserved.
//

#import "BugsnagStackframe.h"

#import "BSG_KSBacktrace.h"
#import "BSG_KSDynamicLinker.h"
#import "BugsnagCollections.h"
#import "BugsnagKeys.h"
#import "BugsnagLogger.h"

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
        frame.machoFile = image[BSGKeyName];
        return frame;
    } else { // invalid frame, skip
        return nil;
    }
}

+ (NSArray<BugsnagStackframe *> *)stackframesWithCallStackSymbols:(NSArray<NSString *> *)callStackSymbols {
    NSString *pattern = (@"^(\\d+)"             // Capture the leading frame number
                         @" +"                  // Skip whitespace
                         @"(\\S+)"              // Image name
                         @" +"                  // Skip whitespace
                         @"(0x[0-9a-fA-F]+)"    // Capture the frame address
                         @"("                   // Start optional group
                         @" "                   // Skip whitespace
                         @"(.+)"                // Capture symbol name
                         @" \\+ "               // Skip " + "
                         @"\\d+"                // Instruction offset
                         @")?$"                 // End optional group
                         );
    
    NSError *error;
    NSRegularExpression *regex =
    [NSRegularExpression regularExpressionWithPattern:pattern options:0 error:&error];
    if (!regex) {
        bsg_log_err(@"%@", error);
        return nil;
    }
    
    NSMutableArray<BugsnagStackframe *> *frames = [NSMutableArray array];
    
    for (NSString *string in callStackSymbols) {
        NSTextCheckingResult *match = [regex firstMatchInString:string options:0 range:NSMakeRange(0, string.length)];
        if (match.numberOfRanges != 6) {
            continue;
        }
        NSString *frameNumber = [string substringWithRange:[match rangeAtIndex:1]];
        NSString *imageName = [string substringWithRange:[match rangeAtIndex:2]];
        NSString *frameAddress = [string substringWithRange:[match rangeAtIndex:3]];
        NSRange symbolNameRange = [match rangeAtIndex:5];
        NSString *symbolName = nil;
        if (symbolNameRange.location != NSNotFound) {
            symbolName = [string substringWithRange:symbolNameRange];
        }
        
        uintptr_t address = 0;
        if (frameAddress.UTF8String != NULL) {
            sscanf(frameAddress.UTF8String, "%lx", &address);
        }
        
        BugsnagStackframe *frame = [BugsnagStackframe new];
        frame.machoFile = imageName;
        frame.method = symbolName ?: frameAddress;
        frame.frameAddress = [NSNumber numberWithUnsignedLongLong:address];
        frame.isPc = [frameNumber isEqualToString:@"0"];
        
        Dl_info dl_info;
        bsg_ksbt_symbolicate(&address, &dl_info, 1, 0);
        if (dl_info.dli_fname != NULL) {
            frame.machoFile = [NSString stringWithUTF8String:dl_info.dli_fname].lastPathComponent;
        }
        if (dl_info.dli_fbase != NULL) {
            frame.machoLoadAddress = [NSNumber numberWithUnsignedLongLong:(uintptr_t)dl_info.dli_fbase];
        }
        if (dl_info.dli_saddr != NULL) {
            frame.symbolAddress = [NSNumber numberWithUnsignedLongLong:(uintptr_t)dl_info.dli_saddr];
        }
        if (dl_info.dli_sname != NULL) {
            frame.method = [NSString stringWithUTF8String:dl_info.dli_sname];
        }
        
        BSG_Mach_Header_Info *header = bsg_mach_headers_image_at_address(address);
        if (header != NULL) {
            frame.machoVmAddress = [NSNumber numberWithUnsignedLongLong:header->imageVmAddr];
            if (header->uuid != nil) {
                CFUUIDRef uuidRef = CFUUIDCreateFromUUIDBytes(NULL, *(CFUUIDBytes *)header->uuid);
                frame.machoUuid = (__bridge_transfer NSString *)CFUUIDCreateString(NULL, uuidRef);
                CFRelease(uuidRef);
            }
        }
        
        [frames addObject:frame];
    }
    
    return [NSArray arrayWithArray:frames];
}

- (NSString *)description {
    return [NSString stringWithFormat:@"<BugsnagStackframe: %p { %@ %p %@ }>", self,
            self.machoFile.lastPathComponent, (void *)self.frameAddress.unsignedLongLongValue, self.method];
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
    if (self.isPc) {
        BSGDictSetSafeObject(dict, @(self.isPc), BSGKeyIsPC);
    }
    if (self.isLr) {
        BSGDictSetSafeObject(dict, @(self.isLr), BSGKeyIsLR);
    }
    return dict;
}

@end
