#import "BSGSerialization.h"
#import "BugsnagLogger.h"
#import "BSGJSONSerialization.h"

BOOL BSGIsSanitizedType(id obj) {
    static dispatch_once_t onceToken;
    static NSArray *allowedTypes = nil;
    dispatch_once(&onceToken, ^{
      allowedTypes = @[
          [NSArray class], [NSDictionary class], [NSNull class],
          [NSNumber class], [NSString class]
      ];
    });

    for (Class klass in allowedTypes) {
        if ([obj isKindOfClass:klass])
            return YES;
    }
    return NO;
}

id BSGSanitizeObject(id obj) {
    if ([obj isKindOfClass:[NSNumber class]]) {
        NSNumber *number = obj;
        if (![number isEqualToNumber:[NSDecimalNumber notANumber]] &&
            !isinf([number doubleValue]))
            return obj;
    } else if ([obj isKindOfClass:[NSArray class]]) {
        return BSGSanitizeArray(obj);
    } else if ([obj isKindOfClass:[NSDictionary class]]) {
        return BSGSanitizeDict(obj);
    } else if (BSGIsSanitizedType(obj)) {
        return obj;
    }
    return nil;
}

NSDictionary *_Nonnull BSGSanitizeDict(NSDictionary *input) {
    __block NSMutableDictionary *output =
        [NSMutableDictionary dictionaryWithCapacity:[input count]];
    [input enumerateKeysAndObjectsUsingBlock:^(id _Nonnull key, id _Nonnull obj,
                                               BOOL *_Nonnull stop) {
      if ([key isKindOfClass:[NSString class]]) {
          id cleanedObject = BSGSanitizeObject(obj);
          if (cleanedObject)
              output[key] = cleanedObject;
      }
    }];
    return output;
}

NSArray *BSGSanitizeArray(NSArray *input) {
    NSMutableArray *output = [NSMutableArray arrayWithCapacity:[input count]];
    for (id obj in input) {
        id cleanedObject = BSGSanitizeObject(obj);
        if (cleanedObject)
            [output addObject:cleanedObject];
    }
    return output;
}

NSDictionary *BSGDeserializeJson(char *json) {
    if (json != NULL) {
        NSString *str = [NSString stringWithCString:json encoding:NSUTF8StringEncoding];

        if (str != nil) {
            NSData *data = [str dataUsingEncoding:NSUTF8StringEncoding] ;
            if (data != nil) {
                NSError *error;
                NSDictionary *decode = [BSGJSONSerialization JSONObjectWithData:data
                                                                       options:0
                                                                         error:&error];
                if (error != nil) {
                    bsg_log_err(@"Failed to deserialize JSON: %@", error);
                } else {
                    return decode;
                }
            }
        }
    }
    return nil;
}
