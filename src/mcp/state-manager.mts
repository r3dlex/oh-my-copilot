/**
 * MCP State Manager
 * Session state persistence via SQLite with JSON file fallback.
 */

import { dirname } from "path";
import {
  ensureDir,
  getPsmDbPath,
  getSessionIndexPath,
  readJsonSafe,
  writeJsonAtomic,
} from "../utils/file-system.mts";
import { SqliteConstructor as sqlite } from "./db-loader.mts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _db: any | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getDb(): any | null {
  if (!sqlite) return null;
  if (!_db) {
    const dbPath = getPsmDbPath();
    ensureDir(dirname(dbPath));
    _db = new sqlite(dbPath);
    _db.pragma("journal_mode = WAL");
  }
  return _db;
}

function readJsonSessions(): SessionState[] {
  return readJsonSafe<SessionState[]>(getSessionIndexPath(), []);
}

function writeJsonSessions(sessions: SessionState[]): void {
  writeJsonAtomic(getSessionIndexPath(), sessions);
}

export interface SessionState {
  id: string;
  worktree_id: string | null;
  state_json: string;
  created_at: number;
  updated_at: number;
}

/**
 * Get the latest session state.
 */
export function getLatestSession(): SessionState | null {
  const db = getDb();
  if (db) {
    const row = db.prepare("SELECT * FROM sessions ORDER BY updated_at DESC LIMIT 1").get() as SessionState | undefined;
    return row ?? null;
  }
  const sessions = readJsonSessions();
  return sessions.sort((a, b) => b.updated_at - a.updated_at)[0] ?? null;
}

/**
 * Save a session state.
 */
export function saveSession(id: string, worktreeId: string | null, state: Record<string, unknown>): void {
  const db = getDb();
  const now = Date.now();
  const stateJson = JSON.stringify(state);

  if (db) {
    db.prepare(`
      INSERT INTO sessions (id, worktree_id, state_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        state_json = excluded.state_json,
        updated_at = excluded.updated_at
    `).run(id, worktreeId, stateJson, now, now);
    return;
  }

  const sessions = readJsonSessions();
  const idx = sessions.findIndex((s) => s.id === id);
  if (idx >= 0) {
    sessions[idx] = { ...sessions[idx], state_json: stateJson, updated_at: now };
  } else {
    sessions.push({ id, worktree_id: worktreeId, state_json: stateJson, created_at: now, updated_at: now });
  }
  writeJsonSessions(sessions);
}

/**
 * List all sessions.
 */
export function listSessions(): SessionState[] {
  const db = getDb();
  if (db) {
    return db.prepare("SELECT * FROM sessions ORDER BY updated_at DESC").all() as SessionState[];
  }
  return readJsonSessions().sort((a, b) => b.updated_at - a.updated_at);
}

/**
 * Get a session by ID.
 */
export function getSession(id: string): SessionState | null {
  const db = getDb();
  if (db) {
    const row = db.prepare("SELECT * FROM sessions WHERE id = ?").get(id) as SessionState | undefined;
    return row ?? null;
  }
  return readJsonSessions().find((s) => s.id === id) ?? null;
}

/**
 * Delete a session.
 */
export function deleteSession(id: string): void {
  const db = getDb();
  if (db) {
    db.prepare("DELETE FROM sessions WHERE id = ?").run(id);
    return;
  }
  writeJsonSessions(readJsonSessions().filter((s) => s.id !== id));
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
