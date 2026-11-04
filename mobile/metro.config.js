const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');
const config = getDefaultConfig(__dirname);
const profile = process.env.FAMILYHUB_BUILD_PROFILE ?? process.env.EAS_BUILD_PROFILE ?? 'development';
const nativeTest = profile === 'native-test';
config.cacheVersion = `familyhub-${profile}`;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'familyhub-entry') {
    return context.resolveRequest(context, nativeTest ? path.join(__dirname, 'tests/native/entry.ts') : 'expo-router/entry', platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};
module.exports = config;
