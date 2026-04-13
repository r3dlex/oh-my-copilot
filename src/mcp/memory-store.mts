/**
 * MCP Memory Store
 * Key-value memory with categories and TTL.
 * Uses SQLite when available; falls back to JSON file storage.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { homedir } from "os";
import { dirname, join } from "path";
import { SqliteConstructor as sqlite } from "./db-loader.mts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _db: any | null = null;

function ensureDir(filePath: string): void {
  const dir = dirname(filePath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getDb(): any | null {
  if (!sqlite) return null;
  if (!_db) {
    const dbPath = join(homedir(), ".omp", "state", "omp.db");
    ensureDir(dbPath);
    _db = new sqlite(dbPath);
    _db.pragma("journal_mode = WAL");
  }
  return _db;
}

const jsonPath = join(homedir(), ".omp", "state", "memory.json");

function readJsonMemory(): Record<string, MemoryEntry> {
  try {
    if (!existsSync(jsonPath)) return {};
    return JSON.parse(readFileSync(jsonPath, "utf-8")) as Record<string, MemoryEntry>;
  } catch {
    return {};
  }
}

function writeJsonMemory(mem: Record<string, MemoryEntry>): void {
  ensureDir(jsonPath);
  writeFileSync(jsonPath, JSON.stringify(mem, null, 2), "utf-8");
}

export interface MemoryEntry {
  key: string;
  value: string;
  category: string | null;
  session_id: string | null;
  created_at: number;
  updated_at: number;
}

/**
 * Get a memory entry by key.
 */
export function get(key: string): string | null {
  const db = getDb();
  if (db) {
    const row = db.prepare("SELECT value FROM memory WHERE key = ?").get(key) as { value: string } | undefined;
    return row?.value ?? null;
  }
  return readJsonMemory()[key]?.value ?? null;
}

/**
 * Set a memory entry.
 */
export function set(
  key: string,
  value: string,
  category?: string,
  sessionId?: string
): void {
  const db = getDb();
  const now = Date.now();

  if (db) {
    db.prepare(`
      INSERT INTO memory (key, value, category, session_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        category = COALESCE(excluded.category, category),
        session_id = COALESCE(excluded.session_id, session_id),
        updated_at = excluded.updated_at
    `).run(key, value, category ?? null, sessionId ?? null, now, now);
    return;
  }

  const mem = readJsonMemory();
  const existing = mem[key];
  mem[key] = {
    key,
    value,
    category: category ?? existing?.category ?? null,
    session_id: sessionId ?? existing?.session_id ?? null,
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };
  writeJsonMemory(mem);
}

/**
 * Delete a memory entry.
 */
export function del(key: string): void {
  const db = getDb();
  if (db) {
    db.prepare("DELETE FROM memory WHERE key = ?").run(key);
    return;
  }
  const mem = readJsonMemory();
  delete mem[key];
  writeJsonMemory(mem);
}

/**
 * List memory entries by category.
 */
export function listByCategory(category: string): MemoryEntry[] {
  const db = getDb();
  if (db) {
    return db.prepare("SELECT * FROM memory WHERE category = ? ORDER BY updated_at DESC").all(category) as MemoryEntry[];
  }
  return Object.values(readJsonMemory())
    .filter((e) => e.category === category)
    .sort((a, b) => b.updated_at - a.updated_at);
}

/**
 * List memory entries by session.
 */
export function listBySession(sessionId: string): MemoryEntry[] {
  const db = getDb();
  if (db) {
    return db.prepare("SELECT * FROM memory WHERE session_id = ? ORDER BY updated_at DESC").all(sessionId) as MemoryEntry[];
  }
  return Object.values(readJsonMemory())
    .filter((e) => e.session_id === sessionId)
    .sort((a, b) => b.updated_at - a.updated_at);
}

/**
 * List all memory entries.
 */
export function listAll(): MemoryEntry[] {
  const db = getDb();
  if (db) {
    return db.prepare("SELECT * FROM memory ORDER BY updated_at DESC").all() as MemoryEntry[];
  }
  return Object.values(readJsonMemory()).sort((a, b) => b.updated_at - a.updated_at);
}

/**
 * Clear all memory entries.
 */
export function clearAll(): void {
  const db = getDb();
  if (db) {
    db.prepare("DELETE FROM memory").run();
    return;
  }
  writeJsonMemory({});
}

/**
 * Close the database connection.
 */
export function closeDb(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}
