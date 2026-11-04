import { withAppBuildGradle, withMainApplication, withDangerousMod, withXcodeProject, IOSConfig, type ConfigPlugin } from 'expo/config-plugins';
import fs from 'node:fs';
import path from 'node:path';
const start = '// familyhub-test-start';
const end = '// familyhub-test-end';
const removeBlock = (value: string) => value.replace(/\n?\/\/ familyhub-test-start[\s\S]*?\/\/ familyhub-test-end\n?/g, '\n');
const withNativeTestHarness: ConfigPlugin<{ profile: string }> = (config, { profile }) => {
  const enabled = profile === 'native-test' || profile === 'upgrade-test';
  config = withMainApplication(config, mod => {
    let contents = removeBlock(mod.modResults.contents);
    if (enabled) {
      const anchor = 'PackageList(this).packages.apply {';
      if (!contents.includes(anchor)) throw new Error('Unsupported native test host template');
      contents = contents.replace(anchor, `${anchor}\n${start}\nadd(com.familyhub.tests.FamilyHubTestPackage())\n${end}\n`);
    }
    mod.modResults.contents = contents; return mod;
  });
  config = withAppBuildGradle(config, mod => {
    mod.modResults.contents = removeBlock(mod.modResults.contents);
    if (enabled) {
      if (mod.modResults.language !== 'groovy') throw new Error('Unsupported native test Gradle template');
      const instrumented = profile === 'native-test' ? `android {
  defaultConfig { testInstrumentationRunner 'androidx.test.runner.AndroidJUnitRunner' }
  sourceSets { androidTest.java.srcDir(file('../../modules/legacy-accounts/android/src/androidTest/java')) }
}
dependencies {
  androidTestImplementation 'androidx.test:runner:1.6.2'
  androidTestImplementation 'androidx.test.ext:junit:1.2.1'
}
` : '';
      mod.modResults.contents += `\n${start}\nandroid { sourceSets { main.java.srcDir(file('../../tests/native/android')) } }\n${instrumented}${end}\n`;
    }
    return mod;
  });
  config = withDangerousMod(config, ['ios', async mod => {
    const projectName = IOSConfig.XcodeUtils.getProjectName(mod.modRequest.projectRoot);
    for (const name of ['FamilyHubTestSupport.swift', 'FamilyHubTestSupport.m']) {
      const dest = path.join(mod.modRequest.platformProjectRoot, projectName, name);
      if (enabled) fs.copyFileSync(path.join(mod.modRequest.projectRoot, 'tests/native/ios', name), dest);
      else if (fs.existsSync(dest)) fs.unlinkSync(dest);
    }
    return mod;
  }]);
  return withXcodeProject(config, mod => {
    const projectName = IOSConfig.XcodeUtils.getProjectName(mod.modRequest.projectRoot);
    for (const name of ['FamilyHubTestSupport.swift', 'FamilyHubTestSupport.m']) {
      const filepath = `${projectName}/${name}`;
      if (enabled) IOSConfig.XcodeUtils.addBuildSourceFileToGroup({ filepath, groupName: projectName, project: mod.modResults });
      else mod.modResults.removeSourceFile(filepath, { target: mod.modResults.getFirstTarget().uuid });
    }
    const references = mod.modResults.pbxFileReferenceSection();
    for (const value of Object.values(references)) {
      if (value && typeof value === 'object' && 'path' in value && String(value.path).includes('FamilyHubTestSupport')) {
        for (const key of Object.keys(value)) {
          if ((value as Record<string, unknown>)[key] === undefined) delete (value as Record<string, unknown>)[key];
        }
      }
    }
    return mod;
  });
};
export default withNativeTestHarness;
