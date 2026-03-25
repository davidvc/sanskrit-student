const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Native-only react-native internals that must be stubbed out on web.
// These bypass the react-native → react-native-web alias and cause
// runtime errors if bundled.
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
  if (platform === 'web') {
    // Stub confirmed native-only absolute imports.
    if (WEB_NATIVE_STUB_MODULES.has(moduleName)) {
      return { type: 'empty' };
    }

    // When Metro is already traversing inside react-native's own Libraries
    // (e.g. ViewNativeComponent.js importing Platform, which has no .web.js),
    // catch resolution failures and return empty rather than crashing the build.
    // react-native-web provides the actual web implementations of these components.
    if (
      context.originModulePath.includes('/react-native/Libraries/') &&
      !context.originModulePath.includes('/react-native-web/')
    ) {
      try {
        return (_resolveRequest || context.resolveRequest)(context, moduleName, platform);
      } catch {
        return { type: 'empty' };
      }
    }
  }
  if (_resolveRequest) {
    return _resolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
