#ifndef BugsnagPlugin_h
#define BugsnagPlugin_h

/**
 * Internal interface for adding custom behavior
 */
@protocol BugsnagPlugin <NSObject>

@required

- (BOOL)isStarted;

- (void)start;

@end

#endif /* BugsnagPlugin_h */
