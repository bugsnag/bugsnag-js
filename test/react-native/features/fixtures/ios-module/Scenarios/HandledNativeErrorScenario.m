#import "HandledNativeErrorScenario.h"

@implementation HandledNativeErrorScenario

- (void)run {
    @try {
        // Code that can potentially throw an Exception:
        NSDictionary *actuallyReallyJSON = nil;
        [NSJSONSerialization dataWithJSONObject:actuallyReallyJSON options:0 error:nil];
    }
    @catch (NSException *exception) {
      [Bugsnag notify:exception];
    }
}

@end
