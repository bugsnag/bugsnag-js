package com.rn0_62

import android.content.Context
import android.content.pm.PackageManager
import android.util.Log
import org.json.JSONObject
import java.io.File
import java.io.IOException

const val CONFIG_FILE_TIMEOUT = 15000
const val BUGSNAG_NS = "com.bugsnag.android"
const val API_KEY = "$BUGSNAG_NS.API_KEY"
const val ENDPOINT_NOTIFY = "$BUGSNAG_NS.ENDPOINT_NOTIFY"
const val ENDPOINT_SESSIONS = "$BUGSNAG_NS.ENDPOINT_SESSIONS"

class TestUtils {

    fun getMazeRunnerAddress(context: Context): String {
        val externalFilesDir = context.getExternalFilesDir(null)
        val configFile = File(externalFilesDir, "fixture_config.json")
        var mazeAddress: String? = null
        Log.i("Bugsnag", "Attempting to read Maze Runner address from config file ${configFile.path}")

        // Poll for the fixture config file
        val pollEnd = System.currentTimeMillis() + CONFIG_FILE_TIMEOUT
        while (System.currentTimeMillis() < pollEnd) {
            if (configFile.exists()) {
                val fileContents = configFile.readText()
                val fixtureConfig = runCatching { JSONObject(fileContents) }.getOrNull()
                mazeAddress = getStringSafely(fixtureConfig, "maze_address")
                if (!mazeAddress.isNullOrBlank()) {
                    Log.i("Bugsnag", "Maze Runner address set from config file: $mazeAddress")
                    break
                }
            }

            Thread.sleep(250)
        }
        if (mazeAddress.isNullOrBlank()) {
            Log.i("Bugsnag", "Failed to read Maze Runner address from config file, reverting to legacy address")
            mazeAddress = "bs-local.com:9339"
        }
        return mazeAddress
    }

    fun loadDefaultParams(ctx: Context): Map<String, String?> {
        try {
            val packageManager = ctx.packageManager
            val packageName = ctx.packageName
            val ai = packageManager.getApplicationInfo(packageName, PackageManager.GET_META_DATA)
            val data = ai.metaData
            if (data != null) {
                val default_metadata = hashMapOf(
                    "apiKey" to data.getString(API_KEY),
                    "notify" to data.getString(ENDPOINT_NOTIFY),
                    "sessions" to data.getString(ENDPOINT_SESSIONS)
                )
                return default_metadata
            }
        } catch (exc: Exception) {
            throw IllegalStateException("Bugsnag is unable to read config from manifest.", exc)
        }
        return emptyMap()
    }

    private fun getStringSafely(jsonObject: JSONObject?, key: String): String {
        return jsonObject?.optString(key) ?: ""
    }

}
