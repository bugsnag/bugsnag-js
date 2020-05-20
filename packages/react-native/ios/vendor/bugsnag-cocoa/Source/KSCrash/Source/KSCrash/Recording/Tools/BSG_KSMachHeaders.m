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

// MARK: - Replicate the DYLD API

uint32_t bsg_dyld_image_count(void) {
    return bsg_mach_binary_images.used;
}

const struct mach_header* bsg_dyld_get_image_header(uint32_t imageIndex) {
    if (imageIndex < bsg_mach_binary_images.used) {
        return bsg_mach_binary_images.contents[imageIndex].header;
    }
    return NULL;
}

intptr_t bsg_dyld_get_image_vmaddr_slide(uint32_t imageIndex) {
    if (imageIndex < bsg_mach_binary_images.used) {
        return bsg_mach_binary_images.contents[imageIndex].slide;
    }
    return 0;
}

const char* bsg_dyld_get_image_name(uint32_t imageIndex) {
    if (imageIndex < bsg_mach_binary_images.used) {
        return bsg_mach_binary_images.contents[imageIndex].name;
    }
    return NULL;
}

BSG_Mach_Binary_Image_Info *bsg_dyld_get_image_info(uint32_t imageIndex) {
    if (imageIndex < bsg_mach_binary_images.used) {
        return &bsg_mach_binary_images.contents[imageIndex];
    }
    return NULL;
}

/**
 * Store a Mach binary image-excapsulating struct in a dynamic array.
 * The array doubles on filling-up.  Typical sizes is expected to be in < 1000 (i.e. 2-3 doublings, at app start-up)
 * This should be called in a threadsafe way; we lock against a simultaneous add and remove.
 */
void bsg_add_mach_binary_image(BSG_Mach_Binary_Image_Info element) {
    
    BSG_DYLD_CACHE_LOCK
    
    // Expand array if necessary.  We're slightly paranoid here.  An OOM is likely to be indicative of bigger problems
    // but we should still do *our* best not to crash the app.
    if (bsg_mach_binary_images.used == bsg_mach_binary_images.size) {
        uint32_t newSize = bsg_mach_binary_images.size *= 2;
        uint32_t newAllocationSize = newSize * sizeof(BSG_Mach_Binary_Image_Info);
        errno = 0;
        BSG_Mach_Binary_Image_Info *newAllocation = (BSG_Mach_Binary_Image_Info *)realloc(bsg_mach_binary_images.contents, newAllocationSize);
        
        if (newAllocation != NULL && errno != ENOMEM) {
            bsg_mach_binary_images.size = newSize;
            bsg_mach_binary_images.contents = newAllocation;
        }
        else {
            // Exit early, don't expand the array, don't store the header info and unlock
            BSG_DYLD_CACHE_UNLOCK
            return;
        }
    }
    
    // Store the value, increment the number of used elements
    bsg_mach_binary_images.contents[bsg_mach_binary_images.used++] = element;
    
    BSG_DYLD_CACHE_UNLOCK
}

/**
 * Binary images can only be loaded at most once.  We can use the VMAddress as a key, without needing to compare the
 * other fields.  Element order is not important; deletion is accomplished by copying the last item into the deleted
 * position.
 */
void bsg_remove_mach_binary_image(uint64_t imageVmAddr) {
    
    BSG_DYLD_CACHE_LOCK
    
    for (uint32_t i=0; i<bsg_mach_binary_images.used; i++) {
        BSG_Mach_Binary_Image_Info item = bsg_mach_binary_images.contents[i];
        
        if (imageVmAddr == item.imageVmAddr) {
            // Note: removal of the last (ith) item involves a redundant copy from last->last.
            if (bsg_mach_binary_images.used >= 2) {
                bsg_mach_binary_images.contents[i] = bsg_mach_binary_images.contents[--bsg_mach_binary_images.used];
            }
            else {
                bsg_mach_binary_images.used = 0;
            }
            break; // an image can only be loaded singularly; exit loop once found
        }
    }
    
    BSG_DYLD_CACHE_UNLOCK
}

BSG_Mach_Binary_Images *bsg_initialise_mach_binary_headers(uint32_t initialSize) {
    bsg_mach_binary_images.contents = (BSG_Mach_Binary_Image_Info *)malloc(initialSize * sizeof(BSG_Mach_Binary_Image_Info));
    bsg_mach_binary_images.used = 0;
    bsg_mach_binary_images.size = initialSize;
    return &bsg_mach_binary_images;
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
bool bsg_populate_mach_image_info(const struct mach_header *header, intptr_t slide, BSG_Mach_Binary_Image_Info *info) {
    
    // Early exit conditions; this is not a valid/useful binary image
    // 1. We can't find a sensible Mach command
    uintptr_t cmdPtr = bsg_ksdlfirstCmdAfterHeader(header);
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
    
    return true;
}

/**
 * A callback invoked when dyld loads binary images.  It stores enough relevant info about the
 * image to populate a crash report later.
 *
 * @param header A mach_header structure
 *
 * @param slide A virtual memory slide amount. The virtual memory slide amount specifies the difference between the
 *              address at which the image was linked and the address at which the image is loaded.
 */
void bsg_mach_binary_image_added(const struct mach_header *header, intptr_t slide)
{
    BSG_Mach_Binary_Image_Info info = { 0 };
    if (bsg_populate_mach_image_info(header, slide, &info)) {
        bsg_add_mach_binary_image(info);
    }
}

/**
 * Called when a binary image is unloaded.
 */
void bsg_mach_binary_image_removed(const struct mach_header *header, intptr_t slide)
{
    // Convert header into an info struct
    BSG_Mach_Binary_Image_Info info = { 0 };
    if (bsg_populate_mach_image_info(header, slide, &info)) {
        bsg_remove_mach_binary_image(info.imageVmAddr);
    }
}
