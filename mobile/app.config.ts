import type { ConfigContext, ExpoConfig } from 'expo/config';

const profiles = ['development', 'native-test', 'preview', 'upgrade-test'] as const;
export type BuildProfile = typeof profiles[number];

export default ({ config }: ConfigContext): ExpoConfig => {
  const selected = process.env.FAMILYHUB_BUILD_PROFILE ?? process.env.EAS_BUILD_PROFILE ?? 'development';
  if (!profiles.includes(selected as BuildProfile)) {
    throw new Error('Unknown Family Hub build profile');
  }
  const profile = selected as BuildProfile;
  const suffix = profile === 'development' ? '.dev' : profile === 'native-test' ? '.nativetest' : '';
  return {
    ...config,
    name: 'Family Hub',
    slug: 'family-hub',
    version: '0.2.0',
    scheme: `familyhub${suffix.replaceAll('.', '-')}`,
    platforms: ['android', 'ios'],
    android: { package: `com.familyhub.app${suffix}`, versionCode: 2, allowBackup: false },
    ios: { bundleIdentifier: `com.familyhub.app${suffix}`, buildNumber: '2' },
    plugins: [
      'expo-router',
      './plugins/withAccountBackupRules',
      ['./plugins/withNativeTestHarness', { profile }],
      ['expo-sqlite', { useSQLCipher: true, enableFTS: false }],
      ['expo-secure-store', { configureAndroidBackup: false }],
      ['expo-build-properties', {
        android: { minSdkVersion: 24, compileSdkVersion: 37, targetSdkVersion: 36 },
        ios: { deploymentTarget: '16.4' },
      }],
    ],
    extra: { buildProfile: profile },
  };
};
