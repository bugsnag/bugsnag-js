package com.bugsnag.reactnative

import com.bugsnag.android.Thread
import java.util.Locale

internal class ThreadSerializer : WritableMapSerializer<Thread> {
    override fun serialize(map: MutableMap<String, Any?>, thread: Thread) {
        map["id"] = thread.id
        map["name"] = thread.name
        map["type"] = thread.type.toString().toLowerCase(Locale.US)
        map["errorReportingThread"] = thread.isErrorReportingThread

        map["stacktrace"] = thread.stacktrace.map {
            val frame = mutableMapOf<String, Any?>()
            frame["method"] = it.method
            frame["lineNumber"] = it.lineNumber
            frame["file"] = it.file
            frame["inProject"] = it.inProject
            frame
        }
    }
}
