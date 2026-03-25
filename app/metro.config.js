const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// On web, two packages deep-import react-native internals that bypass the
// react-native → react-native-web alias, causing the __fbBatchedBridgeConfig error:
//   react-native-gesture-handler specs → codegenNativeComponent
//   react-native-reanimated fabricUtils → Renderer/shims/ReactFabric
// Return empty modules for exactly those paths on web.
const WEB_EMPTY_MODULES = new Set([
  'react-native/Libraries/Utilities/codegenNativeComponent',
  'react-native/Libraries/Renderer/shims/ReactFabric',
]);

const _resolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && WEB_EMPTY_MODULES.has(moduleName)) {
    return { type: 'empty' };
  }
  if (_resolveRequest) {
    return _resolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
