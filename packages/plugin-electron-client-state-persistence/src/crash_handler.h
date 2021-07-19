#pragma once

/**
 * Register a function which will be called in the event of a crash
 *
 * @param func the crashing function - assume only crash-safe routines can be
 *             called from here. The context parameter value is necessary to
 *             invoke bescp_crash_handler_continue().
 */
void becsp_crash_handler_install(void (*func)(int context));

/**
 * Remove any registered crash handlers, restoring the system to its previous
 * state if needed.
 */
void becsp_crash_handler_uninstall(void);

/**
 * Resume any crash handling routines, allowing the system to terminate if
 * needed.
 *
 * @param context The value passed to the registered crash function
 */
void becsp_crash_handler_continue(int context);
