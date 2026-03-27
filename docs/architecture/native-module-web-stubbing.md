# Native Module Web Stubbing: Problem Statement & Design Proposal

> **ARCHIVED (2026-03-27):** This problem no longer exists. [ADR-0004](../adr/0004-split-web-and-native-apps.md) split the Universal React Native app into separate `packages/web` (Next.js) and `packages/native` (Expo) apps. The native app no longer targets web, so there is no web build to stub native modules for. The Metro resolver hacks, shims, and stubs described below have all been deleted.

## Problem Statement

When running this React Native / Expo app on the **web platform**, the Metro bundler uses `transform.engine=hermes` (hardcoded by Expo CLI, not configurable). This means the bundle includes React Native internals that assume a native runtime environment — globals injected by Hermes (`ErrorUtils`, `TurboModuleRegistry`), native bridge infrastructure (`BatchedBridge`, `NativeModules`), and native component codegen (`codegenNativeComponent`).

On device, these are provided by the native runtime before any JavaScript executes. **On web, they don't exist.** The result is a cascade of runtime crashes whenever a module tries to use a native-only API.

### Why This Keeps Happening

We have fixed this error **9 times** across 9 commits, each time addressing a new module that crashes. The pattern:

1. A new native-only module gets pulled into the web bundle
2. It calls a missing native API (e.g., `ErrorUtils.setGlobalHandler`, `TurboModuleRegistry.get`, `__fbBatchedBridgeConfig`)
3. The app crashes on web
4. We add another entry to the blocklist in `metro.config.js`
5. Repeat

The current `metro.config.js` has grown to **123 lines** of defensive resolver logic with 4 separate interception layers. Each layer was added reactively to fix a specific crash. The approach is **whack-a-mole** — unsustainable and fragile.

### Specific Failure Modes

There are **5 distinct ways** a native module can slip through:

| # | Path | Example | Current Fix |
|---|------|---------|-------------|
| 1 | Absolute import by module name | `require('react-native/Libraries/BatchedBridge/NativeModules')` | `ABSOLUTE_STUB_PREFIXES` array |
| 2 | Relative import that resolves to native path | `require('../BatchedBridge/NativeModules')` from within `react-native/Libraries/` | `RESOLVED_NATIVE_PATHS` + origin check |
| 3 | Relative import with no `.web.js` variant | `require('../../Utilities/Platform')` where only `.ios.js` and `.android.js` exist | `catch` block returns empty module |
| 4 | Missing global runtime injection | `global.ErrorUtils` accessed before any module code | `web-globals.js` polyfill |
| 5 | Empty module vs. real stub mismatch | `import * as TurboModuleRegistry` gets `{ default: {} }` with no named exports from empty module | Dedicated stub file with `__esModule: true` |

### Latest Error

```
Cannot read properties of undefined (reading 'setGlobalHandler')
```

`setUpErrorHandling.js` (loaded during `InitializeCore`) calls `ErrorUtils.setGlobalHandler()`. `ErrorUtils` is a global injected by the Hermes runtime — absent on web. Despite having a `web-globals.js` shim that provides `ErrorUtils`, it appears the module is loading **before** the polyfill executes, or the polyfill isn't being applied.

---

## Design Proposal: Registry-Based Native Module Filter

### Goals

1. **Single place** to register native modules/paths that need stubbing on web
2. **Easy to extend** — adding a new filter should be a one-line change
3. **Cover all 5 failure modes** with a unified mechanism
4. **Self-documenting** — each entry explains what it stubs and why
5. **Testable** — the filter logic can be validated independently of Metro

### Architecture

```
app/
  native-web-filter/
    index.js              # Exports the configured Metro resolver modifier
    registry.js           # Declarative list of all native modules to stub
    stubs/                # Stub implementations for modules that need real exports
      TurboModuleRegistry.js
      ErrorUtils.js       # (future: any module needing a real stub)
    web-polyfills.js      # Global shims injected before module code
  metro.config.js         # Thin — delegates to native-web-filter
```

### The Registry

A single, declarative data structure where every native module filter is defined:

```js
// native-web-filter/registry.js

module.exports = [
  // ── Bridge Infrastructure ──────────────────────────────────
  {
    name: 'BatchedBridge',
    match: { prefix: 'react-native/Libraries/BatchedBridge/' },
    action: 'empty',
    reason: 'Native bridge — no web equivalent',
  },

  // ── TurboModule ────────────────────────────────────────────
  {
    name: 'TurboModule (directory)',
    match: { prefix: 'react-native/Libraries/TurboModule/' },
    action: 'empty',
    reason: 'TurboModule infrastructure — not used on web',
  },
  {
    name: 'TurboModuleRegistry',
    match: { prefix: 'react-native/Libraries/TurboModule/TurboModuleRegistry' },
    action: 'stub',
    stubFile: 'TurboModuleRegistry.js',
    reason: 'Callers invoke .get()/.getEnforcing() — needs real no-op exports',
  },

  // ── Codegen ────────────────────────────────────────────────
  {
    name: 'codegenNativeComponent',
    match: { prefix: 'react-native/Libraries/Utilities/codegenNativeComponent' },
    action: 'empty',
    reason: 'Native component codegen — no web equivalent',
  },
  {
    name: 'codegenNativeCommands',
    match: { prefix: 'react-native/Libraries/Utilities/codegenNativeCommands' },
    action: 'empty',
    reason: 'Native commands codegen — no web equivalent',
  },

  // ── Renderer Shims ─────────────────────────────────────────
  {
    name: 'Renderer shims',
    match: { prefix: 'react-native/Libraries/Renderer/shims/' },
    action: 'empty',
    reason: 'Native renderer shims — web uses react-dom',
  },

  // ── Error Handling ─────────────────────────────────────────
  {
    name: 'setUpErrorHandling',
    match: { prefix: 'react-native/Libraries/Core/setUpErrorHandling' },
    action: 'empty',
    reason: 'Calls ErrorUtils.setGlobalHandler — ErrorUtils is Hermes-only global',
  },
  {
    name: 'ExceptionsManager',
    match: { prefix: 'react-native/Libraries/Core/ExceptionsManager' },
    action: 'empty',
    reason: 'Delegates to NativeExceptionsManager — native only',
  },

  // ── Add new entries here ───────────────────────────────────
  // {
  //   name: 'MyNativeModule',
  //   match: { prefix: 'react-native/Libraries/...' },
  //   action: 'empty' | 'stub',
  //   stubFile: 'MyStub.js',     // only if action === 'stub'
  //   reason: 'Why this needs stubbing',
  // },
];
```

### Match Types

The registry supports multiple match strategies, covering all 5 failure modes:

```js
match: { prefix: 'react-native/Libraries/BatchedBridge/' }
// Matches absolute imports starting with this prefix

match: { resolvedPath: '/react-native/Libraries/BatchedBridge/' }
// Matches resolved file paths containing this substring
// Only applied when origin is inside react-native/Libraries/

match: { moduleName: 'react-native/Libraries/Core/setUpErrorHandling' }
// Exact module name match (for specific files, not directories)
```

### Actions

| Action | Behavior |
|--------|----------|
| `'empty'` | Returns `{ type: 'empty' }` — Metro's built-in empty module |
| `'stub'` | Returns `{ type: 'sourceFile', filePath: '<stubFile>' }` — a real JS file with exports |

### The Resolver

The resolver becomes a generic engine that reads the registry:

```js
// native-web-filter/index.js

const path = require('path');
const registry = require('./registry');

const isDev = process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test';

// ── Dev-only first-hit logger ────────────────────────────────────────────
// Prints once per entry the first time the resolver stubs it. Guarded by
// NODE_ENV so production bundles pay zero cost. The Set tracks entry names
// rather than module paths — we care about "which registry rule fired", not
// every individual import that triggered it.
const _loggedEntries = new Set();

function logStub(moduleName, entry) {
  if (!isDev) return;
  if (_loggedEntries.has(entry.name)) return;
  _loggedEntries.add(entry.name);
  const action = entry.action === 'stub' ? `stub (${entry.stubFile})` : 'empty';
  console.log(
    `[native-web-filter] Stubbed "${moduleName}" as ${entry.name} (${action}) – ${entry.reason}`
  );
}

// ── Dev-only startup validation ──────────────────────────────────────────
if (isDev) {
  try {
    const { validateRegistry } = require('./validate-registry');
    validateRegistry({ strict: false });
  } catch {
    // node_modules not installed yet or validation module missing — skip
  }
}

// ── Resolver factory ─────────────────────────────────────────────────────

function createWebFilter(baseResolver) {
  // Pre-compute lookup structures from registry for performance
  const prefixEntries = registry.filter(e => e.match.prefix);
  const resolvedPathEntries = registry.filter(e => e.match.resolvedPath);

  // Sort: stub entries before empty entries (more specific first)
  prefixEntries.sort((a, b) => (a.action === 'stub' ? -1 : 1));

  return (context, moduleName, platform) => {
    if (platform !== 'web') {
      return (baseResolver || context.resolveRequest)(context, moduleName, platform);
    }

    // Check absolute prefix matches
    for (const entry of prefixEntries) {
      if (moduleName.startsWith(entry.match.prefix)) {
        logStub(moduleName, entry);
        return resolveAction(entry);
      }
    }

    // Check resolved path matches (scoped to react-native/Libraries origin)
    if (
      context.originModulePath.includes('/react-native/Libraries/') &&
      !context.originModulePath.includes('/react-native-web/')
    ) {
      try {
        const result = (baseResolver || context.resolveRequest)(context, moduleName, platform);
        if (result.type === 'sourceFile' && result.filePath) {
          for (const entry of resolvedPathEntries) {
            if (result.filePath.includes(entry.match.resolvedPath)) {
              logStub(moduleName, entry);
              return resolveAction(entry);
            }
          }
        }
        return result;
      } catch {
        return { type: 'empty' };
      }
    }

    return (baseResolver || context.resolveRequest)(context, moduleName, platform);
  };
}

function resolveAction(entry) {
  if (entry.action === 'stub') {
    return {
      type: 'sourceFile',
      filePath: path.resolve(__dirname, 'stubs', entry.stubFile),
    };
  }
  return { type: 'empty' };
}

module.exports = { createWebFilter };
```

#### Dev Logger Behavior

When `NODE_ENV` is not `production` or `test`, the resolver logs the **first hit** for each registry entry. Subsequent imports matching the same entry are silent — this avoids flooding the console (Metro resolves the same module many times during a build).

Example output at Metro startup:

```
[native-web-filter] Stubbed "react-native/Libraries/BatchedBridge/NativeModules" as BatchedBridge (empty) – Native bridge — no web equivalent
[native-web-filter] Stubbed "react-native/Libraries/TurboModule/TurboModuleRegistry" as TurboModuleRegistry (stub (TurboModuleRegistry.js)) – Callers invoke .get()/.getEnforcing() — needs real no-op exports
[native-web-filter] Stubbed "react-native/Libraries/Core/setUpErrorHandling" as setUpErrorHandling (empty) – Calls ErrorUtils.setGlobalHandler — ErrorUtils is Hermes-only global
```

This gives immediate visibility into which filters are active without requiring any debug flags or extra configuration. If an entry **never** appears in the log, it may be stale (the validation script catches this explicitly, but the log provides a live signal during development).

### Simplified metro.config.js

After refactoring, `metro.config.js` becomes thin and stable — it shouldn't need to change when new native modules are added:

```js
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const { createWebFilter } = require('./native-web-filter');

const config = getDefaultConfig(__dirname);

// Inject web polyfills before any module code
const existingGetPolyfills = config.serializer?.getPolyfills?.bind(config.serializer);
config.serializer = config.serializer ?? {};
config.serializer.getPolyfills = (options) => {
  const defaults = existingGetPolyfills ? existingGetPolyfills(options) : [];
  if (options.platform === 'web') {
    return [path.resolve(__dirname, 'native-web-filter/web-polyfills.js'), ...defaults];
  }
  return defaults;
};

// Apply native module filter for web
const baseResolver = config.resolver.resolveRequest;
config.resolver.resolveRequest = createWebFilter(baseResolver);

module.exports = config;
```

### Adding a New Filter

When the next native module crash appears, the fix is a **single registry entry**:

```js
// In registry.js, add:
{
  name: 'NewCrashingModule',
  match: { prefix: 'react-native/Libraries/Whatever/NewModule' },
  action: 'empty',
  reason: 'Calls NativeWhatever which is device-only',
},
```

If the module needs real exports (like TurboModuleRegistry), create a stub file and use `action: 'stub'`.

### Polyfills (web-polyfills.js)

The existing `web-globals.js` moves to `native-web-filter/web-polyfills.js` unchanged. This provides the **defensive layer** — even if a module slips past the resolver, global shims prevent the worst crashes.

---

## Why Not Other Approaches?

### Why not patch react-native or Expo?
- `transform.engine=hermes` is hardcoded in Expo CLI — can't disable
- react-native's module structure is upstream and changes frequently
- Patching node_modules breaks on install and is fragile

### Why not use `react-native-web` aliases for everything?
- `react-native-web` only aliases the public API surface (`react-native` → `react-native-web`)
- Internal paths like `react-native/Libraries/TurboModule/TurboModuleRegistry` are not aliased
- Third-party packages often bypass the alias with direct `react-native/Libraries/` imports

### Why not a Babel plugin?
- Babel transforms happen after module resolution — too late to prevent the import
- The issue is which files get bundled, not how they're transformed
- Metro's resolver is the correct interception point

### Why not `module.resolve.alias` in Metro config?
- Metro doesn't support webpack-style resolve aliases
- The resolver hook is the idiomatic Metro approach

---

## Migration Path

1. Create `native-web-filter/` directory with `registry.js`, `index.js`
2. Move `stubs/TurboModuleRegistry.js` → `native-web-filter/stubs/TurboModuleRegistry.js`
3. Move `shims/web-globals.js` → `native-web-filter/web-polyfills.js`
4. Replace `metro.config.js` resolver logic with `createWebFilter` call
5. Verify web bundle loads without crashes
6. Remove old `stubs/` and `shims/` directories

## Registry Validation

### Problem

Registry entries can go stale silently. When `react-native` is upgraded, directories may be renamed, removed, or restructured. A stale entry means:

- **False confidence** — you think a path is stubbed but nothing matches it anymore
- **Dead code** — the registry grows with entries that do nothing
- **Missed renames** — a path was moved, not removed; the module still needs stubbing but the old entry no longer catches it

### Solution: Validation Script

A script that walks `node_modules/react-native/Libraries/` and asserts every registry entry matches at least one real file or directory. This runs in two contexts:

1. **CI** — fails the build when an entry is stale (post-upgrade safety net)
2. **Development startup** — warns in the console so you catch it early

#### Architecture

```
app/
  native-web-filter/
    index.js
    registry.js
    validate-registry.js    # <-- new: validation logic
    stubs/
    web-polyfills.js
```

#### validate-registry.js

```js
// native-web-filter/validate-registry.js

const fs = require('fs');
const path = require('path');
const registry = require('./registry');

/**
 * Validates that every registry entry matches at least one file or directory
 * under node_modules/react-native/Libraries.
 *
 * @param {object} options
 * @param {string} options.nodeModulesPath - Path to node_modules/
 * @param {boolean} options.strict - If true, throws on stale entries (CI mode).
 *                                   If false, logs warnings (dev mode).
 * @returns {{ valid: Entry[], stale: Entry[] }}
 */
function validateRegistry({ nodeModulesPath, strict = false } = {}) {
  const basePath = nodeModulesPath
    || path.resolve(__dirname, '..', 'node_modules');

  const results = { valid: [], stale: [] };

  for (const entry of registry) {
    const matched = entryMatchesFileSystem(entry, basePath);
    if (matched) {
      results.valid.push(entry);
    } else {
      results.stale.push(entry);
    }
  }

  if (results.stale.length > 0) {
    const message = formatStaleReport(results.stale);
    if (strict) {
      throw new Error(message);
    } else {
      console.warn(message);
    }
  }

  return results;
}

/**
 * Checks whether a registry entry's match pattern corresponds to at least
 * one real file or directory on disk.
 */
function entryMatchesFileSystem(entry, basePath) {
  const match = entry.match;

  if (match.prefix) {
    return prefixMatchesFs(match.prefix, basePath);
  }

  if (match.resolvedPath) {
    // resolvedPath patterns contain a leading slash and are substrings of
    // absolute paths, e.g. '/react-native/Libraries/BatchedBridge/'.
    // Strip the leading slash and check relative to node_modules.
    const relativePath = match.resolvedPath.replace(/^\//, '');
    return prefixMatchesFs(relativePath, basePath);
  }

  // Unknown match type — can't validate, treat as valid
  return true;
}

/**
 * Given a prefix like 'react-native/Libraries/BatchedBridge/', checks
 * whether the corresponding path exists as a file or directory.
 *
 * For directory prefixes (trailing slash), checks the directory exists.
 * For file prefixes, checks with common extensions (.js, .ts, .jsx, .tsx)
 * and also checks as an exact path (could be extensionless or a directory).
 */
function prefixMatchesFs(prefix, basePath) {
  const fullPath = path.join(basePath, prefix);

  // Exact match (directory or extensionless file)
  if (fs.existsSync(fullPath)) {
    return true;
  }

  // Try common extensions for file prefixes
  const extensions = ['.js', '.ts', '.jsx', '.tsx', '.json'];
  for (const ext of extensions) {
    if (fs.existsSync(fullPath + ext)) {
      return true;
    }
  }

  // For directory-style prefixes, the parent directory might exist
  // with the files inside it (e.g., prefix ends with '/')
  if (prefix.endsWith('/')) {
    const dirPath = fullPath.replace(/\/$/, '');
    return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  }

  return false;
}

function formatStaleReport(staleEntries) {
  const lines = [
    '[native-web-filter] Stale registry entries detected:',
    '',
    ...staleEntries.map(e => {
      const matchDesc = e.match.prefix || e.match.resolvedPath || JSON.stringify(e.match);
      return `  - ${e.name}: ${matchDesc}\n    Reason was: ${e.reason}`;
    }),
    '',
    'These entries match no files under node_modules/react-native/Libraries/.',
    'They may need to be updated or removed after a react-native upgrade.',
  ];
  return lines.join('\n');
}

module.exports = { validateRegistry };
```

#### CI Script

A lightweight runner for CI pipelines. Add to `package.json` scripts:

```json
{
  "scripts": {
    "validate:native-filter": "node native-web-filter/validate-registry-cli.js"
  }
}
```

```js
// native-web-filter/validate-registry-cli.js

const { validateRegistry } = require('./validate-registry');

try {
  const { valid, stale } = validateRegistry({ strict: true });
  console.log(
    `[native-web-filter] Registry OK: ${valid.length} entries validated, 0 stale.`
  );
  process.exit(0);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
```

#### Development Mode (Strict Warnings at Metro Startup)

Integrate validation into `index.js` so it runs once when Metro starts, without blocking the build:

```js
// In native-web-filter/index.js, add at module load time:

if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  try {
    const { validateRegistry } = require('./validate-registry');
    validateRegistry({ strict: false }); // logs warnings, doesn't throw
  } catch {
    // Validation itself failed (e.g., node_modules not installed yet) — skip
  }
}
```

This means:
- **In development**: You see a console warning the moment Metro loads if any entry is stale
- **In CI**: `npm run validate:native-filter` fails the build explicitly
- **In production**: No validation overhead

#### Stub File Validation

The script also validates that `action: 'stub'` entries point to stub files that exist:

```js
// Add to validateRegistry(), after the filesystem check loop:

for (const entry of registry) {
  if (entry.action === 'stub' && entry.stubFile) {
    const stubPath = path.resolve(__dirname, 'stubs', entry.stubFile);
    if (!fs.existsSync(stubPath)) {
      results.stale.push({
        ...entry,
        reason: `Stub file missing: stubs/${entry.stubFile}`,
      });
    }
  }
}
```

#### Example CI Output (Failure)

```
[native-web-filter] Stale registry entries detected:

  - Renderer shims: react-native/Libraries/Renderer/shims/
    Reason was: Native renderer shims — web uses react-dom

These entries match no files under node_modules/react-native/Libraries/.
They may need to be updated or removed after a react-native upgrade.
```

#### Example Dev Output (Warning)

Same message, printed as `console.warn` at Metro startup — visible in the terminal but doesn't block the bundler.

### When to Run

| Context | Trigger | Mode | Behavior |
|---------|---------|------|----------|
| Local dev | Metro starts | `strict: false` | Warns in console |
| CI | `npm run validate:native-filter` | `strict: true` | Fails build |
| Post-upgrade | After `npm install` with RN version change | Either | Catches renames/removals |

---

## Open Questions

1. **Should the registry support glob/regex patterns?** For now, prefix matching covers all cases. Regex adds complexity for no proven need.
