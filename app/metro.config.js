const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix for web builds: some packages (e.g., react-native-gesture-handler) use deep imports
// into react-native's native Libraries (e.g., react-native/Libraries/Utilities/codegenNativeComponent).
// These bypass the react-native → react-native-web alias and cause build failures on web.
// When we end up inside react-native's native code during a web build, return empty modules
// for any imports that can't be resolved — they're native-only and not needed on web.
const _resolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    platform === 'web' &&
    context.originModulePath.includes('/react-native/Libraries/') &&
    !context.originModulePath.includes('/react-native-web/')
  ) {
    try {
      return (_resolveRequest || context.resolveRequest)(context, moduleName, platform);
    } catch {
      return { type: 'empty' };
    }
  }
  if (_resolveRequest) {
    return _resolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
