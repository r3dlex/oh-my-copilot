/**
 * SQLite loader with graceful fallback.
 *
 * Uses createRequire so esbuild cannot hoist the dependency to a static ESM
 * import. When better-sqlite3 is unavailable (e.g., git-clone plugin installs
 * that have no node_modules), SqliteConstructor is null and callers degrade
 * gracefully.
 */

import { createRequire } from "module";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let SqliteConstructor: ((...args: any[]) => any) | null = null;
try {
  SqliteConstructor = createRequire(import.meta.url)("better-sqlite3");
} catch {
  // SQLite not available
}

export { SqliteConstructor };
