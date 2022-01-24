//
//  BSG_KSFile.h
//  Bugsnag
//
//  Created by Nick Dowell on 12/01/2022.
//  Copyright © 2022 Bugsnag Inc. All rights reserved.
//

#pragma once

#include <stdbool.h>
#include <stddef.h>

typedef struct {
    int fd;
    char *buffer;
    size_t bufferSize;
    size_t bufferUsed;
} BSG_KSFile;

void BSG_KSFileInit(BSG_KSFile *file, int fd, char *buffer, size_t length);

bool BSG_KSFileWrite(BSG_KSFile *file, const char *data, size_t length);

bool BSG_KSFileFlush(BSG_KSFile *file);
