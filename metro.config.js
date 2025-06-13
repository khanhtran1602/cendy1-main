const { getDefaultConfig } = require('expo/metro-config');
const defaultConfig = getDefaultConfig(__dirname);

defaultConfig.resolver.sourceExts.push('cjs');

defaultConfig.resolver.extraNodeModules = {
  ...defaultConfig.resolver.extraNodeModules,
  crypto: require.resolve('crypto-browserify'),
  stream: require.resolve('stream-browserify'),
  url: require.resolve('url/'),
  zlib: require.resolve('browserify-zlib'),
  path: require.resolve('path-browserify'),
  util: require.resolve('util/'),
  net: require.resolve('react-native-tcp'),
  tls: require.resolve('react-native-tcp'),
  https: require.resolve('https-browserify'),
  http: require.resolve('http-browserify'),
  assert: require.resolve('assert/'),
  fs: false,
  process: require.resolve('process/browser'),
};

module.exports = defaultConfig;