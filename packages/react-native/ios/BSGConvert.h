#import "Bugsnag.h"
#import <Foundation/Foundation.h>

/**
 * Read breadcrumb type from string value
 */
BSGBreadcrumbType BSGBreadcrumbTypeFromString(NSString *type);

/**
 * Convert typed dictionary format (via serializeForNativeLayer) into native
 * values
 */
NSDictionary *BSGConvertTypedNSDictionary(id rawData);

/**
 * Convert a JavaScript engine stacktrace into report payload format
 * @param stacktrace a stacktrace represented as a single block
 * @param formatter formatter to use to convert line/column numbers into strings
 *                  as needed
 * @return array of frames
 */
NSArray *BSGParseJavaScriptStacktrace(NSString *stacktrace,
                                      NSNumberFormatter *formatter);
