//
//  BSG_KSMachHeaders.h
//  Bugsnag
//
//  Created by Robin Macharg on 04/05/2020.
//  Copyright © 2020 Bugsnag. All rights reserved.
//

#ifndef BSG_KSMachHeaders_h
#define BSG_KSMachHeaders_h

#import <mach/machine.h>
#import <os/lock.h>
#import <libkern/OSAtomic.h>

/**
 * An encapsulation of the Mach header - either 64 or 32 bit, along with some additional information required for
 * detailing a crash report's binary images.
 */
typedef struct {
    const struct mach_header *header; /* The mach_header - 32 or 64 bit */
    uint64_t imageVmAddr;
    uint64_t imageSize;
    uint8_t *uuid;
    const char* name;
    intptr_t slide;
} BSG_Mach_Binary_Image_Info;

/**
 * MARK: - A Dynamic array container
 * See: https://stackoverflow.com/a/3536261/2431627
 */
typedef struct {
    uint32_t used;
    uint32_t size;
    BSG_Mach_Binary_Image_Info *contents;
} BSG_Mach_Binary_Images;


// MARK: - Locking

/**
 * An OS-version-specific lock, used to synchronise access to the array of binary image info.  A combination of
 * compile-time determination of the OS and and run-time determination of the OS version is used to ensure that
 * the correct lock mechanism is used.
 *
 * os_unfair_lock is available from specific OS versions onwards:
 *     https://developer.apple.com/documentation/os/os_unfair_lock
 *
 * It deprecates OSSpinLock:
 *     https://developer.apple.com/library/archive/documentation/System/Conceptual/ManPages_iPhoneOS/man3/spinlock.3.html
 *
 * The imported headers have specific version info: <os/lock.h> and <libkern/OSAtomic.h>
 */

void bsg_spin_lock(void);
void bsg_spin_unlock(void);
void bsg_unfair_lock(void);
void bsg_unfair_unlock(void);
void bsg_dyld_cache_lock(void);
void bsg_dyld_cache_unlock(void);

// MARK: - Replicate the DYLD API

/**
 * Returns the current number of images mapped in by dyld
 */
uint32_t bsg_dyld_image_count(void);

/**
 * Returns a pointer to the mach header of the image indexed by image_index.  If imageIndex
 * is out of range, NULL is returned.
 */
const struct mach_header* bsg_dyld_get_image_header(uint32_t imageIndex);

/**
 * Returns the virtural memory address slide amount of the image indexed by imageIndex.
 * If image_index is out of range zero is returned.
 */
intptr_t bsg_dyld_get_image_vmaddr_slide(uint32_t imageIndex);

/**
 * Returns the name of the image indexed by imageIndex.
 */
const char* bsg_dyld_get_image_name(uint32_t imageIndex);

BSG_Mach_Binary_Image_Info *bsg_dyld_get_image_info(uint32_t imageIndex); // An additional convenience function

/**
 * Called when a binary image is loaded.
 */
void bsg_mach_binary_image_added(const struct mach_header *mh, intptr_t slide);

/**
 * Called when a binary image is unloaded.
 */
void bsg_mach_binary_image_removed(const struct mach_header *mh, intptr_t slide);

/**
 * Create an empty array with initial capacity to hold Mach header info.
 */
BSG_Mach_Binary_Images *bsg_initialise_mach_binary_headers(uint32_t initialSize);

/**
 * Determines whether the OS supports unfair locks or not.
 */
void bsg_check_unfair_lock_support(void);

#endif /* BSG_KSMachHeaders_h */
