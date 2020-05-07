#import "BugsnagReactNativeEmitter.h"
#import "Bugsnag.h"
#import "BugsnagClient.h"

@interface BugsnagStateEvent: NSObject
@property NSString *type;
@property id data;
@end

typedef void (^BugsnagObserverBlock)(BugsnagStateEvent *_Nonnull event);

@interface Bugsnag ()
+ (BugsnagClient *)client;
@end

@interface BugsnagClient ()
- (void)addObserverWithBlock:(BugsnagObserverBlock _Nonnull)block;
- (void)removeObserverWithBlock:(BugsnagObserverBlock _Nonnull)block;
@end

@interface BugsnagMetadata ()
- (NSDictionary *)toDictionary;
@end

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
