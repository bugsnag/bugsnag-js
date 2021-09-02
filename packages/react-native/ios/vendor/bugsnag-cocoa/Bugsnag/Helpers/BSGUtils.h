//
//  BSGUtils.h
//  Bugsnag
//
//  Created by Nick Dowell on 18/06/2021.
//  Copyright © 2021 Bugsnag Inc. All rights reserved.
//

#import <Foundation/Foundation.h>

#if TARGET_OS_IOS
#import "BSGUIKit.h"
#endif

__BEGIN_DECLS

NS_ASSUME_NONNULL_BEGIN

dispatch_queue_t BSGGetFileSystemQueue(void);

#if TARGET_OS_IOS
NSString *_Nullable BSGStringFromDeviceOrientation(UIDeviceOrientation orientation);
#endif

API_AVAILABLE(ios(11.0), tvos(11.0))
NSString *_Nullable BSGStringFromThermalState(NSProcessInfoThermalState thermalState);

NS_ASSUME_NONNULL_END

__END_DECLS
