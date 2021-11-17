#include "crash_handler.h"

#include <signal.h>
#include <stddef.h>
#include <stdlib.h>
#include <string.h>

static const int bsg_native_signals[] = {SIGILL, SIGTRAP, SIGABRT,
                                         SIGBUS, SIGFPE,  SIGSEGV};
#define SIGNAL_COUNT sizeof(bsg_native_signals) / sizeof(const int)

struct bsg_signal_continue_data {
  int signal;
   siginfo_t *info;
   void *user_context;
};

static struct sigaction prev_handlers[SIGNAL_COUNT];
static void (*registered_handler)(void*);

static void crash_handler(int signal, siginfo_t *info, void *user_context) {
  struct bsg_signal_continue_data scd;
  scd.signal = signal;
  scd.info = info;
  scd.user_context = user_context;
  if (registered_handler) {
    registered_handler(&scd);
  }
}

void becsp_crash_handler_install(void (*func)(void *context)) {
  registered_handler = func;

  struct sigaction sa;
  memset(&sa, 0, sizeof(sa));
  sigemptyset(&sa.sa_mask);

  for (size_t index = 0; index < SIGNAL_COUNT; index++) {
    const int sig = bsg_native_signals[index];
    // remember the previous signal handlers
    sigaction(sig, NULL, &prev_handlers[index]);
    // add every signal to the sigaction mask
    sigaddset(&sa.sa_mask, sig);
  }

  sa.sa_sigaction = crash_handler;
  sa.sa_flags = SA_SIGINFO;

  // set the new signal handler
  for (size_t index = 0; index < SIGNAL_COUNT; index++) {
      const int sig = bsg_native_signals[index];
      sigaction(sig, &sa, NULL);
  }
}

void becsp_crash_handler_uninstall(void) {
  for (size_t index = 0; index < SIGNAL_COUNT; index++) {
    const int sig = bsg_native_signals[index];
    sigaction(sig, &prev_handlers[index], NULL);
  }
}

void becsp_crash_handler_continue(void *context) {
  struct bsg_signal_continue_data *scd = context;

  for (size_t index = 0; index < SIGNAL_COUNT; index++) {
    const int sig = bsg_native_signals[index];
    if (sig == scd->signal) {
      if((prev_handlers[index].sa_flags & SA_SIGINFO) != 0) {
        void (*prev_action)(int, siginfo_t *, void *) = prev_handlers[index].sa_sigaction;

        if(prev_action != NULL) {
          prev_action(sig, scd->info, scd->user_context);
        }
      } else {
        void (*prev)(int) = prev_handlers[index].sa_handler;
        if (prev == SIG_DFL) {
          raise(sig);
        } else if (prev != NULL && prev != SIG_IGN) {
          prev(sig);
        }
      }
    }
  }
}
