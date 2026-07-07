/**
 * Unified file-system seam for OMP.
 *
 * Owns the JSON read/write primitives (safe read with fallback, atomic
 * temp+rename write) and the path factories for OMP state files under
 * `~/.omp`, so individual modules stop hand-rolling homedir/join,
 * ensure-dir, and read-with-fallback logic.
 *
 * Spec: docs/specifications/ACTIVE/file-system-seam.md
 */

import { mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import { homedir } from "os";
import { dirname, join } from "path";

// ─── primitives ──────────────────────────────────────────────

/** Recursively create a directory. Idempotent. */
export function ensureDir(dirPath: string): void {
  mkdirSync(dirPath, { recursive: true });
}

export interface ReadJsonSafeOptions {
  /**
   * Called when the file exists but cannot be read or parsed
   * (any failure other than ENOENT). Missing files stay silent.
   */
  onMalformed?: (path: string, err: unknown) => void;
}

/**
 * Read and parse a JSON file, returning `fallback` instead of throwing.
 * Missing file → fallback (silent). Malformed JSON or non-ENOENT read
 * error → fallback (after optional `onMalformed` callback).
 */
export function readJsonSafe<T>(path: string, fallback: T, options?: ReadJsonSafeOptions): T {
  let raw: string;
  try {
    raw = readFileSync(path, "utf-8");
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") options?.onMalformed?.(path, err);
    return fallback;
  }
  try {
    return JSON.parse(raw) as T;
  } catch (err: unknown) {
    options?.onMalformed?.(path, err);
    return fallback;
  }
}

/**
 * Atomically write a file: ensure the parent directory, write to
 * `<path>.tmp`, then rename into place so readers never observe a
 * half-written file.
 */
export function writeFileAtomic(path: string, content: string, mode?: number): void {
  ensureDir(dirname(path));
  const tempPath = `${path}.tmp`;
  writeFileSync(tempPath, content, mode === undefined ? "utf-8" : { encoding: "utf-8", mode });
  renameSync(tempPath, path);
}

/** Atomically write pretty-printed JSON (2-space indent, no trailing newline). */
export function writeJsonAtomic(path: string, data: unknown): void {
  writeFileAtomic(path, JSON.stringify(data, null, 2));
}

// ─── path factories ──────────────────────────────────────────

export type ConfigScope = "local" | "global";

/** `~/.omp/state` — OMP runtime state root. */
export function getStateDir(): string {
  return join(homedir(), ".omp", "state");
}

/** Config file for a scope: local `./.omp/config.json`, global `~/.omp/config.json`. */
export function getConfigPath(scope: ConfigScope): string {
  if (scope === "global") return join(homedir(), ".omp", "config.json");
  return join(process.cwd(), ".omp", "config.json");
}

/** `~/.omp/state/spending-monthly.json` — premium request counters. */
export function getSpendingPath(): string {
  return join(getStateDir(), "spending-monthly.json");
}

/** `~/.omp/state/sessions.json` — session index (PSM + MCP JSON fallback). */
export function getSessionIndexPath(): string {
  return join(getStateDir(), "sessions.json");
}

/** `~/.omp/state/sessions` — per-session state directories. */
export function getSessionsDir(): string {
  return join(getStateDir(), "sessions");
}

/** `~/.omp/state/omp.db` — SQLite database used by the MCP state manager. */
export function getPsmDbPath(): string {
  return join(getStateDir(), "omp.db");
}

export interface HudPaths {
  legacyLinePath: string;
  hudDir: string;
  statusJsonPath: string;
  displayPath: string;
  tmuxSegmentPath: string;
}

/**
 * HUD artifact paths under `<home>/.omp`. Honors a `$HOME` override first
 * (statusline consumers rely on this), matching the historical
 * `getStatuslinePaths` behavior.
 */
export function getHudPaths(home = process.env["HOME"] || homedir()): HudPaths {
  const ompDir = join(home, ".omp");
  const hudDir = join(ompDir, "hud");
  return {
    legacyLinePath: join(ompDir, "hud.line"),
    hudDir,
    statusJsonPath: join(hudDir, "status.json"),
    displayPath: join(hudDir, "display.txt"),
    tmuxSegmentPath: join(hudDir, "tmux-segment.sh"),
  };
}
