const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Native-only react-native paths that must never be bundled on web.
//
// The __fbBatchedBridgeConfig runtime error fires when BatchedBridge/NativeModules.js
// or TurboModule code executes in the browser.  There are two ways these files
// can be pulled in on web:
//
//   A) Absolute import — e.g. some package directly writes:
//        require('react-native/Libraries/BatchedBridge/NativeModules')
//      → caught by the prefix check on moduleName.
//
//   B) Relative import from within react-native/Libraries/ — e.g. a file that is
//      already inside react-native/Libraries/ writes:
//        require('../BatchedBridge/NativeModules')
//      → moduleName is '../BatchedBridge/NativeModules', prefix check misses it,
//        file IS resolvable so try/catch doesn't help either.
//      → caught by checking the resolved filePath after resolution.
//
// The three-layer resolver below handles all cases.

// Layer 1: absolute module-name prefixes to stub immediately.
const ABSOLUTE_STUB_PREFIXES = [
  'react-native/Libraries/BatchedBridge/',
  'react-native/Libraries/TurboModule/',
  'react-native/Libraries/Utilities/codegenNativeComponent',
  'react-native/Libraries/Utilities/codegenNativeCommands',
  'react-native/Libraries/Renderer/shims/',
];

// Layer 2: resolved file-path substrings — stubs anything that resolves into
// these directories regardless of how it was imported (absolute or relative).
const RESOLVED_PATH_STUBS = [
  '/react-native/Libraries/BatchedBridge/',
  '/react-native/Libraries/TurboModule/',
];

const _resolveRequest = config.resolver.resolveRequest;
const baseResolve = (context, moduleName, platform) =>
  (_resolveRequest || context.resolveRequest)(context, moduleName, platform);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    // Layer 1: block by absolute module name prefix.
    if (ABSOLUTE_STUB_PREFIXES.some(p => moduleName.startsWith(p))) {
      return { type: 'empty' };
    }

    // Resolve, then apply layers 2 and 3.
    try {
      const result = baseResolve(context, moduleName, platform);

      // Layer 2: block by resolved file path (catches relative imports of BatchedBridge etc.)
      if (
        result.type === 'sourceFile' &&
        result.filePath &&
        RESOLVED_PATH_STUBS.some(p => result.filePath.includes(p))
      ) {
        return { type: 'empty' };
      }

      return result;
    } catch (e) {
      // Layer 3: when already inside react-native/Libraries/, swallow resolution
      // failures for imports that have no .web.js (e.g. Platform).
      if (
        context.originModulePath.includes('/react-native/Libraries/') &&
        !context.originModulePath.includes('/react-native-web/')
      ) {
        return { type: 'empty' };
      }
      throw e;
    }
  }

  return baseResolve(context, moduleName, platform);
};

module.exports = config;
