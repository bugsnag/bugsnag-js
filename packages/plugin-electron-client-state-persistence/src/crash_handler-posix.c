#include "crash_handler.h"

#include <signal.h>
#include <stddef.h>
#include <stdlib.h>

static const int bsg_native_signals[] = {SIGILL, SIGTRAP, SIGABRT,
                                         SIGBUS, SIGFPE,  SIGSEGV};
#define SIGNAL_COUNT sizeof(bsg_native_signals) / sizeof(const int)

static void (*prev_handlers[SIGNAL_COUNT])(int);
static void (*registered_handler)(int);

static void crash_handler(int signal) {
  if (registered_handler) {
    registered_handler(signal);
  }
}

void becsp_crash_handler_install(void (*func)(int context)) {
  registered_handler = func;
  for (size_t index = 0; index < SIGNAL_COUNT; index++) {
    const int sig = bsg_native_signals[index];
    prev_handlers[index] = signal(sig, crash_handler);
  }
}

void becsp_crash_handler_uninstall(void) {
  for (size_t index = 0; index < SIGNAL_COUNT; index++) {
    const int sig = bsg_native_signals[index];
    signal(sig, prev_handlers[index]);
  }
}

void becsp_crash_handler_continue(int _sig) {
  for (size_t index = 0; index < SIGNAL_COUNT; index++) {
    const int sig = bsg_native_signals[index];
    if (sig == _sig) {
      void (*prev)(int) = prev_handlers[index];
      if (prev == SIG_DFL) {
        raise(_sig);
      } else if (prev != NULL && prev != SIG_IGN) {
        prev(_sig);
      }
    }
  }
}
