#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <windows.h>
#include <winver.h>

typedef struct {
  WORD language;
  WORD code_page;
} translation_info;

const char *bugsnag_plugin_app_get_package_version() {
  char *version = NULL;
  char module_file_path[MAX_PATH];
  module_file_path[0] = '\0';
  // retrieve the file path of the current process
  // > Parameters
  // >   If [the first] parameter is NULL, GetModuleFileName retrieves the path
  // >   of the executable file of the current process.
  //
  // > Return value
  // >   If the function fails, the return value is 0 (zero). To get extended
  // >   error information, call GetLastError.
  // https://docs.microsoft.com/en-us/windows/win32/api/libloaderapi/nf-libloaderapi-getmodulefilenamea
  if (GetModuleFileName(NULL, module_file_path, sizeof(module_file_path)) ==
      0) {
    return NULL;
  };
  // retrieve the size of the version information buffer
  DWORD handle;
  DWORD size = GetFileVersionInfoSize(module_file_path, &handle);
  if (size == 0) {
    return NULL;
  }
  // allocate a buffer to store the version information
  BYTE *buffer = calloc(size, sizeof(BYTE));
  if (!buffer) {
    return NULL;
  }
  // copy version information into the buffer
  if (!GetFileVersionInfo(module_file_path, handle, size, (void *)buffer)) {
    free(buffer);
    return NULL;
  }

  // different versions can be specified for the various translations of the app
  // (??), though we are going to grab the first one to give us a version
  // number.
  translation_info *translations;
  UINT translations_size; // total memory occupied by translation information

  // yes, this is how you read from the buffer
  // https://docs.microsoft.com/en-us/windows/win32/api/winver/nf-winver-verqueryvaluea
  if (!VerQueryValue(buffer, "\\VarFileInfo\\Translation", &translations,
                     &translations_size)) {
    free(buffer);
    return NULL;
  }

  // loop over each translation's metadata, grabbing the first one to return a
  // version number
  for (UINT index = 0; index < (translations_size / sizeof(translation_info));
       index++) {
    char region[256];
    sprintf_s(region, sizeof(region),
              "\\StringFileInfo\\%04x%04x\\ProductVersion",
              translations[index].language, translations[index].code_page);
    char *local_version = NULL;
    UINT version_length;
    if (VerQueryValue(buffer, region, (LPVOID *)&local_version,
                      &version_length)) {
      // success! copy the value to the return variable since it is scoped to
      // the lifetime of `buffer`
      version = strdup(local_version);
      break;
    }
  }

  free(buffer);
  return version;
}

const char *bugsnag_plugin_app_get_bundle_version() { return NULL; }
