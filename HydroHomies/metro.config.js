/* eslint-env node */
// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config")

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname)

config.transformer.getTransformOptions = async () => ({
  transform: {
    // Inline requires are very useful for deferring loading of large dependencies/components.
    // For example, we use it in app.tsx to conditionally load Reactotron.
    // However, this comes with some gotchas.
    // Read more here: https://reactnative.dev/docs/optimizing-javascript-loading
    // And here: https://github.com/expo/expo/issues/27279#issuecomment-1971610698
    inlineRequires: true,
  },
})

// This is a temporary fix that helps fixing an issue with axios/apisauce.
// See the following issues in Github for more details:
// https://github.com/infinitered/apisauce/issues/331
// https://github.com/axios/axios/issues/6899
// The solution was taken from the following issue:
// https://github.com/facebook/metro/issues/1272
config.resolver.unstable_conditionNames = ["require", "default", "browser"]

// This helps support certain popular third-party libraries
// such as Firebase that use the extension cjs.
config.resolver.sourceExts.push("cjs")

// Configure path aliases for TypeScript paths
// This enables @assets/* and @/* aliases to work with require()
config.resolver.alias = {
  "@": require("path").resolve(__dirname, "app"),
  "@assets": require("path").resolve(__dirname, "assets"),
}

// JSON files should be in sourceExts to allow require() statements
// But we also want them available as assets for expo-asset
// Note: JSON files are already in sourceExts by default in Expo Metro config
// We don't need to add them to assetExts - expo-asset will handle them via require()

// Add .bin files to assetExts so Metro can handle them as assets
// Note: Metro can't require() .bin files directly, but they can be loaded via Asset.fromModule()
// after being referenced in the assetBundlePatterns in app.json
config.resolver.assetExts.push("bin")

module.exports = config
