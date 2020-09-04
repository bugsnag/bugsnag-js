package com.bugsnag.android

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeMap

@Suppress("UNCHECKED_CAST")
internal fun Map<String, Any?>.toWritableMap(): WritableMap {
    val nativeMap = WritableNativeMap()

    entries.forEach {
        val key = it.key
        when (val obj = it.value) {
            null -> nativeMap.putNull(key)
            is Boolean -> nativeMap.putBoolean(key, obj)
            is Int -> nativeMap.putInt(key, obj)
            is Long -> nativeMap.putDouble(key, obj.toDouble())
            is Number -> nativeMap.putDouble(key, obj.toDouble())
            is String -> nativeMap.putString(key, obj)
            is Map<*, *> -> nativeMap.putMap(key, Arguments.makeNativeMap(obj as MutableMap<String, Any>))
            is Collection<*> ->  nativeMap.putArray(key, Arguments.makeNativeArray<Any>(obj.toTypedArray()))
            else -> throw IllegalArgumentException("Could not convert $obj to native map")
        }
    }
    return nativeMap
}
