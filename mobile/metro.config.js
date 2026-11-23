const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Enable support for TypeScript and JSX
config.resolver.sourceExts.push('cjs');

// Support for React Native Web
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;