/**
 * MCP State Manager owned SQLite schema tests.
 */

import { afterAll, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => {
  const get = vi.fn(() => undefined);
  return {
    pragma: vi.fn(),
    exec: vi.fn(),
    prepare: vi.fn(() => ({ get, all: vi.fn(() => []), run: vi.fn() })),
    close: vi.fn(),
    get,
  };
});

vi.mock("../../src/mcp/db-loader.mts", () => ({
  SqliteConstructor: vi.fn(() => database),
}));

vi.mock("fs", async (importOriginal) => ({
  ...(await importOriginal<typeof import("fs")>()),
  mkdirSync: vi.fn(),
}));

vi.mock("os", () => ({
  homedir: () => "/home/testuser",
}));

const stateManager = await import("../../src/mcp/state-manager.mts");

afterAll(() => {
  stateManager.closeDb();
});

describe("MCP State Manager owned SQLite schema", () => {
  it("initializes the sessions table before querying its independently opened database", () => {
    expect(stateManager.getLatestSession()).toBeNull();
    expect(database.exec).toHaveBeenCalledTimes(1);
    expect(database.exec.mock.calls[0][0]).toContain("CREATE TABLE IF NOT EXISTS sessions");
    expect(database.exec.mock.invocationCallOrder[0]).toBeLessThan(
      database.prepare.mock.invocationCallOrder[0]
    );
  });
});
