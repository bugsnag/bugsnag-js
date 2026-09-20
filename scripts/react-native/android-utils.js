const { execFileSync } = require('child_process')
const fs = require('fs')

module.exports = {
  configureAndroidProject: function configureAndroidProject (fixtureDir, newArchEnabled) {
    const androidManifestPath = `${fixtureDir}/android/app/src/main/AndroidManifest.xml`
    let androidManifestContents = fs.readFileSync(androidManifestPath, 'utf8')

    // 1. Ensure usesCleartextTraffic="true" and requestLegacyExternalStorage="true"
    // eslint-disable-next-line no-template-curly-in-string
    if (androidManifestContents.includes('${usesCleartextTraffic}')) {
      // eslint-disable-next-line no-template-curly-in-string
      androidManifestContents = androidManifestContents.replace('${usesCleartextTraffic}', 'true')
    } else if (androidManifestContents.includes('android:usesCleartextTraffic="false"')) {
      androidManifestContents = androidManifestContents.replace('android:usesCleartextTraffic="false"', 'android:usesCleartextTraffic="true"')
    } else if (!androidManifestContents.includes('android:usesCleartextTraffic')) {
      androidManifestContents = androidManifestContents.replace('<application', '<application android:usesCleartextTraffic="true"')
    }

    if (!androidManifestContents.includes('android:requestLegacyExternalStorage')) {
      androidManifestContents = androidManifestContents.replace('<application', '<application android:requestLegacyExternalStorage="true"')
    }

    // 2. Ensure all required network and storage permissions exist
    const permissionsToAdd = [
      'android.permission.INTERNET',
      'android.permission.ACCESS_NETWORK_STATE',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE'
    ]

    const missingPermissions = permissionsToAdd
      .filter(perm => !androidManifestContents.includes(perm))
      .map(perm => `    <uses-permission android:name="${perm}" />`)
      .join('\n')

    if (missingPermissions) {
      androidManifestContents = androidManifestContents.replace(
        '<application',
        `${missingPermissions}\n    <application`
      )
    }

    fs.writeFileSync(androidManifestPath, androidManifestContents)

    // 3. Enable or disable the new architecture in gradle.properties
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
    if (fs.existsSync(mainActivityPath)) {
      let mainActivityContents = fs.readFileSync(mainActivityPath, 'utf8')
      if (!mainActivityContents.includes('super.onCreate(null)')) {
        mainActivityContents = mainActivityContents.replace(mainActivityPattern, mainActivityReplacement)
        fs.writeFileSync(mainActivityPath, mainActivityContents)
      }
    }
  },

  buildAPK: function buildAPK (fixtureDir, newArchEnabled) {
    if (newArchEnabled) {
      execFileSync('./gradlew', ['generateCodegenArtifactsFromSchema'], { cwd: `${fixtureDir}/android`, stdio: 'inherit' })
    }

    execFileSync('./gradlew', ['assembleRelease'], { cwd: `${fixtureDir}/android`, stdio: 'inherit' })
    fs.copyFileSync(`${fixtureDir}/android/app/build/outputs/apk/release/app-release.apk`, `${fixtureDir}/reactnative.apk`)
  }
}