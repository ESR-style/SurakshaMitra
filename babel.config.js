module.exports = function (api) {
  api.cache(true);
  let plugins = [
    'react-native-reanimated/plugin' // Must be last
  ];

  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    plugins,
  };
};
