const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Native-only react-native paths that must never be bundled on web.
// Two layers of protection:
//
// 1. Prefix block — any absolute import starting with these paths is stubbed.
//    These files exist on disk so they resolve fine, but executing them on web
//    triggers the __fbBatchedBridgeConfig runtime error.
//    Confirmed offenders:
//      BatchedBridge/NativeModules.js     → __fbBatchedBridgeConfig crash
//      TurboModule/*                      → native module registry, web-incompatible
//      codegenNativeComponent             → gesture-handler specs
//      codegenNativeCommands              → gesture-handler specs
//      Renderer/shims/ReactFabric         → reanimated fabricUtils
//
// 2. Catch-all — when Metro is already traversing inside react-native/Libraries/
//    and hits a relative import that can't be resolved on web (e.g. Platform with
//    no .web.js), catch the error and return empty rather than crashing the build.
const WEB_NATIVE_STUB_PREFIXES = [
  'react-native/Libraries/BatchedBridge/',
  'react-native/Libraries/TurboModule/',
  'react-native/Libraries/Utilities/codegenNativeComponent',
  'react-native/Libraries/Utilities/codegenNativeCommands',
  'react-native/Libraries/Renderer/shims/',
];

const _resolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    if (WEB_NATIVE_STUB_PREFIXES.some(prefix => moduleName.startsWith(prefix))) {
      return { type: 'empty' };
    }

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
