// Metro config with Node core module shims required by @solana/web3.js
// and other crypto-adjacent libraries on React Native.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  buffer: require.resolve('buffer'),
  crypto: require.resolve('expo-crypto'),
  stream: require.resolve('readable-stream'),
};

// Allow importing .cjs files shipped by some web3 deps.
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs'];

// Enable package.json "exports" resolution so subpath imports like
// `@privy-io/expo/ui` resolve correctly.
config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = ['require', 'react-native', 'browser', 'default'];

module.exports = config;
