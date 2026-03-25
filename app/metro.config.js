const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Prevent native-only react-native internals from being bundled on web.
//
// Three failure modes this resolver handles:
//
//   1. Absolute import of a native-only path — e.g. a third-party package
//      writes require('react-native/Libraries/BatchedBridge/NativeModules').
//      Caught by ABSOLUTE_STUB_PREFIXES check on moduleName.
//
//   2. Relative import from within react-native/Libraries/ that resolves to
//      a native-only path — e.g. SomeFile.js inside react-native/Libraries/
//      writes require('../BatchedBridge/NativeModules').  The file exists so
//      Metro won't throw; we must check the resolved filePath.
//      Caught by the RESOLVED_NATIVE_PATHS check inside the react-native/
//      Libraries branch (scoped to that branch only — applying it globally
//      would stub TurboModuleRegistry before react-native-web can re-export
//      it, causing "e.get is not a function").
//
//   3. Relative import from within react-native/Libraries/ that has no web
//      variant — e.g. ViewNativeComponent.js → ../../Utilities/Platform
//      (no Platform.web.js exists).  Caught by the catch block in the same
//      branch.

const ABSOLUTE_STUB_PREFIXES = [
  'react-native/Libraries/BatchedBridge/',
  'react-native/Libraries/TurboModule/',
  'react-native/Libraries/Utilities/codegenNativeComponent',
  'react-native/Libraries/Utilities/codegenNativeCommands',
  'react-native/Libraries/Renderer/shims/',
];

// Only used when the *origin* is already inside react-native/Libraries/.
const RESOLVED_NATIVE_PATHS = [
  '/react-native/Libraries/BatchedBridge/',
  '/react-native/Libraries/TurboModule/',
];

const _resolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    // Case 1: block by absolute module-name prefix.
    if (ABSOLUTE_STUB_PREFIXES.some(p => moduleName.startsWith(p))) {
      return { type: 'empty' };
    }

    // Cases 2 & 3: imports originating from inside react-native's own Libraries.
    if (
      context.originModulePath.includes('/react-native/Libraries/') &&
      !context.originModulePath.includes('/react-native-web/')
    ) {
      try {
        const result = (_resolveRequest || context.resolveRequest)(context, moduleName, platform);
        // Case 2: resolved path lands in a native-only directory.
        if (
          result.type === 'sourceFile' &&
          result.filePath &&
          RESOLVED_NATIVE_PATHS.some(p => result.filePath.includes(p))
        ) {
          return { type: 'empty' };
        }
        return result;
      } catch {
        // Case 3: no web variant exists (e.g. Platform with no .web.js).
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
