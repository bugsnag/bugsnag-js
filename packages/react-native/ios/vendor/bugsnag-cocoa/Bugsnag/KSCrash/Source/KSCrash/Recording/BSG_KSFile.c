//
//  BSG_KSFile.c
//  Bugsnag
//
//  Created by Nick Dowell on 12/01/2022.
//  Copyright © 2022 Bugsnag Inc. All rights reserved.
//

#include "BSG_KSFile.h"

#include "BSG_KSFileUtils.h"

#include <string.h>
#include <sys/param.h>

static inline bool bsg_write(const int fd, const char *bytes, size_t length) {
    return bsg_ksfuwriteBytesToFD(fd, bytes, (ssize_t)length);
}

void BSG_KSFileInit(BSG_KSFile *file, int fd, char *buffer, size_t length) {
    file->fd = fd;
    file->buffer = buffer;
    file->bufferSize = length;
    file->bufferUsed = 0;
}

bool BSG_KSFileWrite(BSG_KSFile *file, const char *data, size_t length) {
    const size_t bytesCopied = MIN(file->bufferSize - file->bufferUsed, length);
    memcpy(file->buffer + file->bufferUsed, data, bytesCopied);
    file->bufferUsed += bytesCopied;
    data += bytesCopied;
    length -= bytesCopied;
    
    if (file->bufferUsed == file->bufferSize) {
        if (!BSG_KSFileFlush(file)) {
            return false;
        }
    }
    
    if (!length) {
        return true;
    }
    
    if (length >= file->bufferSize) {
        return bsg_write(file->fd, data, length);
    }
    
    memcpy(file->buffer, data, length);
    file->bufferUsed = length;
    return true;
}

bool BSG_KSFileFlush(BSG_KSFile *file) {
    if (!bsg_write(file->fd, file->buffer, file->bufferUsed)) {
        return false;
    }
    file->bufferUsed = 0;
    return true;
}
