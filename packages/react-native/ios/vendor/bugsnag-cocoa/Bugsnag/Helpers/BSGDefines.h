//
//  BSGDefines.h
//  Bugsnag
//
//  Copyright © 2022 Bugsnag Inc. All rights reserved.
//

#ifndef BSGDefines_h
#define BSGDefines_h

#include <TargetConditionals.h>

#define BSG_PRIVATE __attribute__((visibility("hidden")))

// Capabilities dependent upon system defines and files
#define BSG_HAVE_APPKIT                       __has_include(<AppKit/AppKit.h>)
#define BSG_HAVE_BATTERY                      (                 TARGET_OS_IOS                 || TARGET_OS_WATCH)
#define BSG_HAVE_MACH_EXCEPTIONS              (TARGET_OS_OSX || TARGET_OS_IOS                                   )
#define BSG_HAVE_MACH_THREADS                 (TARGET_OS_OSX || TARGET_OS_IOS || TARGET_OS_TV                   )
#define BSG_HAVE_OOM_DETECTION                (                 TARGET_OS_IOS || TARGET_OS_TV                   )
#define BSG_HAVE_REACHABILITY                 (TARGET_OS_OSX || TARGET_OS_IOS || TARGET_OS_TV                   )
#define BSG_HAVE_REACHABILITY_WWAN            (                 TARGET_OS_IOS || TARGET_OS_TV                   )
#define BSG_HAVE_SIGNAL                       (TARGET_OS_OSX || TARGET_OS_IOS || TARGET_OS_TV                   )
#define BSG_HAVE_SIGALTSTACK                  (TARGET_OS_OSX || TARGET_OS_IOS                                   )
#define BSG_HAVE_SYSCALL                      (TARGET_OS_OSX || TARGET_OS_IOS || TARGET_OS_TV                   )
#define BSG_HAVE_UIDEVICE                     __has_include(<UIKit/UIDevice.h>)
#define BSG_HAVE_UIKIT                        __has_include(<UIKit/UIKit.h>)
#define BSG_HAVE_WATCHKIT                     __has_include(<WatchKit/WatchKit.h>)
#define BSG_HAVE_WINDOW                       (TARGET_OS_OSX || TARGET_OS_IOS || TARGET_OS_TV                   )

// Capabilities dependent upon previously defined capabilities
#define BSG_HAVE_APP_HANG_DETECTION           (BSG_HAVE_MACH_THREADS)

#endif /* BSGDefines_h */
