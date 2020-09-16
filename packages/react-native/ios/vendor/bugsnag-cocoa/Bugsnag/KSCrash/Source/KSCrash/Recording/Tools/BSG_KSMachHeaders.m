//
//  BSG_KSMachHeaders.m
//  Bugsnag
//
//  Created by Robin Macharg on 04/05/2020.
//  Copyright © 2020 Bugsnag. All rights reserved.
//

#import <mach-o/dyld.h>
#import <dlfcn.h>
#import <Foundation/Foundation.h>
#import "BSG_KSDynamicLinker.h"
#import "BSG_KSMachHeaders.h"
#import "BugsnagPlatformConditional.h"

// MARK: - Locking

static const NSOperatingSystemVersion minSdkForUnfairLock =
    #if BSG_PLATFORM_IOS
    {10,0,0};
    #elif BSG_PLATFORM_OSX
    {10,12,0};
    #elif BSG_PLATFORM_TVOS
    {10,0,0};
    #elif BSG_PLATFORM_WATCHOS
    {3,0,0}
    #endif

// Pragma's hide unavoidable (and expected) deprecation/unavailable warnings
_Pragma("clang diagnostic push")
_Pragma("clang diagnostic ignored \"-Wunguarded-availability\"")
static os_unfair_lock bsg_mach_binary_images_access_lock_unfair = OS_UNFAIR_LOCK_INIT;
_Pragma("clang diagnostic pop")

_Pragma("clang diagnostic push")
_Pragma("clang diagnostic ignored \"-Wdeprecated-declarations\"")
static OSSpinLock bsg_mach_binary_images_access_lock_spin = OS_SPINLOCK_INIT;
_Pragma("clang diagnostic pop")

// Lock helpers.  These use bulky Pragmas to hide warnings so are in their own functions for clarity.

void bsg_spin_lock() {
    _Pragma("clang diagnostic push")
    _Pragma("clang diagnostic ignored \"-Wdeprecated-declarations\"")
    OSSpinLockLock(&bsg_mach_binary_images_access_lock_spin);
    _Pragma("clang diagnostic pop")
}

void bsg_spin_unlock() {
    _Pragma("clang diagnostic push")
    _Pragma("clang diagnostic ignored \"-Wdeprecated-declarations\"")
    OSSpinLockUnlock(&bsg_mach_binary_images_access_lock_spin);
    _Pragma("clang diagnostic pop")
}

void bsg_unfair_lock() {
    _Pragma("clang diagnostic push")
    _Pragma("clang diagnostic ignored \"-Wunguarded-availability\"")
    os_unfair_lock_lock(&bsg_mach_binary_images_access_lock_unfair);
    _Pragma("clang diagnostic pop")
}

void bsg_unfair_unlock() {
    _Pragma("clang diagnostic push")
    _Pragma("clang diagnostic ignored \"-Wunguarded-availability\"")
    os_unfair_lock_unlock(&bsg_mach_binary_images_access_lock_unfair);
    _Pragma("clang diagnostic pop")
}

void bsg_mach_headers_cache_lock() {
    if ([[NSProcessInfo processInfo] isOperatingSystemAtLeastVersion:minSdkForUnfairLock]) {
        bsg_unfair_lock();
    } else {
        bsg_spin_lock();
    }
}

void bsg_mach_headers_cache_unlock() {
    if ([[NSProcessInfo processInfo] isOperatingSystemAtLeastVersion:minSdkForUnfairLock]) {
        bsg_unfair_unlock();
    } else {
        bsg_spin_unlock();
    }
}

// MARK: - Mach Header Linked List

static BSG_Mach_Header_Info *bsg_g_mach_headers_images_head;
static BSG_Mach_Header_Info *bsg_g_mach_headers_images_tail;

BSG_Mach_Header_Info *bsg_mach_headers_get_images() {
    return bsg_g_mach_headers_images_head;
}

void bsg_mach_headers_initialize() {
    
    // Clear any existing headers to reset the head/tail pointers
    for (BSG_Mach_Header_Info *img = bsg_g_mach_headers_images_head; img != NULL; ) {
        BSG_Mach_Header_Info *imgToDelete = img;
        img = img->next;
        free(imgToDelete);
    }
    
    bsg_g_mach_headers_images_head = NULL;
    bsg_g_mach_headers_images_tail = NULL;
}

void bsg_mach_headers_register_for_changes() {
    
    // Register for binary images being loaded and unloaded. dyld calls the add function once
    // for each library that has already been loaded and then keeps this cache up-to-date
    // with future changes
    _dyld_register_func_for_add_image(&bsg_mach_headers_add_image);
    _dyld_register_func_for_remove_image(&bsg_mach_headers_remove_image);

}

/**
 * Populate a Mach binary image info structure
 *
 * @param header The Mach binary image header
 *
 * @param info Encapsulated Binary Image info
 *
 * @returns a boolean indicating success
 */
bool bsg_mach_headers_populate_info(const struct mach_header *header, intptr_t slide, BSG_Mach_Header_Info *info) {
    
    // Early exit conditions; this is not a valid/useful binary image
    // 1. We can't find a sensible Mach command
    uintptr_t cmdPtr = bsg_mach_headers_first_cmd_after_header(header);
    if (cmdPtr == 0) {
        return false;
    }

    // 2. The image doesn't have a name.  Note: running with a debugger attached causes this condition to match.
    Dl_info DlInfo = (const Dl_info) { 0 };
    dladdr(header, &DlInfo);
    const char *imageName = DlInfo.dli_fname;
    if (!imageName) {
        return false;
    }
    
    // Look for the TEXT segment to get the image size.
    // Also look for a UUID command.
    uint64_t imageSize = 0;
    uint64_t imageVmAddr = 0;
    uint8_t *uuid = NULL;

    for (uint32_t iCmd = 0; iCmd < header->ncmds; iCmd++) {
        struct load_command *loadCmd = (struct load_command *)cmdPtr;
        switch (loadCmd->cmd) {
        case LC_SEGMENT: {
            struct segment_command *segCmd = (struct segment_command *)cmdPtr;
            if (strcmp(segCmd->segname, SEG_TEXT) == 0) {
                imageSize = segCmd->vmsize;
                imageVmAddr = segCmd->vmaddr;
            }
            break;
        }
        case LC_SEGMENT_64: {
            struct segment_command_64 *segCmd =
                (struct segment_command_64 *)cmdPtr;
            if (strcmp(segCmd->segname, SEG_TEXT) == 0) {
                imageSize = segCmd->vmsize;
                imageVmAddr = segCmd->vmaddr;
            }
            break;
        }
        case LC_UUID: {
            struct uuid_command *uuidCmd = (struct uuid_command *)cmdPtr;
            uuid = uuidCmd->uuid;
            break;
        }
        }
        cmdPtr += loadCmd->cmdsize;
    }
    
    // Save these values
    info->header = header;
    info->imageSize = imageSize;
    info->imageVmAddr = imageVmAddr;
    info->uuid = uuid;
    info->name = imageName;
    info->slide = slide;
    info->unloaded = FALSE;
    info->next = NULL;
    
    return true;
}

void bsg_mach_headers_add_image(const struct mach_header *header, intptr_t slide) {
    
    BSG_Mach_Header_Info *newImage = malloc(sizeof(BSG_Mach_Header_Info));
    if (newImage != NULL) {
        if (bsg_mach_headers_populate_info(header, slide, newImage)) {
            
            bsg_mach_headers_cache_lock();
            
            if (bsg_g_mach_headers_images_head == NULL) {
                bsg_g_mach_headers_images_head = newImage;
            } else {
                bsg_g_mach_headers_images_tail->next = newImage;
            }
            bsg_g_mach_headers_images_tail = newImage;
            
            bsg_mach_headers_cache_unlock();
        }
    }
    
}

/**
  * To avoid a destructive operation that could lead thread safety problems, we maintain the
  * image record, but mark it as unloaded
 */
void bsg_mach_headers_remove_image(const struct mach_header *header, intptr_t slide) {
    BSG_Mach_Header_Info existingImage = { 0 };
    if (bsg_mach_headers_populate_info(header, slide, &existingImage)) {
        for (BSG_Mach_Header_Info *img = bsg_g_mach_headers_images_head; img != NULL; img = img->next) {
            if (img->imageVmAddr == existingImage.imageVmAddr) {
                img->unloaded = true;
            }
        }
    }
}

BSG_Mach_Header_Info *bsg_mach_headers_image_named(const char *const imageName, bool exactMatch) {
        
    if (imageName != NULL) {
        
        for (BSG_Mach_Header_Info *img = bsg_g_mach_headers_images_head; img != NULL; img = img->next) {
            if (img->name == NULL) {
                continue; // name is null if the index is out of range per dyld(3)
            } else if (img->unloaded == true) {
                continue; // ignore unloaded libraries
            } else if (exactMatch) {
                if (strcmp(img->name, imageName) == 0) {
                    return img;
                }
            } else {
                if (strstr(img->name, imageName) != NULL) {
                    return img;
                }
            }
        }
    }
    
    return NULL;
}

BSG_Mach_Header_Info *bsg_mach_headers_image_at_address(const uintptr_t address) {
        
    for (BSG_Mach_Header_Info *img = bsg_g_mach_headers_images_head; img != NULL; img = img->next) {
        if (img->unloaded == true) {
            continue;
        }
        // Look for a segment command with this address within its range.
        uintptr_t cmdPtr = bsg_mach_headers_first_cmd_after_header(img->header);
        if (cmdPtr == 0) {
            continue;
        }
        uintptr_t addressWSlide = address - img->slide;
        for (uint32_t iCmd = 0; iCmd < img->header->ncmds; iCmd++) {
            const struct load_command *loadCmd =
                (struct load_command *)cmdPtr;
            if (loadCmd->cmd == LC_SEGMENT) {
                const struct segment_command *segCmd =
                    (struct segment_command *)cmdPtr;
                if (addressWSlide >= segCmd->vmaddr &&
                    addressWSlide < segCmd->vmaddr + segCmd->vmsize) {
                    return img;
                }
            } else if (loadCmd->cmd == LC_SEGMENT_64) {
                const struct segment_command_64 *segCmd =
                    (struct segment_command_64 *)cmdPtr;
                if (addressWSlide >= segCmd->vmaddr &&
                    addressWSlide < segCmd->vmaddr + segCmd->vmsize) {
                    return img;
                }
            }
            cmdPtr += loadCmd->cmdsize;
        }
    }
    
    return NULL;
}

uintptr_t bsg_mach_headers_first_cmd_after_header(const struct mach_header *const header) {
    if (header == NULL) {
      return 0;
    }
    switch (header->magic) {
    case MH_MAGIC:
    case MH_CIGAM:
        return (uintptr_t)(header + 1);
    case MH_MAGIC_64:
    case MH_CIGAM_64:
        return (uintptr_t)(((struct mach_header_64 *)header) + 1);
    default:
        // Header is corrupt
        return 0;
    }
}

uintptr_t bsg_mach_headers_image_at_base_of_image_index(const struct mach_header *const header) {
    // Look for a segment command and return the file image address.
    uintptr_t cmdPtr = bsg_mach_headers_first_cmd_after_header(header);
    if (cmdPtr == 0) {
        return 0;
    }
    for (uint32_t i = 0; i < header->ncmds; i++) {
        const struct load_command *loadCmd = (struct load_command *)cmdPtr;
        if (loadCmd->cmd == LC_SEGMENT) {
            const struct segment_command *segmentCmd =
                (struct segment_command *)cmdPtr;
            if (strcmp(segmentCmd->segname, SEG_LINKEDIT) == 0) {
                return segmentCmd->vmaddr - segmentCmd->fileoff;
            }
        } else if (loadCmd->cmd == LC_SEGMENT_64) {
            const struct segment_command_64 *segmentCmd =
                (struct segment_command_64 *)cmdPtr;
            if (strcmp(segmentCmd->segname, SEG_LINKEDIT) == 0) {
                return (uintptr_t)(segmentCmd->vmaddr - segmentCmd->fileoff);
            }
        }
        cmdPtr += loadCmd->cmdsize;
    }

    return 0;
}
