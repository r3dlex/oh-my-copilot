/**
 * Config loader for OMP.
 * Reads from .omp/config.json (local) and ~/.omp/config.json (global).
 * Malformed JSON → log warning + return {} (never throw)
 * Missing file → return {}
 */

import { getConfigPath, readJsonSafe, writeJsonAtomic, type ConfigScope } from "./file-system.mts";

export type { ConfigScope } from "./file-system.mts";

function readConfigFile<T>(path: string): Partial<T> {
  return readJsonSafe<Partial<T>>(path, {}, {
    onMalformed: () => console.warn(`[OMP] config: malformed JSON at ${path}, using defaults`),
  });
}

export function loadConfig<T>(_name: string, scope?: ConfigScope): Partial<T> {
  if (scope === "local") return readConfigFile<T>(getConfigPath("local"));
  if (scope === "global") return readConfigFile<T>(getConfigPath("global"));
  // Merge: local wins
  const global = readConfigFile<T>(getConfigPath("global"));
  const local = readConfigFile<T>(getConfigPath("local"));
  return { ...global, ...local };
}

export function writeConfig<T>(_name: string, scope: ConfigScope, patch: Partial<T>): void {
  const path = getConfigPath(scope);
  const existing = readConfigFile<T>(path);
  const merged = { ...existing, ...patch };
  writeJsonAtomic(path, merged);
}
