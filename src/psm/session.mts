/**
 * PSM — Project Session Manager
 * Session lifecycle management.
 */

import { rmSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import {
  ensureDir,
  getSessionIndexPath,
  getSessionsDir,
  readJsonSafe,
  writeFileAtomic,
  writeJsonAtomic,
} from "../utils/file-system.mts";

export interface SessionRecord {
  id: string;
  name: string;
  worktreePath: string;
  branch: string;
  createdAt: number;
  lastActivityAt: number;
  status: "active" | "archived" | "destroyed";
}

function readSessionsIndex(): SessionRecord[] {
  return readJsonSafe<SessionRecord[]>(getSessionIndexPath(), []);
}

function writeSessionsIndex(sessions: SessionRecord[]): void {
  writeJsonAtomic(getSessionIndexPath(), sessions);
}

/**
 * Create a new PSM session.
 */
export function createSession(name: string): SessionRecord {
  const id = `psm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const worktreePath = join(homedir(), ".omp-sessions", name);
  const branch = `omp/${name}`;

  const record: SessionRecord = {
    id,
    name,
    worktreePath,
    branch,
    createdAt: Date.now(),
    lastActivityAt: Date.now(),
    status: "active",
  };

  const sessions = readSessionsIndex();
  sessions.push(record);
  writeSessionsIndex(sessions);

  // Create session state directory
  const sessionDir = join(getSessionsDir(), id);
  ensureDir(sessionDir);
  writeFileAtomic(join(sessionDir, "session.json"), JSON.stringify({ id, name, branch, createdAt: record.createdAt }));

  return record;
}

/**
 * List all PSM sessions.
 */
export function listSessions(): SessionRecord[] {
  return readSessionsIndex();
}

/**
 * Switch to a PSM session (returns the session record).
 */
export function switchSession(name: string): SessionRecord | null {
  const sessions = readSessionsIndex();
  const session = sessions.find((s) => s.name === name && s.status === "active");
  if (!session) return null;
  session.lastActivityAt = Date.now();
  writeSessionsIndex(sessions);
  return session;
}

/**
 * Destroy a PSM session and optionally remove its worktree.
 */
export function destroySession(name: string, removeWorktree = false): boolean {
  const sessions = readSessionsIndex();
  const idx = sessions.findIndex((s) => s.name === name);
  if (idx === -1) return false;

  const session = sessions[idx];
  session.status = "destroyed";
  sessions.splice(idx, 1);
  writeSessionsIndex(sessions);

  // Remove session state directory
  const sessionDir = join(getSessionsDir(), session.id);
  try {
    rmSync(sessionDir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }

  if (removeWorktree) {
    try {
      rmSync(session.worktreePath, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }

  return true;
}
