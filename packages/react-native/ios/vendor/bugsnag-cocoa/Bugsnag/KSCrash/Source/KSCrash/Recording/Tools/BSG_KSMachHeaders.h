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

/* Maintaining our own list of framework Mach headers means that we avoid potential
 * deadlock situations where we try and suspend lock-holding threads prior to
 * loading mach headers as part of our normal event handling behaviour.
 */

/**
 * An encapsulation of the Mach header data as a linked list - either 64 or 32 bit, along with some additiona
 * information required for detailing a crash report's binary images.
 * 
 * The removed field indicates that the library has since been unloaded by dyld and can be ignored.
 */
typedef struct bsg_mach_image {
    const struct mach_header *header; /* The mach_header - 32 or 64 bit */
    uint64_t imageVmAddr;
    uint64_t imageSize;
    uint8_t *uuid;
    const char* name;
    intptr_t slide;
    bool unloaded;
    struct bsg_mach_image *next;
} BSG_Mach_Header_Info;

// MARK: - Operations

/**
  * Resets mach header data
 */
void bsg_mach_headers_initialize(void);

/**
  * Registers with dyld to keep data updated when libraries are loaded and unloaded
 */
void bsg_mach_headers_register_for_changes(void);

/**
 * Returns the head of the link list of headers
 */
BSG_Mach_Header_Info *bsg_mach_headers_get_images(void);

/**
 * Called when a binary image is loaded.
 */
void bsg_mach_headers_add_image(const struct mach_header *mh, intptr_t slide);

/**
 * Called when a binary image is unloaded.
 */
void bsg_mach_headers_remove_image(const struct mach_header *mh, intptr_t slide);

/** Get the image index that the specified address is part of.
*
* @param address The address to examine.
* @return The index of the image it is part of, or UINT_MAX if none was found.
*/
BSG_Mach_Header_Info *bsg_mach_headers_image_at_address(const uintptr_t address);


/** Find a loaded binary image with the specified name.
 *
 * @param imageName The image name to look for.
 *
 * @param exactMatch If true, look for an exact match instead of a partial one.
 *
 * @return the matched image, or NULL if not found.
 */
BSG_Mach_Header_Info *bsg_mach_headers_image_named(const char *const imageName, bool exactMatch);

/** Get the address of the first command following a header (which will be of
 * type struct load_command).
 *
 * @param header The header to get commands for.
 *
 * @return The address of the first command, or NULL if none was found (which
 *         should not happen unless the header or image is corrupt).
 */
uintptr_t bsg_mach_headers_first_cmd_after_header(const struct mach_header *header);

/** Get the segment base address of the specified image.
 *
 * This is required for any symtab command offsets.
 *
 * @param header The header to get commands for.
 * @return The image's base address, or 0 if none was found.
 */
uintptr_t bsg_mach_headers_image_at_base_of_image_index(const struct mach_header *header);

#endif /* BSG_KSMachHeaders_h */
