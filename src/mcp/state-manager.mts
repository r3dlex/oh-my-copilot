/**
 * MCP State Manager
 * Session state persistence via SQLite with JSON file fallback.
 */

import { existsSync } from "fs";
import { dirname } from "path";
import {
  ensureDir,
  getPsmDbPath,
  getSessionIndexPath,
  getSessionStatePath,
  readJsonSafe,
  writeJsonAtomic,
} from "../utils/file-system.mts";
import { SqliteConstructor as sqlite } from "./db-loader.mts";

interface SessionStatement {
  get(...parameters: unknown[]): unknown;
  all(...parameters: unknown[]): unknown[];
  run(...parameters: unknown[]): unknown;
}

interface SessionDatabase {
  prepare(sql: string): SessionStatement;
}

interface SessionSchemaDatabase {
  exec(sql: string): unknown;
}

interface OwnedSessionDatabase extends SessionDatabase, SessionSchemaDatabase {
  pragma(sql: string): unknown;
  close(): void;
}

let _db: OwnedSessionDatabase | null = null;

const SESSION_SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    worktree_id TEXT,
    state_json TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_sessions_worktree ON sessions(worktree_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_updated ON sessions(updated_at);
`;
const SESSION_STATE_KEYS = new Set([
  "id",
  "worktree_id",
  "state_json",
  "created_at",
  "updated_at",
]);

/** Initialize the SQLite schema owned by the State Manager Module. */
export function initializeSessionSchema(database: SessionSchemaDatabase): void {
  database.exec(SESSION_SCHEMA_SQL);
}

function getDb(): SessionDatabase | null {
  if (!sqlite) return null;
  if (!_db) {
    const dbPath = getPsmDbPath();
    ensureDir(dirname(dbPath));
    const database = new sqlite(dbPath) as OwnedSessionDatabase;
    database.pragma("journal_mode = WAL");
    initializeSessionSchema(database);
    _db = database;
  }
  return _db;
}

function readJsonSessions(): SessionState[] {
  const statePath = getSessionStatePath();
  if (existsSync(statePath)) {
    return filterSessionStates(readJsonSafe<unknown>(statePath, []));
  }

  const legacySessions = filterSessionStates(
    readJsonSafe<unknown>(getSessionIndexPath(), [])
  );
  if (legacySessions.length > 0) {
    writeJsonAtomic(statePath, legacySessions);
  }
  return legacySessions;
}

function writeJsonSessions(sessions: SessionState[]): void {
  writeJsonAtomic(getSessionStatePath(), sessions);
}

export interface SessionState {
  id: string;
  worktree_id: string | null;
  state_json: string;
  created_at: number;
  updated_at: number;
}

function isSessionState(value: unknown): value is SessionState {
  if (typeof value !== "object" || value === null) return false;
  const session = value as Record<string, unknown>;
  const keys = Object.keys(session);
  return (
    keys.length === 5 &&
    keys.every((key) => SESSION_STATE_KEYS.has(key)) &&
    typeof session.id === "string" &&
    (typeof session.worktree_id === "string" || session.worktree_id === null) &&
    typeof session.state_json === "string" &&
    typeof session.created_at === "number" &&
    typeof session.updated_at === "number"
  );
}

function filterSessionStates(value: unknown): SessionState[] {
  return Array.isArray(value) ? value.filter(isSessionState) : [];
}

/**
 * Get the latest session state.
 */
export function getLatestSession(database: SessionDatabase | null = getDb()): SessionState | null {
  const db = database;
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
export function saveSession(
  id: string,
  worktreeId: string | null,
  state: Record<string, unknown> | string,
  database: SessionDatabase | null = getDb()
): void {
  const db = database;
  const now = Date.now();
  const stateJson = typeof state === "string" ? state : JSON.stringify(state);

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
export function listSessions(database: SessionDatabase | null = getDb()): SessionState[] {
  const db = database;
  if (db) {
    return db.prepare("SELECT * FROM sessions ORDER BY updated_at DESC").all() as SessionState[];
  }
  return readJsonSessions().sort((a, b) => b.updated_at - a.updated_at);
}

/**
 * Get a session by ID.
 */
export function getSession(id: string, database: SessionDatabase | null = getDb()): SessionState | null {
  const db = database;
  if (db) {
    const row = db.prepare("SELECT * FROM sessions WHERE id = ?").get(id) as SessionState | undefined;
    return row ?? null;
  }
  return readJsonSessions().find((s) => s.id === id) ?? null;
}

/**
 * Delete a session.
 */
export function deleteSession(id: string, database: SessionDatabase | null = getDb()): void {
  const db = database;
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
