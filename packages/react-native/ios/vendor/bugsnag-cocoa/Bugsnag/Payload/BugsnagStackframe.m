//
//  BugsnagStackframe.m
//  Bugsnag
//
//  Created by Jamie Lynch on 01/04/2020.
//  Copyright © 2020 Bugsnag. All rights reserved.
//

#import "BugsnagStackframe+Private.h"

#import "BSG_KSBacktrace.h"
#import "BSG_KSMachHeaders.h"
#import "BSG_Symbolicate.h"
#import "BugsnagCollections.h"
#import "BugsnagKeys.h"
#import "BugsnagLogger.h"

BugsnagStackframeType const BugsnagStackframeTypeCocoa = @"cocoa";


static NSString * _Nullable FormatMemoryAddress(NSNumber * _Nullable address) {
    return address == nil ? nil : [NSString stringWithFormat:@"0x%" PRIxPTR, address.unsignedLongValue];
}


// MARK: -

@implementation BugsnagStackframe

static NSDictionary * _Nullable FindImage(NSArray *images, uintptr_t addr) {
    for (NSDictionary *image in images) {
        if ([(NSNumber *)image[BSGKeyImageAddress] unsignedLongValue] == addr) {
            return image;
        }
    }
    return nil;
}

+ (BugsnagStackframe *)frameFromJson:(NSDictionary *)json {
    BugsnagStackframe *frame = [BugsnagStackframe new];
    frame.machoFile = BSGDeserializeString(json[BSGKeyMachoFile]);
    frame.method = BSGDeserializeString(json[BSGKeyMethod]);
    frame.isPc = BSGDeserializeNumber(json[BSGKeyIsPC]).boolValue;
    frame.isLr = BSGDeserializeNumber(json[BSGKeyIsLR]).boolValue;
    frame.machoUuid = BSGDeserializeString(json[BSGKeyMachoUUID]);
    frame.machoVmAddress = [self readInt:json key:BSGKeyMachoVMAddress];
    frame.frameAddress = [self readInt:json key:BSGKeyFrameAddress];
    frame.symbolAddress = [self readInt:json key:BSGKeySymbolAddr];
    frame.machoLoadAddress = [self readInt:json key:BSGKeyMachoLoadAddr];
    frame.type = BSGDeserializeString(json[BSGKeyType]);
    frame.columnNumber = BSGDeserializeNumber(json[@"columnNumber"]);
    frame.file = BSGDeserializeString(json[@"file"]);
    frame.inProject = BSGDeserializeNumber(json[@"inProject"]);
    frame.lineNumber = BSGDeserializeNumber(json[@"lineNumber"]);
    return frame;
}

+ (NSNumber *)readInt:(NSDictionary *)json key:(NSString *)key {
    id obj = json[key];
    if ([obj isKindOfClass:[NSString class]]) {
        return @(strtoul([obj UTF8String], NULL, 16));
    }
    return nil;
}

+ (instancetype)frameFromDict:(NSDictionary<NSString *, id> *)dict withImages:(NSArray<NSDictionary<NSString *, id> *> *)binaryImages {
    NSNumber *frameAddress = dict[BSGKeyInstructionAddress];
    if (frameAddress.unsignedLongLongValue == 1) {
        // We sometimes get a frame address of 0x1 at the bottom of the call stack.
        // It's not a valid stack frame and causes E2E tests to fail, so should be ignored.
        return nil;
    }

    BugsnagStackframe *frame = [BugsnagStackframe new];
    frame.frameAddress = frameAddress;
    frame.symbolAddress = dict[BSGKeySymbolAddress];
    frame.machoLoadAddress = dict[BSGKeyObjectAddress];
    frame.machoFile = dict[BSGKeyObjectName];
    frame.method = dict[BSGKeySymbolName];
    frame.isPc = [dict[BSGKeyIsPC] boolValue];
    frame.isLr = [dict[BSGKeyIsLR] boolValue];

    NSDictionary *image = FindImage(binaryImages, (uintptr_t)frame.machoLoadAddress.unsignedLongLongValue);
    if (image != nil) {
        frame.machoUuid = image[BSGKeyUuid];
        frame.machoVmAddress = image[BSGKeyImageVmAddress];
        frame.machoFile = image[BSGKeyName];
    } else if (frame.isPc) {
        // If the program counter's value isn't in any known image, the crash may have been due to a bad function pointer.
        // Ignore these frames to prevent the dashboard grouping on the address.
        return nil;
    } else if (frame.isLr) {
        // Ignore invalid link register frames.
        // For EXC_BREAKPOINT mach exceptions the link register does not contain an instruction address.
        return nil;
    } else if (/* Don't warn for recrash reports */ binaryImages.count > 1) {
        bsg_log_warn(@"BugsnagStackframe: no image found for address %@", FormatMemoryAddress(frame.machoLoadAddress));
    }
    
    return frame;
}

+ (NSArray<BugsnagStackframe *> *)stackframesWithBacktrace:(uintptr_t *)backtrace length:(NSUInteger)length {
    NSMutableArray<BugsnagStackframe *> *frames = [NSMutableArray array];
    
    for (NSUInteger i = 0; i < length; i++) {
        uintptr_t address = backtrace[i];
        if (address == 1) {
            // We sometimes get a frame address of 0x1 at the bottom of the call stack.
            // It's not a valid stack frame and causes E2E tests to fail, so should be ignored.
            continue;
        }
        
        [frames addObject:[[BugsnagStackframe alloc] initWithAddress:address isPc:i == 0]];
    }
    
    return frames;
}

+ (NSArray<BugsnagStackframe *> *)stackframesWithCallStackReturnAddresses:(NSArray<NSNumber *> *)callStackReturnAddresses {
    NSUInteger length = callStackReturnAddresses.count;
    uintptr_t addresses[length];
    for (NSUInteger i = 0; i < length; i++) {
        addresses[i] = (uintptr_t)callStackReturnAddresses[i].unsignedLongLongValue;
    }
    return [BugsnagStackframe stackframesWithBacktrace:addresses length:length];
}

+ (NSArray<BugsnagStackframe *> *)stackframesWithCallStackSymbols:(NSArray<NSString *> *)callStackSymbols {
    NSString *pattern = (@"^(\\d+)"             // Capture the leading frame number
                         @" +"                  // Skip whitespace
                         @"([\\S ]+?)"          // Image name (may contain spaces)
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
        
        BugsnagStackframe *frame = [[BugsnagStackframe alloc] initWithAddress:address isPc:[frameNumber isEqualToString:@"0"]];
        frame.machoFile = imageName;
        frame.method = symbolName ?: frameAddress;
        [frames addObject:frame];
    }
    
    return [NSArray arrayWithArray:frames];
}

- (instancetype)initWithAddress:(uintptr_t)address isPc:(BOOL)isPc {
    if ((self = [super init])) {
        _frameAddress = @(address);
        _isPc = isPc;
        _needsSymbolication = YES;
        BSG_Mach_Header_Info *header = bsg_mach_headers_image_at_address(address);
        if (header) {
            _machoFile = header->name ? @(header->name) : nil;
            _machoLoadAddress = @((uintptr_t)header->header);
            _machoVmAddress = @(header->imageVmAddr);
            _machoUuid = header->uuid ? [[NSUUID alloc] initWithUUIDBytes:header->uuid].UUIDString : nil;
        }
    }
    return self;
}

- (NSString *)description {
    return [NSString stringWithFormat:@"<BugsnagStackframe: %p { %@ %p %@ }>", (void *)self,
            self.machoFile.lastPathComponent, (void *)self.frameAddress.unsignedLongLongValue, self.method];
}

- (void)symbolicateIfNeeded {
    if (!self.needsSymbolication) {
        return;
    }
    self.needsSymbolication = NO;
    
    uintptr_t frameAddress = self.frameAddress.unsignedIntegerValue;
    uintptr_t instructionAddress = self.isPc ? frameAddress: CALL_INSTRUCTION_FROM_RETURN_ADDRESS(frameAddress);
    struct bsg_symbolicate_result result;
    bsg_symbolicate(instructionAddress, &result);
    
    if (result.function_address) {
        self.symbolAddress = @(result.function_address);
    }
    if (result.function_name) {
        self.method = @(result.function_name);
    }
}

- (NSDictionary *)toDictionary {
    NSMutableDictionary *dict = [NSMutableDictionary new];
    dict[BSGKeyMachoFile] = self.machoFile;
    dict[BSGKeyMethod] = self.method;
    dict[BSGKeyMachoUUID] = self.machoUuid;
    dict[BSGKeyFrameAddress] = FormatMemoryAddress(self.frameAddress);
    dict[BSGKeySymbolAddr] = FormatMemoryAddress(self.symbolAddress);
    dict[BSGKeyMachoLoadAddr] = FormatMemoryAddress(self.machoLoadAddress);
    dict[BSGKeyMachoVMAddress] = FormatMemoryAddress(self.machoVmAddress);
    if (self.isPc) {
        dict[BSGKeyIsPC] = @(self.isPc);
    }
    if (self.isLr) {
        dict[BSGKeyIsLR] = @(self.isLr);
    }
    dict[BSGKeyType] = self.type;
    dict[@"columnNumber"] = self.columnNumber;
    dict[@"file"] = self.file;
    dict[@"inProject"] = self.inProject;
    dict[@"lineNumber"] = self.lineNumber;
    return dict;
}

@end
