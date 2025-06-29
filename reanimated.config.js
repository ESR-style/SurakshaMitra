// React Native Reanimated configuration
module.exports = {
  // Set strict to false to reduce warnings about reading shared values during render
  strict: false,
  // Enable automatic worklet conversion for better performance
  workletAutoConvert: true,
  // Process nested worklets for complex animations
  processNestedWorklets: true,
  // Configure globals for worklet execution
  globals: ['__DEV__'],
  // Exclude specific files from worklet processing if needed
  exclude: [],
};
