const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Native-only react-native internals that must be stubbed out on web.
// These bypass the react-native → react-native-web alias and cause the
// __fbBatchedBridgeConfig runtime error if bundled.
//
// Confirmed offenders (grep node_modules to reverify after upgrades):
//   react-native-gesture-handler/lib/commonjs/specs/RNGestureHandler*NativeComponent.js
//     → react-native/Libraries/Utilities/codegenNativeComponent
//   react-native-reanimated/lib/module/reanimated2/fabricUtils.js
//     → react-native/Libraries/Renderer/shims/ReactFabric
const WEB_NATIVE_STUB_MODULES = new Set([
  'react-native/Libraries/Utilities/codegenNativeComponent',
  'react-native/Libraries/Renderer/shims/ReactFabric',
]);

const _resolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && WEB_NATIVE_STUB_MODULES.has(moduleName)) {
    return { type: 'empty' };
  }
  if (_resolveRequest) {
    return _resolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
