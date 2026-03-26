const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Expo CLI hardcodes transform.engine=hermes for all web bundles. With the
// hermes-stable transform profile, _interopRequireWildcard is used to handle
// `import * as X from '...'`. If the resolved module is an empty stub
// ({ type: 'empty' }), _interopRequireWildcard returns { default: {} } — no
// named properties — so TurboModuleRegistry.get ends up undefined.
// The shim below patches global.TurboModuleRegistry as a safety net; the real
// fix is in the resolver below (redirect relative TurboModuleRegistry imports
// to the stub file instead of returning an empty module).
const existingGetPolyfills = config.serializer?.getPolyfills?.bind(config.serializer);
config.serializer = config.serializer ?? {};
config.serializer.getPolyfills = (options) => {
  const defaults = existingGetPolyfills ? existingGetPolyfills(options) : [];
  if (options.platform === 'web') {
    return [path.resolve(__dirname, 'shims/web-globals.js'), ...defaults];
  }
  return defaults;
};

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

// TurboModuleRegistry needs a real stub (not empty) so callers can invoke .get()
// without crashing. With transform.engine=hermes, this module is imported directly
// rather than through react-native-web's alias.
const TURBO_MODULE_REGISTRY_STUB = path.resolve(__dirname, 'stubs/TurboModuleRegistry.js');

// Only used when the *origin* is already inside react-native/Libraries/.
const RESOLVED_NATIVE_PATHS = [
  '/react-native/Libraries/BatchedBridge/',
  '/react-native/Libraries/TurboModule/',
];

const _resolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    // TurboModuleRegistry: return a callable no-op stub so .get() doesn't crash.
    // With transform.engine=hermes, this is imported directly rather than via
    // react-native-web's alias, so it must be handled before the normal alias lookup.
    if (moduleName.startsWith('react-native/Libraries/TurboModule/TurboModuleRegistry')) {
      return { type: 'sourceFile', filePath: TURBO_MODULE_REGISTRY_STUB };
    }

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
          // TurboModuleRegistry is imported via relative path (e.g. from JSTimers →
          // NativeTiming → '../../TurboModule/TurboModuleRegistry'). An empty module
          // causes _interopRequireWildcard to produce { default: {} } which has no
          // .get(), crashing with "TurboModuleRegistry.get is not a function".
          // Return the real stub so callers receive a working no-op .get() instead.
          if (result.filePath.includes('TurboModuleRegistry')) {
            return { type: 'sourceFile', filePath: TURBO_MODULE_REGISTRY_STUB };
          }
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
