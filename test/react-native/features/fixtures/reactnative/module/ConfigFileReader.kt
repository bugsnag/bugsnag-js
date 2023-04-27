package com.reactnative.module

import android.content.Context

class ConfigFileReader {

    fun getMazeRunnerAddress(context: Context): String {
        val externalFilesDir = context.getExternalFilesDir(null)
        val configFile = File(externalFilesDir, "fixture_config.json")
        log("Attempting to read Maze Runner address from config file ${configFile.path}")

        // Poll for the fixture config file
        val pollEnd = System.currentTimeMillis() + CONFIG_FILE_TIMEOUT
        while (System.currentTimeMillis() < pollEnd) {
            if (configFile.exists()) {
                val fileContents = configFile.readText()
                val fixtureConfig = runCatching { JSONObject(fileContents) }.getOrNull()
                mazeAddress = getStringSafely(fixtureConfig, "maze_address")
                if (!mazeAddress.isNullOrBlank()) {
                    log("Maze Runner address set from config file: $mazeAddress")
                    break
                }
            }

            Thread.sleep(250)
        }
        if (mazeAddress.isNullOrBlank()) {
            log("Failed to read Maze Runner address from config file, reverting to legacy address")
            mazeAddress = "bs-local.com:9339"
        }
        return mazeAddress
    }

}
