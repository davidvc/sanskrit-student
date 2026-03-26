// No-op stub for TurboModuleRegistry on web.
// Native module lookups return null; callers that handle null work fine.
// Callers that don't (e.g. getEnforcing) get an empty object to avoid crashes.
//
// __esModule: true is required so that `import * as TurboModuleRegistry from '...'`
// exposes .get() and .getEnforcing() as named properties rather than nesting them
// under .default (which is what _interopRequireWildcard does for CJS modules without
// this flag). Without it, TurboModuleRegistry.get is undefined and callers crash.
module.exports = {
  __esModule: true,
  get: () => null,
  getEnforcing: () => ({}),
};
