#include "signal_handler.h"
#include <signal.h>
#include <stdlib.h>

#if defined(_WIN32) || defined(__WIN32__) || defined(__WINDOWS__)
#define IS_WINDOWS
#endif

#if defined(IS_WINDOWS)
// https://docs.microsoft.com/en-us/cpp/c-runtime-library/reference/signal
static const int bsg_native_signals[] = {SIGILL, SIGABRT, SIGFPE, SIGSEGV};
#define SIGNAL_COUNT 4
#else
static const int bsg_native_signals[] = {SIGILL, SIGTRAP, SIGABRT,
                                         SIGBUS, SIGFPE,  SIGSEGV};
#define SIGNAL_COUNT 6
#endif

static void (*prev_handlers[SIGNAL_COUNT])(int);

void becs_signal_install(void (*func)(int)) {
  for (int i = 0; i < SIGNAL_COUNT; i++) {
    const int sig = bsg_native_signals[i];
    prev_handlers[i] = signal(sig, func);
  }
}

void becs_signal_uninstall() {
  for (int i = 0; i < SIGNAL_COUNT; i++) {
    const int sig = bsg_native_signals[i];
    signal(sig, prev_handlers[i]);
  }
}

void becs_signal_raise(int _sig) {
  for (int i = 0; i < SIGNAL_COUNT; i++) {
    const int sig = bsg_native_signals[i];
    if (sig == _sig) {
      void (*prev)(int) = prev_handlers[i];
      if (prev == SIG_DFL) {
        raise(_sig);
      } else if (prev != NULL && prev != SIG_IGN) {
        prev(_sig);
      }
    }
  }
}
