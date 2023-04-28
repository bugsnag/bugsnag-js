package com.reactnative.module

import android.content.Context
import org.json.JSONObject
import java.io.File
import java.io.IOException

const val CONFIG_FILE_TIMEOUT = 5000

class ConfigFileReader {

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

    private fun getStringSafely(jsonObject: JSONObject?, key: String): String {
        return jsonObject?.optString(key) ?: ""
    }

}
