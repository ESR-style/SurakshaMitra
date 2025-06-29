const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Configure for react-native-reanimated
config.resolver.alias = {
  ...config.resolver.alias,
  'react-native-reanimated/package.json': 'react-native-reanimated/package.json',
};

// Suppress specific Reanimated warnings
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    args.length > 0 &&
    typeof args[0] === 'string' &&
    (args[0].includes('[Reanimated] Reading from') || 
     args[0].includes('Reading from value during component render'))
  ) {
    // Suppress the Reanimated warning about reading shared values during render
    return;
  }
  originalWarn(...args);
};

module.exports = withNativeWind(config, { input: './global.css' });
