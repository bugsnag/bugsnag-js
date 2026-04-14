const { execFileSync } = require('child_process')
const fs = require('fs')

module.exports = {
  configureAndroidProject: function configureAndroidProject (fixtureDir, newArchEnabled) {
    // set android:usesCleartextTraffic="true" in AndroidManifest.xml
    const androidManifestPath = `${fixtureDir}/android/app/src/main/AndroidManifest.xml`
    let androidManifestContents = fs.readFileSync(androidManifestPath, 'utf8')

    // RN 0.82+ uses a manifest placeholder that's autoconfigured by the RN gradle plugin
    // eslint-disable-next-line no-template-curly-in-string
    if (androidManifestContents.includes('${usesCleartextTraffic}')) {
      // eslint-disable-next-line no-template-curly-in-string
      androidManifestContents = androidManifestContents.replace('${usesCleartextTraffic}', 'true')
    } else {
      androidManifestContents = androidManifestContents.replace('<application', '<application android:usesCleartextTraffic="true"')
    }

    fs.writeFileSync(androidManifestPath, androidManifestContents)

    // enable/disable the new architecture in gradle.properties
    const gradlePropertiesPath = `${fixtureDir}/android/gradle.properties`
    let gradlePropertiesContents = fs.readFileSync(gradlePropertiesPath, 'utf8')
    gradlePropertiesContents = gradlePropertiesContents.replace(/newArchEnabled\s*=\s*(true|false)/, `newArchEnabled=${newArchEnabled}`)
    fs.writeFileSync(gradlePropertiesPath, gradlePropertiesContents)
  },
  configureReactNavigationAndroid: function configureReactNavigationAndroid (fixtureDir, reactNativeVersion) {
    const fileExtension = parseFloat(reactNativeVersion) < 0.73 ? 'java' : 'kt'
    let mainActivityPattern, mainActivityReplacement
    if (fileExtension === 'java') {
      mainActivityPattern = 'public class MainActivity extends ReactActivity {'
      mainActivityReplacement = `
  import android.os.Bundle;
  
  public class MainActivity extends ReactActivity {
  
    /**
     * Required for react-navigation/native implementation
     * https://reactnavigation.org/docs/getting-started/#installing-dependencies-into-a-bare-react-native-project
     */
    @Override
    protected void onCreate(Bundle savedInstanceState) {
      super.onCreate(null);
    }
  `
    } else if (fileExtension === 'kt') {
      mainActivityPattern = 'class MainActivity : ReactActivity() {'
      mainActivityReplacement = `
  import android.os.Bundle
  
  class MainActivity : ReactActivity() {
  
    /**
     * Required for react-navigation/native implementation
     * https://reactnavigation.org/docs/getting-started/#installing-dependencies-into-a-bare-react-native-project
     */
    override fun onCreate(savedInstanceState: Bundle?) {
      super.onCreate(null)
    }
  `
    }

    const mainActivityPath = `${fixtureDir}/android/app/src/main/java/com/reactnative/MainActivity.${fileExtension}`
    let mainActivityContents = fs.readFileSync(mainActivityPath, 'utf8')
    mainActivityContents = mainActivityContents.replace(mainActivityPattern, mainActivityReplacement)
    fs.writeFileSync(mainActivityPath, mainActivityContents)
  },
  buildAPK: function buildAPK (fixtureDir, newArchEnabled) {
    // Update Kotlin version to 1.9.22 to be compatible with bugsnag-android-core 6.25.0
    // (compiled with Kotlin metadata version 1.9.0) and align JVM targets to 11 across
    // all subprojects to prevent compilation mismatches (PLAT-15027)
    const rootBuildGradlePath = `${fixtureDir}/android/build.gradle`
    let rootBuildGradle = fs.readFileSync(rootBuildGradlePath, 'utf8')

    // Determine if this is a newer RN version (0.84+) that uses Kotlin 2.x + AGP 9
    // which handles JVM target alignment automatically
    const rnVersion = parseFloat(process.env.RN_VERSION || '0')
    const isKotlin2 = rnVersion >= 0.84

    // Remove any existing subprojects block with afterEvaluate or pluginManager
    rootBuildGradle = rootBuildGradle.replace(
      /\nsubprojects\s*\{[\s\S]*?(afterEvaluate|pluginManager)[\s\S]*?\n\}\s*$/,
      ''
    )

    if (!isKotlin2) {
      // For RN <=0.83 (Kotlin 1.x): Update Kotlin version to 1.9.22 and add JVM target alignment

      // Update RNNKotlinVersion if present (react-native-navigation fixtures)
      rootBuildGradle = rootBuildGradle.replace(
        /RNNKotlinVersion\s*=\s*"[^"]+"/,
        'RNNKotlinVersion = "1.9.22"'
      )

      // Update any direct kotlin-gradle-plugin version references in buildscript
      rootBuildGradle = rootBuildGradle.replace(
        /classpath\s*\(?["']org\.jetbrains\.kotlin:kotlin-gradle-plugin:[^"']+["']\)?/,
        'classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:1.9.22")'
      )

      // Add subprojects block for JVM target alignment (Gradle <9 compatible)
      // Use afterEvaluate to ensure sourceCompatibility is set before reading it,
      // since pluginManager.withPlugin fires at plugin-apply time (before the android block)
      rootBuildGradle += `
subprojects {
    pluginManager.withPlugin('org.jetbrains.kotlin.android') {
        afterEvaluate {
            def javaVersion = android.compileOptions.sourceCompatibility.toString()
            tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).configureEach {
                kotlinOptions {
                    jvmTarget = javaVersion
                }
            }
        }
    }
}
`
    }
    // For RN 0.84+ (Kotlin 2.x + AGP 9): No subprojects block needed.
    // Kotlin 2.x automatically aligns JVM targets with the Android plugin.
    // However, third-party libraries that apply kotlin-android plugin directly
    // will fail with "sourceCompatibility is not yet finalized". Patch them
    // to wrap the kotlin plugin in a try/catch and use compileSdkVersion method.
    if (isKotlin2) {
      const nodeModulesDir = `${fixtureDir}/node_modules`
      if (fs.existsSync(nodeModulesDir)) {
        const patchLibraryBuildGradle = (buildGradlePath) => {
          if (!fs.existsSync(buildGradlePath)) return
          let content = fs.readFileSync(buildGradlePath, 'utf8')

          // Remove buildscript block — AGP 9 uses plugins from the root project
          // and library buildscript blocks with old AGP versions cause conflicts
          content = content.replace(
            /buildscript\s*\{[\s\S]*?\n\}\s*\n/,
            ''
          )

          // Wrap kotlin-android plugin application in try/catch (handles both
          // single and double quotes, and both 'kotlin-android' and full plugin id)
          content = content.replace(
            /apply plugin:\s*["'](?:org\.jetbrains\.kotlin\.android|kotlin-android)["']/g,
            "try { apply plugin: 'org.jetbrains.kotlin.android' } catch (e) { /* Kotlin 2.x + AGP 9 compatibility */ }"
          )

          // Update Java compatibility to VERSION_17 for Kotlin 2.x
          content = content.replace(
            /JavaVersion\.VERSION_1_8/g,
            'JavaVersion.VERSION_17'
          )

          fs.writeFileSync(buildGradlePath, content)
          console.log(`Patched library build.gradle: ${buildGradlePath}`)
        }

        // Patch known third-party libraries that apply kotlin-android plugin directly
        const libsToPatch = ['react-native-file-access', 'react-native-safe-area-context']
        libsToPatch.forEach(lib => {
          patchLibraryBuildGradle(`${nodeModulesDir}/${lib}/android/build.gradle`)
        })
      }
    }

    fs.writeFileSync(rootBuildGradlePath, rootBuildGradle)

    if (newArchEnabled) {
      execFileSync('./gradlew', ['generateCodegenArtifactsFromSchema'], { cwd: `${fixtureDir}/android`, stdio: 'inherit' })
    }

    execFileSync('./gradlew', ['assembleRelease'], { cwd: `${fixtureDir}/android`, stdio: 'inherit' })
    fs.copyFileSync(`${fixtureDir}/android/app/build/outputs/apk/release/app-release.apk`, `${fixtureDir}/reactnative.apk`)
  }
}
