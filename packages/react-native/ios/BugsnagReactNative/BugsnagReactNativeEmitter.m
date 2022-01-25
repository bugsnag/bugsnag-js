#import "BugsnagReactNativeEmitter.h"

#import "Bugsnag+Private.h"
#import "BugsnagClient+Private.h"
#import "BugsnagUser+Private.h"

@implementation BugsnagReactNativeEmitter

RCT_EXPORT_MODULE();

- (NSArray<NSString *> *)supportedEvents {
  return @[@"bugsnag::sync"];
}

- (void)startObserving {
    __weak __typeof__(self) weakSelf = self;
    Bugsnag.client.observer = ^(BSGClientObserverEvent event, id value) {
        NSDictionary *data = [weakSelf serializeClientObserverEvent:event withValue:value];
        if (data) {
            [weakSelf sendEventWithName:@"bugsnag::sync" body:data];
        }
    };
}

- (void)stopObserving {
    Bugsnag.client.observer = nil;
}

- (NSDictionary *)serializeClientObserverEvent:(BSGClientObserverEvent)event withValue:(id)value {
    switch (event) {
        case BSGClientObserverAddFeatureFlag:
            if ([value isKindOfClass:[BugsnagFeatureFlag class]]) {
                return @{
                    @"type": @"AddFeatureFlag",
                    @"data": [NSDictionary dictionaryWithObjectsAndKeys:
                              ((BugsnagFeatureFlag *)value).name, @"name",
                              ((BugsnagFeatureFlag *)value).variant, @"variant",
                              nil]
                };
            }
            break;

        case BSGClientObserverClearFeatureFlag:
            if ([value isKindOfClass:[NSString class]]) {
                return @{
                    @"type": @"ClearFeatureFlag",
                    @"data": @{@"name": value}
                };
            } else if (!value) {
                return @{
                    @"type": @"ClearFeatureFlag"
                };
            }
            break;

        case BSGClientObserverUpdateContext:
            if ([value isKindOfClass:[NSString class]] || !value) {
                return @{
                    @"type": @"ContextUpdate",
                    @"data": value ?: [NSNull null]
                };
            }
            break;

        case BSGClientObserverUpdateMetadata:
            if ([value isKindOfClass:[BugsnagMetadata class]]) {
                return @{
                    @"type": @"MetadataUpdate",
                    @"data": [((BugsnagMetadata *)value) toDictionary]
                };
            }
            break;

        case BSGClientObserverUpdateUser:
            if ([value isKindOfClass:[BugsnagUser class]]) {
                return @{
                    @"type": @"UserUpdate",
                    @"data": [((BugsnagUser *)value) toJson]
                };
            }
            break;
    }

    return nil;
}

@end
