package com.bugsnag.reactnative

import com.bugsnag.android.AppWithState

internal class AppSerializer : WritableMapSerializer<AppWithState> {
    override fun serialize(map: MutableMap<String, Any?>, app: AppWithState) {
        map["duration"] = app.duration
        map["durationInForeground"] = app.durationInForeground
        map["inForeground"] = app.inForeground
        map["binaryArch"] = app.binaryArch
        map["buildUuid"] = app.buildUuid
        map["codeBundleId"] = app.codeBundleId
        map["id"] = app.id
        map["releaseStage"] = app.releaseStage
        map["appType"] = app.type
        map["version"] = app.version
        map["versionCode"] = app.versionCode
    }
}
