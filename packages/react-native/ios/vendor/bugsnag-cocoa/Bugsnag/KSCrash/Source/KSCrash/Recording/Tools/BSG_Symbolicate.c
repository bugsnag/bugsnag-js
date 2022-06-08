//
//  BSG_Symbolicate.c
//  Bugsnag
//
//  Copyright © 2021 Bugsnag Inc. All rights reserved.
//

#include "BSG_Symbolicate.h"

#include "BSG_KSLogger.h"
#include "BSG_KSMachHeaders.h"

#include <mach-o/loader.h>
#include <mach-o/nlist.h>
#include <string.h>

#ifdef __LP64__
#define LC_SEGMENT_BSG LC_SEGMENT_64
typedef struct nlist_64 nlist_t;
typedef struct segment_command_64 segment_command_t;
typedef struct section_64 section_t;
#else
#define LC_SEGMENT_BSG LC_SEGMENT
typedef struct nlist nlist_t;
typedef struct segment_command segment_command_t;
typedef struct section section_t;
#endif

struct leb128_uintptr_context {
    uintptr_t value;
    uint32_t shift;
};

// Process a single byte of LEB128-encoded data and return 1 if it was the last byte of a value.
static int leb128_uintptr_decode(struct leb128_uintptr_context *context, uint8_t input, uintptr_t *output) {
    context->value |= ((input & 0x7Ful) << context->shift);
    context->shift += 7;
    if (input < 0x80) { // The most significant bit is not set, so this is the last byte.
        *output = context->value;
        context->value = 0;
        context->shift = 0;
        return 1;
    }
    return 0;
}

#if __clang_major__ >= 11 // Xcode 10 does not like the following attribute
__attribute__((annotate("oclint:suppress[deep nested block]")))
#endif
void bsg_symbolicate(const uintptr_t instruction_addr, struct bsg_symbolicate_result *result) {
    bzero(result, sizeof(*result));
    
    struct bsg_mach_image *image = bsg_mach_headers_image_at_address(instruction_addr);
    if (!image || !image->header) {
        return;
    }
    
    const struct load_command *load_cmd = (const void *)bsg_mach_headers_first_cmd_after_header(image->header);
    if (!load_cmd) {
        return;
    }
    
    result->image = image;
    
    const uintptr_t slide = (uintptr_t)image->slide;
    
    const segment_command_t *linkedit = NULL;
    const struct linkedit_data_command *function_starts = NULL;
    const struct symtab_command *symtab = NULL;
    
    for (uint32_t lc_idx = 0; lc_idx < image->header->ncmds; ++lc_idx) {
        switch (load_cmd->cmd) {
            case LC_SEGMENT_BSG: {
                const segment_command_t *seg_cmd = (const void *)load_cmd;
                
                // The function starts and symtab data resides in __LINKEDIT
                if (strncmp(seg_cmd->segname, SEG_LINKEDIT, sizeof(seg_cmd->segname)) == 0) {
                    linkedit = seg_cmd;
                }
                
                // Sanity check: the instruction address is in the __text section.
                // Function Starts data only describes things within the __text section.
                // We may sometimes be asked to symbolicate addresses in the __stubs section,
                // which would be nice support in addition.
                if (strncmp(seg_cmd->segname, SEG_TEXT, sizeof(seg_cmd->segname)) == 0) {
                    const section_t *sections = (const section_t *)(seg_cmd + 1);
                    for (uint32_t sect_idx = 0; sect_idx < seg_cmd->nsects; sect_idx++) {
                        const section_t *section = sections + sect_idx;
                        if (strncmp(section->sectname, SECT_TEXT, sizeof(section->sectname)) == 0) {
                            uintptr_t start = section->addr + slide;
                            uintptr_t end = start + section->size;
                            if (instruction_addr < start || instruction_addr >= end) {
                                BSG_KSLOG_ERROR("Address %p is outside the " SECT_TEXT " section of image %s",
                                                (void *)instruction_addr, image->name);
                                return;
                            }
                            break;
                        }
                    }
                }
                break;
            }
                
            case LC_FUNCTION_STARTS: // first appeared in
                // - cctools-800 (Xcode 4.0)
                // - ld64-123.2  (Xcode 4.0)
                // - dyld-195.5  (OS X 10.7 / iOS 5)
                function_starts = (const void *)load_cmd;
                break;
                
            case LC_SYMTAB:
                symtab = (const void *)load_cmd;
                break;
                
            default:
                break;
        }
        load_cmd = (const void *)(uintptr_t)load_cmd + load_cmd->cmdsize;
    }
    
    // The layout of segments in memory differs depending on whether the image is in the dyld cache.
    // Subtracting __LINKEDIT's fileoff converts a *file* offset into an offset relative to __LINKEDIT
    // that lets us compute the data's address in memory regardless of layout.
#define get_linkedit_data(__dataoff__) (const void *)(linkedit->vmaddr + slide - linkedit->fileoff + (__dataoff__))
    
    // Search functions starts data for a function that contains the address
    if (function_starts && linkedit && function_starts->dataoff > linkedit->fileoff) {
        // Function starts are stored as a series of LEB128 encoded deltas
        // Starting with delta from start of __TEXT
        uintptr_t addr = (uintptr_t)image->imageVmAddr + slide;
        uintptr_t func_start = addr;
        struct leb128_uintptr_context context = {0};
        const uint8_t *data = get_linkedit_data(function_starts->dataoff);
        for (uint32_t i = 0; i < function_starts->datasize; i++) {
            uintptr_t delta = 0;
            if (leb128_uintptr_decode(&context, data[i], &delta) && delta) {
                addr += delta;
                uintptr_t next_func_start = addr;
#if __arm__
#define THUMB_INSTRUCTION_TAG 1ul
                // ld64 sets the least significant bit for thumb instructions, which needs to be
                // zeroed to recover the original address - see FunctionStartsAtom<A>::encode()
                // https://opensource.apple.com/source/ld64/ld64-123.2/src/ld/LinkEdit.hpp.auto.html
                if (next_func_start & THUMB_INSTRUCTION_TAG) {
                    next_func_start &= ~THUMB_INSTRUCTION_TAG;
                }
#endif
                if (instruction_addr < next_func_start) {
                    // address was in the previous function
                    break;
                }
                func_start = next_func_start;
            }
        }
        result->function_address = func_start;
    } else {
        // If LC_FUNCTION_STARTS has been omitted via ld's `-no_function_starts` option, accurate in-process
        // symbolication cannot be performed.
        //
        // Finding the closest matching symbol table entry can yeild invalid results because some functions
        // may not have any symbols.
        //
        // The back-end will still be able to symbolicate if the dSYM was uploaded.
        BSG_KSLOG_INFO("No LC_FUNCTION_STARTS, skipping in-process symbolication for %s", image->name);
        return;
    }
    
    // Find the best symbol that matches function_address.
    if (result->function_address && symtab && symtab->symoff > linkedit->fileoff) {
        const nlist_t *syms = get_linkedit_data(symtab->symoff);
        const char *strings = get_linkedit_data(symtab->stroff);
        const uintptr_t symbol_address = (uintptr_t)result->function_address - slide;
        nlist_t best = {{0}};
        // Scan the whole symtab because there can be > 1 symbol with the same n_value.
        // For example CoreFoundation has matching local `__forwarding_prep_0___` and
        // external `_CF_forwarding_prep_0` symbols.
        // Report the external symbol like dladdr, atos, lldb, et al.
        for (uint32_t i = 0; i < symtab->nsyms; i++) {
            if (syms[i].n_value == symbol_address &&
                // Ignore symbolic debugging entries
                //  "Only symbolic debugging entries have some of the N_STAB bits set and if any
                //   of these bits are set then it is a symbolic debugging entry (a stab).  In
                //   which case then the values of the n_type field (the entire field) are given
                //   in <mach-o/stab.h>"
                (syms[i].n_type & N_STAB) == 0 &&
                // Sanity check string table index
                syms[i].n_un.n_strx < symtab->strsize &&
                // Ignore empty symbol names
                strings[syms[i].n_un.n_strx] &&
                // Prefer external symbols
                ((best.n_type & N_EXT) == 0 || (syms[i].n_type & N_EXT) != 0)) {
                best = syms[i];
            }
        }
        if (best.n_value) {
            const char *name = strings + best.n_un.n_strx;
            result->function_name = name[0] == '_' ? name + 1 : name;
        }
    }
}
