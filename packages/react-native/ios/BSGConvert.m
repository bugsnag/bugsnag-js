#import "BSGConvert.h"
#import <React/RCTJSStackFrame.h>

BSGBreadcrumbType BSGBreadcrumbTypeFromString(NSString *type) {
    if ([type isEqualToString:@"log"])
        return BSGBreadcrumbTypeLog;
    else if ([type isEqualToString:@"user"])
        return BSGBreadcrumbTypeUser;
    else if ([type isEqualToString:@"error"])
        return BSGBreadcrumbTypeError;
    else if ([type isEqualToString:@"state"])
        return BSGBreadcrumbTypeState;
    else if ([type isEqualToString:@"process"])
        return BSGBreadcrumbTypeProcess;
    else if ([type isEqualToString:@"request"])
        return BSGBreadcrumbTypeRequest;
    else if ([type isEqualToString:@"navigation"])
        return BSGBreadcrumbTypeNavigation;
    else
        return BSGBreadcrumbTypeManual;
}

NSDictionary *BSGConvertTypedNSDictionary(id rawData) {
    NSDictionary *data = [RCTConvert NSDictionary:rawData];
    NSMutableDictionary *converted = [NSMutableDictionary new];
    NSArray *keys = [data allKeys];
    for (int i = 0; i < data.count; i++) {
        NSString *key = [RCTConvert NSString:keys[i]];
        NSDictionary *pair = [RCTConvert NSDictionary:data[key]];
        NSString *type = [RCTConvert NSString:pair[@"type"]];
        id value = pair[@"value"];
        if ([@"boolean" isEqualToString:type]) {
            converted[key] = @([RCTConvert BOOL:value]);
        } else if ([@"number" isEqualToString:type]) {
            converted[key] = [RCTConvert NSNumber:value];
        } else if ([@"string" isEqualToString:type]) {
            converted[key] = [RCTConvert NSString:value];
        } else if ([@"map" isEqualToString:type]) {
            converted[key] = BSGConvertTypedNSDictionary(value);
        }
    }
    return converted;
}

NSArray *BSGParseJavaScriptStacktrace(NSString *stacktrace, NSNumberFormatter *formatter) {
    NSArray *frames = [RCTJSStackFrame stackFramesWithLines:stacktrace];
    NSMutableArray *formatted = [[NSMutableArray alloc] initWithCapacity:frames.count];
    for (RCTJSStackFrame *jsFrame in frames) {
        NSMutableDictionary *frame = [NSMutableDictionary new];
        if (jsFrame.file.length > 0) {
            frame[@"file"] = jsFrame.file;
        }
        if (jsFrame.methodName.length > 0) {
            frame[@"method"] = jsFrame.methodName;
        }
        frame[@"columnNumber"] = @(jsFrame.column);
        frame[@"lineNumber"] = @(jsFrame.lineNumber);
        [formatted addObject:frame];
    }
    return formatted;
}
