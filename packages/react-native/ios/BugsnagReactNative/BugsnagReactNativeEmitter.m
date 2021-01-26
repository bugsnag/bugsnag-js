#import "BugsnagReactNativeEmitter.h"

#import "Bugsnag+Private.h"
#import "BugsnagClient+Private.h"
#import "BugsnagStateEvent.h"

typedef void (^BugsnagObserverBlock)(BugsnagStateEvent *_Nonnull event);

@interface BugsnagReactNativeEmitter ()
@property BugsnagObserverBlock observerBlock;
@end

@implementation BugsnagReactNativeEmitter

RCT_EXPORT_MODULE();

- (NSArray<NSString *> *)supportedEvents {
  return @[@"bugsnag::sync"];
}

- (void)startObserving {
    __weak __typeof__(self) weakSelf = self;
    self.observerBlock = ^(BugsnagStateEvent * _Nonnull event) {
        if (weakSelf) {
            NSDictionary *data = [weakSelf serializeStateChangeData:event];
            [weakSelf sendEventWithName:@"bugsnag::sync" body:data];
        }
    };
    [[Bugsnag client] addObserverWithBlock:self.observerBlock];
}

- (void)stopObserving {
    [[Bugsnag client] removeObserverWithBlock:self.observerBlock];
}

- (NSDictionary *)serializeStateChangeData:(BugsnagStateEvent *)event {
    id obj;

    if ([@"ContextUpdate" isEqualToString:event.type]) {
        obj = event.data;
    } else if ([@"UserUpdate" isEqualToString:event.type]) {
        obj = event.data;
    } else if ([@"MetadataUpdate" isEqualToString:event.type]) {
        BugsnagMetadata *metadata = event.data;
        obj = [metadata toDictionary];
    }

    NSMutableDictionary *dict = [NSMutableDictionary new];
    dict[@"type"] = event.type;

    if (obj != nil) {
        dict[@"data"] = obj;
    } else {
        dict[@"data"] = [NSNull null];
    }
    return dict;
}

@end
