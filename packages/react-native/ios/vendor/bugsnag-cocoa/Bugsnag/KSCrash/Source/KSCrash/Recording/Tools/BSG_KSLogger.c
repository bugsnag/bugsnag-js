//
//  BSG_KSLogger.c
//
//  Created by Karl Stenerud on 11-06-25.
//
//  Copyright (c) 2011 Karl Stenerud. All rights reserved.
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

#include "BSG_KSLogger.h"

#include <stdarg.h>
#include <stdio.h>
#include <string.h>
#include <sys/errno.h>
#include <sys/fcntl.h>
#include <unistd.h>

// Compiler hints for "if" statements
#define unlikely_if(x) if (__builtin_expect(x, 0))

/** The buffer size to use when writing log entries.
 *
 * Any log entries that exceed this length will be truncated.
 */
#define BSG_KSLOGGER_CBufferSize 1024

/** Interpret the path as a unix file path and return the last path entry.
 * e.g. "/some/path/to/a/file.txt" will result in "file.txt"
 *
 * @param path The path to interpret.
 *
 * @return The last path entry.
 */
static inline const char *lastPathEntry(const char *const path) {
    const char *lastFile = strrchr(path, '/');
    return lastFile == 0 ? path : lastFile + 1;
}

/** The file descriptor where log entries get written. */
static int bsg_g_fd = STDOUT_FILENO;

static inline void setLogFD(int fd) {
    if (bsg_g_fd >= 0 && bsg_g_fd != STDOUT_FILENO &&
        bsg_g_fd != STDERR_FILENO && bsg_g_fd != STDIN_FILENO) {
        close(bsg_g_fd);
    }
    bsg_g_fd = fd;
}

bool bsg_kslog_setLogFilename(const char *filename, bool overwrite) {
    if (filename == NULL) {
        setLogFD(STDOUT_FILENO);
        return true;
    }

    int openMask = O_WRONLY | O_CREAT;
    if (overwrite) {
        openMask |= O_TRUNC;
    }
    int fd = open(filename, openMask, 0644);
    unlikely_if(fd < 0) {
        bsg_i_kslog_logCBasic("KSLogger: Could not open %s: %s", filename,
                              strerror(errno));
        return false;
    }

    setLogFD(fd);
    return true;
}

__printflike(1, 2)
void bsg_i_kslog_logCBasic(const char *const fmt, ...) {
    unlikely_if(!fmt) {
        return;
    }

    char buf[BSG_KSLOGGER_CBufferSize];
    const int size = sizeof(buf);

    va_list args;
    va_start(args, fmt);
    int len = vsnprintf(buf, size, fmt, args);
    if (len > size) {
        len = size;
    }
    va_end(args);

    unlikely_if(len < 0) {
        return;
    }

    if (len < size - 1) {
        buf[len++] = '\n';
    } else {
        buf[size - 1] = '\n';
    }

    write(bsg_g_fd, buf, (size_t)len);
}

__printflike(5, 6)
void bsg_i_kslog_logC(const char *const level, const char *const file,
                      const int line, const char *const function,
                      const char *const fmt, ...) {
    unlikely_if(!fmt) {
        return;
    }

    char buf[BSG_KSLOGGER_CBufferSize];
    const int size = sizeof(buf);

    int len = snprintf(buf, size, "%s: %s:%u: %s(): ",
                       level, lastPathEntry(file), line, function);
    if (len < 0) {
        return;
    }
    if (len > size) {
        len = size;
    }

    if (len < size - 1) {
        va_list args;
        va_start(args, fmt);
        int max = size - len;
        int msglen = vsnprintf(buf + len, max, fmt, args);
        va_end(args);
        unlikely_if(msglen < 0) {
            return;
        } else {
            len += msglen < max ? msglen : max;
        }
    }

    if (len < size - 1) {
        buf[len++] = '\n';
    } else {
        buf[size - 1] = '\n';
    }

    write(bsg_g_fd, buf, (size_t)len);
}
