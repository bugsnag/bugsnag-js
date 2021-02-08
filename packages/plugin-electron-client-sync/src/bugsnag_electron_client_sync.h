#pragma once

#ifdef __cplusplus
extern "C" {
#endif

#include <stdint.h>

/**
 * Install a handler which will write to disk in the event of a crash
 *
 * @param save_file_path  The path to write in the event of a crash. The
 *                        enclosing directory must exist.
 * @param max_crumbs      The maximum number of breadcrumbs to save
 */
void becs_install(const char *save_file_path, uint8_t max_crumbs);

void becs_uninstall(void);

/**
 * Append a breadcrumb
 *
 * @param val Breadcrumb JSON value serialized to string
 */
void becs_add_breadcrumb(const char *val);

/**
 * Set the event context
 *
 * @param val the new context value or NULL to unset
 */
void becs_set_context(const char *context);

/**
 * Set event user
 *
 * @param val JSON-serialized user value
 */
void becs_set_user(const char *id, const char *email, const char *name);

/**
 * Set cached metadata value
 *
 * @param tab Metadata tab name
 * @param key Metadata key name
 * @param val Metadata JSON value serialized to string
 */
void becs_set_metadata(const char *tab, const char *key, const char *val);

/**
 * Set cached top-level app value
 *
 * @param value JSON value serialized to string containing key/value pairs
 */
void becs_set_app(const char *value);

/**
 * Set cached top-level device value
 *
 * @param value JSON value serialized to string containing key/value pairs
 */
void becs_set_device(const char *value);

/**
 * Set the current session
 *
 * @param value JSON value serialized to string or NULL to remove session info
 */
void becs_set_session(const char *value);

/**
 * Write cached event context to disk
 */
void becs_persist_to_disk(void);
#ifdef __cplusplus
}
#endif
