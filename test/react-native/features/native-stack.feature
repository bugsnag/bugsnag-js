Feature: Native stacktrace is parsed for promise rejections

# Skipped on New Arch below 0.74 - see PLAT-12193
@android_only @skip_new_arch_below_074
Scenario: Handled native promise rejection with native stacktrace
  When I run "NativePromiseRejectionHandledScenario"
  Then I wait to receive an error
  And the event "unhandled" is false
  And the error payload field "events.0.exceptions" is an array with 1 elements

  # On 0.75+ the Error name is set to the native exception class
  And the event "exceptions.0.errorClass" equals the version-dependent string:
    | arch | version | value                      |
    | new  | 0.72    | Error                      |
    | new  | 0.74    | Error                      |
    | new  | default | java.lang.RuntimeException |
    | old  | 0.68    | Error                      |
    | old  | 0.69    | Error                      |
    | old  | 0.72    | Error                      |
    | old  | 0.74    | Error                      |
    | old  | default | java.lang.RuntimeException |

  And the event "exceptions.0.message" equals "NativePromiseRejectionHandledScenario"
  And the event "exceptions.0.type" equals "reactnativejs"
  And the error payload field "events.0.exceptions.0.stacktrace" is a non-empty array

  # the native part of the stack comes first
  And the error payload field "events.0.exceptions.0.stacktrace.0.type" equals "android"
  And the error payload field "events.0.exceptions.0.stacktrace.0.file" equals one of:
    | Scenario.kt |
    | SourceFile  |
  And the error payload field "events.0.exceptions.0.stacktrace.0.method" equals one of:
    | com.reactnative.scenarios.Scenario.generateException |
    | generateException |
  And the error payload field "events.0.exceptions.0.stacktrace.1.method" equals one of:
    | com.reactnative.scenarios.NativePromiseRejectionHandledScenario.run |
    | run |
  And the error payload field "events.0.exceptions.0.stacktrace.2.method" equals one of:
    | com.reactnative.module.BugsnagModule.runScenario |
    | com.reactnative.scenarios.BugsnagTestInterfaceImpl.runScenario |
    | runScenario |

  # the javascript part follows
  # On 0.74+ New Arch there is no JS stacktrace - see PLAT-12193
  And the stacktrace contains "file" equal to the version-dependent string:
  | arch | version | value                   |
  | new  | default | @skip                   |
  | old  | default | index.android.bundle    |

# Skipped on New Arch below 0.74 - see PLAT-12193
@android_only @skip_new_arch_below_074
Scenario: Unhandled native promise rejection with native stacktrace
  When I run "NativePromiseRejectionUnhandledScenario"
  Then I wait to receive an error
  And the event "unhandled" is true

  # On 0.75+ the Error name is set to the native exception class
  And the event "exceptions.0.errorClass" equals the version-dependent string:
    | arch | version | value                      |
    | new  | 0.72    | Error                      |
    | new  | 0.74    | Error                      |
    | new  | default | java.lang.RuntimeException |
    | old  | 0.68    | Error                      |
    | old  | 0.69    | Error                      |
    | old  | 0.72    | Error                      |
    | old  | 0.74    | Error                      |
    | old  | default | java.lang.RuntimeException |

  And the event "exceptions.0.message" equals "NativePromiseRejectionUnhandledScenario"
  And the event "exceptions.0.type" equals "reactnativejs"
  And the error payload field "events.0.exceptions.0.stacktrace" is a non-empty array

  # the native part of the stack comes first
  And the error payload field "events.0.exceptions.0.stacktrace.0.type" equals "android"
  And the error payload field "events.0.exceptions.0.stacktrace.0.file" equals one of:
    | Scenario.kt |
    | SourceFile  |
  And the error payload field "events.0.exceptions.0.stacktrace.1.file" equals one of:
    | NativePromiseRejectionUnhandledScenario.kt |
    | SourceFile |
  And the error payload field "events.0.exceptions.0.stacktrace.2.file" equals one of:
    | BugsnagModule.java |
    | BugsnagTestInterfaceImpl.java |
    | SourceFile |
  And the error payload field "events.0.exceptions.0.stacktrace.0.method" equals one of:
    | com.reactnative.scenarios.Scenario.generateException |
    | generateException |
  And the error payload field "events.0.exceptions.0.stacktrace.1.method" equals one of:
    | com.reactnative.scenarios.NativePromiseRejectionUnhandledScenario.run |
    | run |
  And the error payload field "events.0.exceptions.0.stacktrace.2.method" equals one of:
    | com.reactnative.module.BugsnagModule.runScenario |
    | com.reactnative.scenarios.BugsnagTestInterfaceImpl.runScenario |
    | runScenario |

  # the javascript part follows
  # On 0.74+ New Arch there is no JS stacktrace - see PLAT-12193
  And the stacktrace contains "file" equal to the version-dependent string:
  | arch | version | value                   |
  | new  | default | @skip                   |
  | old  | default | index.android.bundle    |

#   # PLAT-5117 addresses float serialization
#   And the error payload field "events.0.exceptions.1.stacktrace.0.lineNumber" equals 1
#   And the error payload field "events.0.exceptions.1.stacktrace.1.lineNumber" equals 1
#   And the error payload field "events.0.exceptions.1.stacktrace.2.lineNumber" equals 2

# Skipped on New Arch below 0.74 - see PLAT-12193
@ios_only @skip_new_arch_below_074
Scenario: Handled native promise rejection with native stacktrace
  When I run "NativePromiseRejectionHandledScenario"
  Then I wait to receive an error
  And the event "unhandled" is false
  And the error payload field "events.0.exceptions" is an array with 1 elements
  And the event "exceptions.0.errorClass" equals "Error"
  And the event "exceptions.0.message" equals "NativePromiseRejectionHandledScenario"
  And the event "exceptions.0.type" equals "reactnativejs"
  And the error payload field "events.0.exceptions.0.stacktrace" is a non-empty array

  # the native part of the stack comes first
  And the error payload field "events.0.exceptions.0.stacktrace.0.frameAddress" is not null
  And the error payload field "events.0.exceptions.0.stacktrace.0.machoFile" equals "reactnative"
  And the error payload field "events.0.exceptions.0.stacktrace.0.machoLoadAddress" is not null
  And the error payload field "events.0.exceptions.0.stacktrace.0.machoUUID" is not null
  And the error payload field "events.0.exceptions.0.stacktrace.0.machoVMAddress" is not null
  And the error payload field "events.0.exceptions.0.stacktrace.0.method" is not null
  And the error payload field "events.0.exceptions.0.stacktrace.0.symbolAddress" is not null
  And the error payload field "events.0.exceptions.0.stacktrace.0.type" equals "cocoa"

  # the javascript part follows
  # On 0.74+ New Arch there is no JS stacktrace - see PLAT-12193
  And the event "exceptions.0.stacktrace.20.columnNumber" equals the version-dependent string:
  | arch | version | value                   |
  | new  | 0.72    | @not_null               |
  | new  | default | @skip                   |
  | old  | default | @not_null               |
  And the event "exceptions.0.stacktrace.20.file" equals the version-dependent string:
  | arch | version | value                   |
  | new  | 0.72    | @not_null               |
  | new  | default | @skip                   |
  | old  | default | @not_null               |
  And the event "exceptions.0.stacktrace.20.lineNumber" equals the version-dependent string:
  | arch | version | value                   |
  | new  | 0.72    | @not_null               |
  | new  | default | @skip                   |
  | old  | default | @not_null               |
  And the event "exceptions.0.stacktrace.20.type" equals the version-dependent string:
  | arch | version | value                   |
  | new  | 0.72    | @null                   |
  | new  | default | @skip                   |
  | old  | default | @null                   |

# Skipped on New Arch below 0.74 - see PLAT-12193
@ios_only @skip_new_arch_below_074
Scenario: Unhandled native promise rejection with native stacktrace
  When I run "NativePromiseRejectionUnhandledScenario"
  Then I wait to receive an error
  And the event "unhandled" is true
  And the event "exceptions.0.errorClass" equals "Error"
  And the event "exceptions.0.message" equals "NativePromiseRejectionUnhandledScenario"
  And the event "exceptions.0.type" equals "reactnativejs"
  And the error payload field "events.0.exceptions.0.stacktrace" is a non-empty array

  # the native part of the stack comes first
  And the error payload field "events.0.exceptions.0.stacktrace.0.frameAddress" is not null
  And the error payload field "events.0.exceptions.0.stacktrace.0.machoFile" equals "reactnative"
  And the error payload field "events.0.exceptions.0.stacktrace.0.machoLoadAddress" is not null
  And the error payload field "events.0.exceptions.0.stacktrace.0.machoUUID" is not null
  And the error payload field "events.0.exceptions.0.stacktrace.0.machoVMAddress" is not null
  And the error payload field "events.0.exceptions.0.stacktrace.0.method" is not null
  And the error payload field "events.0.exceptions.0.stacktrace.0.symbolAddress" is not null
  And the error payload field "events.0.exceptions.0.stacktrace.0.type" equals "cocoa"

  # the javascript part follows
  # On 0.74+ New Arch there is no JS stacktrace - see PLAT-12193
  And the event "exceptions.0.stacktrace.20.columnNumber" equals the version-dependent string:
  | arch | version | value                   |
  | new  | 0.72    | @not_null               |
  | new  | default | @skip                   |
  | old  | default | @not_null               |
  And the event "exceptions.0.stacktrace.20.file" equals the version-dependent string:
  | arch | version | value                   |
  | new  | 0.72    | @not_null               |
  | new  | default | @skip                   |
  | old  | default | @not_null               |
  And the event "exceptions.0.stacktrace.20.lineNumber" equals the version-dependent string:
  | arch | version | value                   |
  | new  | 0.72    | @not_null               |
  | new  | default | @skip                   |
  | old  | default | @not_null               |
  And the event "exceptions.0.stacktrace.20.type" equals the version-dependent string:
  | arch | version | value                   |
  | new  | 0.72    | @null                   |
  | new  | default | @skip                   |
  | old  | default | @null                   |
