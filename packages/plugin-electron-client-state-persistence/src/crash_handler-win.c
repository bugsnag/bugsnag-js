#include <windows.h>

#include "crash_handler.h"

static void (*registered_handler)(void*);
static PVOID vectored_handler_token;

// AddVectoredExceptionHandler's initial parameter is a number indicating
// whether the additional handler should be called first or last. Encoding with
// a name for clarity.
#define CALL_FIRST 1

static LONG WINAPI crash_handler(struct _EXCEPTION_POINTERS *info) {
  // vectored handlers can be called for non-crash reasons, so the exception
  // code should be checked to ensure this is a termination.
  if (FAILED(info->ExceptionRecord->ExceptionCode) && registered_handler) {
    registered_handler(NULL); // the parameter value is unused, sending a sentinel
  }

  return EXCEPTION_CONTINUE_SEARCH;
}

void becsp_crash_handler_install(void (*func)(void*)) {
  registered_handler = func;
  vectored_handler_token = AddVectoredExceptionHandler(CALL_FIRST, crash_handler);
}

void becsp_crash_handler_uninstall(void) {
  if (vectored_handler_token) {
    RemoveVectoredExceptionHandler(vectored_handler_token);
    vectored_handler_token = NULL;
  }
}

void becsp_crash_handler_continue(void *context) {
  // not needed on windows as continue handlers are called automatically
}
