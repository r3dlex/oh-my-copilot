/**
 * MCP State Manager SQLite Adapter tests
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import * as stateManager from "../../src/mcp/state-manager.mts";

const get = vi.fn();
const all = vi.fn();
const run = vi.fn();
const prepare = vi.fn(() => ({ get, all, run }));
const database = { prepare };

describe("MCP state-manager SQLite Adapter", () => {
  beforeEach(() => {
    get.mockReset();
    all.mockReset();
    run.mockReset();
    prepare.mockClear();
  });

  it("gets the latest Session State", () => {
    get.mockReturnValue({
      id: "state-1",
      worktree_id: null,
      state_json: "{}",
      created_at: 1,
      updated_at: 2,
    });

    expect(stateManager.getLatestSession(database)).toMatchObject({ id: "state-1" });
    expect(prepare).toHaveBeenCalledWith(
      "SELECT * FROM sessions ORDER BY updated_at DESC LIMIT 1"
    );
  });

  it("returns null when no Session State exists", () => {
    get.mockReturnValue(undefined);
    expect(stateManager.getLatestSession(database)).toBeNull();
  });

  it("saves object state as serialized JSON", () => {
    stateManager.saveSession("state-1", "wt-1", { status: "active" }, database);
    expect(run).toHaveBeenCalledWith(
      "state-1",
      "wt-1",
      '{"status":"active"}',
      expect.any(Number),
      expect.any(Number)
    );
  });

  it("preserves serialized state without parsing it", () => {
    stateManager.saveSession("state-1", null, "not-json", database);
    expect(run).toHaveBeenCalledWith(
      "state-1",
      null,
      "not-json",
      expect.any(Number),
      expect.any(Number)
    );
  });

  it("lists Session States", () => {
    const sessions = [
      { id: "state-1", worktree_id: null, state_json: "{}", created_at: 1, updated_at: 2 },
    ];
    all.mockReturnValue(sessions);
    expect(stateManager.listSessions(database)).toEqual(sessions);
  });

  it("gets a Session State by id", () => {
    get.mockReturnValue({
      id: "state-1",
      worktree_id: null,
      state_json: "{}",
      created_at: 1,
      updated_at: 2,
    });
    expect(stateManager.getSession("state-1", database)).toMatchObject({ id: "state-1" });
    expect(get).toHaveBeenCalledWith("state-1");
  });

  it("deletes a Session State by id", () => {
    stateManager.deleteSession("state-1", database);
    expect(run).toHaveBeenCalledWith("state-1");
  });

  it("does not throw when no owned database is open", () => {
    expect(() => stateManager.closeDb()).not.toThrow();
  });
});
