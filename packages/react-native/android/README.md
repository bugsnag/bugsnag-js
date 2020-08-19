# Development

Local changes can be smoke-tested with the following command (the last task requires an emulator):

```
./gradlew build lint checkstyle connectedCheck
```

Functional changes can be tested by installing the packed npm artefact as described in this package's root directory.
