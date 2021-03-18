#pragma once

#ifdef __cplusplus
extern "C" {
#endif

#include <stdint.h>

/**
 * Result codes for synchronization operations
 */
typedef enum {
  /** All good */
  BECS_STATUS_SUCCESS,
  /**
   * The synchronizing layer has not yet been configured, call becs_install()
   */
  BECS_STATUS_NOT_INSTALLED,
  /**
   * JSON value sent as a parameter could not be parsed
   */
  BECS_STATUS_INVALID_JSON,
  /**
   * JSON value sent as a parameter used an unexpected type
   */
  BECS_STATUS_EXPECTED_JSON_OBJECT,
  /**
   * Required parameter was NULL
   */
  BECS_STATUS_NULL_PARAM,
  /**
   * Something went wrong but we don't know what
   */
  BECS_STATUS_UNKNOWN_FAILURE,
} BECS_STATUS;

/**
 * Install a handler which will write to disk in the event of a crash
 *
 * @param save_file_path  The path to write in the event of a crash. The
 *                        enclosing directory must exist.
 * @param max_crumbs      The maximum number of breadcrumbs to save
 * @param state           Stringified JSON of the initial cached state
 */
void becs_install(const char *save_file_path, uint8_t max_crumbs,
                  const char *state);

void becs_uninstall(void);

/**
 * Append a breadcrumb
 *
 * @param val Breadcrumb JSON value serialized to string
 */
BECS_STATUS becs_add_breadcrumb(const char *val);

/**
 * Set the event context
 *
 * @param val the new context value or NULL to unset
 */
BECS_STATUS becs_set_context(const char *context);

/**
 * Set event user
 *
 * @param val JSON-serialized user value
 */
BECS_STATUS becs_set_user(const char *id, const char *email, const char *name);

/**
 * Set cached metadata value for an entire tab
 *
 * @param tab Metadata tab name
 * @param val Metadata JSON key/value pairs serialized to string or NULL to
 * clear
 */
BECS_STATUS becs_update_metadata(const char *tab, const char *val);

/**
 * Set cached metadata
 *
 * @param tab Metadata object serialized as JSON
 * clear
 */
BECS_STATUS becs_set_metadata(const char *metadata);

/**
 * Set cached top-level app value
 *
 * @param value JSON value serialized to string containing key/value pairs
 */
BECS_STATUS becs_set_app(const char *value);

/**
 * Set cached top-level device value
 *
 * @param value JSON value serialized to string containing key/value pairs
 */
BECS_STATUS becs_set_device(const char *value);

/**
 * Set the current session
 *
 * @param value JSON value serialized to string or NULL to remove session info
 */
BECS_STATUS becs_set_session(const char *value);

/**
 * Write cached event context to disk
 */
BECS_STATUS becs_persist_to_disk(void);
#ifdef __cplusplus
}
#endif
