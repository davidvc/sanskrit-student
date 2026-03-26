// Shim native globals that Hermes injects on device but are missing or incomplete on web.
// This runs before any module code, so it's safe to patch globals here.

if (!global.TurboModuleRegistry) {
  global.TurboModuleRegistry = {};
}
if (typeof global.TurboModuleRegistry.get !== 'function') {
  global.TurboModuleRegistry.get = () => null;
}
if (typeof global.TurboModuleRegistry.getEnforcing !== 'function') {
  global.TurboModuleRegistry.getEnforcing = () => ({});
}

// ErrorUtils is normally injected by Hermes/the RN runtime before any JS runs.
// On web with Metro's hermes transform profile it is absent, causing
// react-native/Libraries/vendor/core/ErrorUtils.js (which just re-exports
// global.ErrorUtils) to return undefined, and then setUpErrorHandling.js
// crashes with "Cannot read properties of undefined (reading 'setGlobalHandler')".
if (!global.ErrorUtils) {
  let _globalHandler = (error) => { throw error; };
  global.ErrorUtils = {
    setGlobalHandler: (handler) => { _globalHandler = handler; },
    getGlobalHandler: () => _globalHandler,
    reportError: (error) => _globalHandler(error, false),
    reportFatalError: (error) => _globalHandler(error, true),
    applyWithGuard: (callback, context, args) => {
      try {
        return context ? callback.apply(context, args) : callback(...(args || []));
      } catch (e) {
        _globalHandler(e, false);
        return null;
      }
    },
    applyWithGuardIfNeeded: (callback, context, args) => {
      return context ? callback.apply(context, args) : callback(...(args || []));
    },
  };
}
