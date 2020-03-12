#ifndef BugsnagPlugin_h
#define BugsnagPlugin_h

@class Bugsnag;

/**
 * Internal interface for adding custom behavior
 */
@protocol BugsnagPlugin <NSObject>

@required

- (void)load;
- (void)unload;

@end

#endif /* BugsnagPlugin_h */
