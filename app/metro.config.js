const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix for web builds: native bridge and TurboModule paths must never be bundled on web.
// Two scenarios to handle:
//   1. Third-party packages directly import react-native/Libraries/BatchedBridge or TurboModule
//      paths — these bypass the react-native → react-native-web alias.
//   2. We're already inside react-native's native Libraries (e.g., after following a deep import
//      from gesture-handler) and encounter another unresolvable native import.
// In both cases, returning an empty module prevents the __fbBatchedBridgeConfig runtime error.
const NATIVE_ONLY_PATH_PREFIXES = [
  'react-native/Libraries/BatchedBridge/',
  'react-native/Libraries/TurboModule/',
  'react-native/Libraries/Utilities/codegenNativeComponent',
  'react-native/Libraries/Utilities/codegenNativeCommands',
];

const _resolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    // Block known native-only paths regardless of who imports them.
    if (NATIVE_ONLY_PATH_PREFIXES.some(prefix => moduleName.startsWith(prefix))) {
      return { type: 'empty' };
    }

    // When inside react-native's own Libraries directory, return empty for anything
    // that can't be resolved — it's native-only and not needed on web.
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
