//
//  BugsnagErrorReportSink.h
//
//  Created by Conrad Irwin on 2014-10-01.
//
//  Copyright (c) 2014 Bugsnag, Inc. All rights reserved.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall remain in place
// in this source code.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
//

#import <Foundation/Foundation.h>
#import "BSG_KSCrash.h"
#import "BugsnagErrorReportApiClient.h"

NS_ASSUME_NONNULL_BEGIN

@interface BugsnagErrorReportSink : NSObject

@property(nonatomic, strong) BugsnagErrorReportApiClient *apiClient;

- (instancetype)initWithApiClient:(BugsnagErrorReportApiClient *)apiClient;

/**
 * Invoked when reports stored by KSCrash need to be delivered.
 *
 * @param ksCrashReports a map of KSCrash reports represented as dictionaries, with the filename as the key
 * @param block a block that is invoked when delivery of each file concludes
 */
- (void)sendStoredReports:(NSDictionary <NSString *, NSDictionary *> *)ksCrashReports
                withBlock:(BSGOnErrorSentBlock)block;

@end

NS_ASSUME_NONNULL_END
