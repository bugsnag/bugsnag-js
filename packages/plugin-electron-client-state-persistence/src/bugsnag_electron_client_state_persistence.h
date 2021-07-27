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
  BECSP_STATUS_SUCCESS,
  /**
   * The synchronizing layer has not yet been configured, call becsp_install()
   */
  BECSP_STATUS_NOT_INSTALLED,
  /**
   * JSON value sent as a parameter could not be parsed
   */
  BECSP_STATUS_INVALID_JSON,
  /**
   * JSON value sent as a parameter used an unexpected type
   */
  BECSP_STATUS_EXPECTED_JSON_OBJECT,
  /**
   * Required parameter was NULL
   */
  BECSP_STATUS_NULL_PARAM,
  /**
   * Something went wrong but we don't know what
   */
  BECSP_STATUS_UNKNOWN_FAILURE,
} BECSP_STATUS;

/**
 * Install a handler which will write to disk in the event of a crash
 *
 * @param save_file_path          The path to write in the event of a crash. The
 *                                enclosing directory must exist.
 * @param last_run_info_file_path The path to write the lastRunInfo to in the event of a crash.
 * @param max_crumbs              The maximum number of breadcrumbs to save
 * @param state                   Stringified JSON of the initial cached state
 */
void becsp_install(const char *save_file_path,
                  const char *last_run_info_file_path,
                  uint8_t max_crumbs,
                  const char *state);

void becsp_uninstall(void);

/**
 * Append a breadcrumb
 *
 * @param val Breadcrumb JSON value serialized to string
 */
BECSP_STATUS becsp_add_breadcrumb(const char *val);

/**
 * Set the event context
 *
 * @param val the new context value or NULL to unset
 */
BECSP_STATUS becsp_set_context(const char *context);

/**
 * Set event user
 *
 * @param val JSON-serialized user value
 */
BECSP_STATUS becsp_set_user(const char *id, const char *email, const char *name);

/**
 * Set cached metadata value for an entire tab
 *
 * @param tab Metadata tab name
 * @param val Metadata JSON key/value pairs serialized to string or NULL to
 * clear
 */
BECSP_STATUS becsp_update_metadata(const char *tab, const char *val);

/**
 * Set cached metadata
 *
 * @param tab Metadata object serialized as JSON
 * clear
 */
BECSP_STATUS becsp_set_metadata(const char *metadata);

/**
 * Set cached top-level app value
 *
 * @param value JSON value serialized to string containing key/value pairs
 */
BECSP_STATUS becsp_set_app(const char *value);

/**
 * Set cached top-level device value
 *
 * @param value JSON value serialized to string containing key/value pairs
 */
BECSP_STATUS becsp_set_device(const char *value);

/**
 * Set the current session
 *
 * @param value JSON value serialized to string or NULL to remove session info
 */
BECSP_STATUS becsp_set_session(const char *value);

/**
 * Set the value of the lastRunInfo field
 *
 * @param encoded_json the JSON encoded content of the lastRunInfo object
 */
BECSP_STATUS becsp_set_last_run_info(const char *encoded_json);

/**
 * Write cached event context to disk
 */
BECSP_STATUS becsp_persist_to_disk(void);

/**
 * Write the lastRunInfo blob to disk
 */
BECSP_STATUS bescp_persist_last_run_info_if_required(void);
#ifdef __cplusplus
}
#endif
