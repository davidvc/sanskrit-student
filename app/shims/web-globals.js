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
