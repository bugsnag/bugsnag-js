package com.reactnative.scenarios

import android.content.Context
import android.util.Log
import org.json.JSONObject
import java.io.File

const val CONFIG_FILE_TIMEOUT = 5000

class ConfigFileReader {

    fun getMazeRunnerAddress(context: Context): String {
        val externalFilesDir = context.getExternalFilesDir(null)
        val candidateFiles = listOfNotNull(
            externalFilesDir?.let { File(it, "fixture_config.json") },
            File("/sdcard/Android/data/${context.packageName}/files/fixture_config.json"),
            File("/data/local/tmp/fixture_config.json")
        )
        var mazeAddress: String? = null

        // Poll for the fixture config file
        val pollEnd = System.currentTimeMillis() + CONFIG_FILE_TIMEOUT
        while (System.currentTimeMillis() < pollEnd) {
            for (configFile in candidateFiles) {
                try {
                    if (configFile.exists()) {
                        val fileContents = configFile.readText()
                        val fixtureConfig = runCatching { JSONObject(fileContents) }.getOrNull()
                        mazeAddress = getStringSafely(fixtureConfig, "maze_address")
                        if (!mazeAddress.isNullOrBlank()) {
                            Log.i("Bugsnag", "Maze Runner address set from config file (${configFile.path}): $mazeAddress")
                            return mazeAddress
                        }
                    }
                } catch (e: Exception) {
                    Log.w("Bugsnag", "Could not read config from ${configFile.path}: ${e.message}")
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