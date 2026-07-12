/**
 * File-system seam tests
 * Spec: docs/specifications/ACTIVE/file-system-seam.md
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "fs";
import { join } from "path";
import { homedir, tmpdir } from "os";
import {
  ensureDir,
  getConfigPath,
  getHudPaths,
  getPsmDbPath,
  getSessionIndexPath,
  getSessionStatePath,
  getSessionsDir,
  getSpendingPath,
  getStateDir,
  readJsonSafe,
  writeFileAtomic,
  writeJsonAtomic,
} from "../../src/utils/file-system.mts";

describe("file-system seam", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "omp-fs-test-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  describe("readJsonSafe", () => {
    it("returns fallback when file is missing, without invoking onMalformed", () => {
      const onMalformed = vi.fn();
      const result = readJsonSafe(join(tmpDir, "missing.json"), { def: true }, { onMalformed });
      expect(result).toEqual({ def: true });
      expect(onMalformed).not.toHaveBeenCalled();
    });

    it("returns fallback and invokes onMalformed for malformed JSON", () => {
      const path = join(tmpDir, "bad.json");
      writeFileSync(path, "{ not valid json");
      const onMalformed = vi.fn();
      const result = readJsonSafe(path, [], { onMalformed });
      expect(result).toEqual([]);
      expect(onMalformed).toHaveBeenCalledWith(path, expect.anything());
    });

    it("parses and returns valid JSON", () => {
      const path = join(tmpDir, "good.json");
      writeFileSync(path, JSON.stringify({ key: "value", n: 42 }));
      const result = readJsonSafe<{ key: string; n: number } | null>(path, null);
      expect(result).toEqual({ key: "value", n: 42 });
    });

    it("never throws for malformed content without onMalformed", () => {
      const path = join(tmpDir, "bad2.json");
      writeFileSync(path, "not-json");
      expect(() => readJsonSafe(path, null)).not.toThrow();
      expect(readJsonSafe(path, null)).toBeNull();
    });
  });

  describe("writeJsonAtomic", () => {
    it("creates the file with pretty-printed JSON", () => {
      const path = join(tmpDir, "out.json");
      writeJsonAtomic(path, { a: 1 });
      const raw = readFileSync(path, "utf-8");
      expect(raw).toBe(JSON.stringify({ a: 1 }, null, 2));
      expect(JSON.parse(raw)).toEqual({ a: 1 });
    });

    it("overwrites an existing file", () => {
      const path = join(tmpDir, "out.json");
      writeJsonAtomic(path, { version: 1 });
      writeJsonAtomic(path, { version: 2 });
      expect(readJsonSafe<{ version: number } | null>(path, null)).toEqual({ version: 2 });
    });

    it("creates nested parent directories", () => {
      const path = join(tmpDir, "deep", "nested", "dir", "state.json");
      writeJsonAtomic(path, [1, 2, 3]);
      expect(readJsonSafe<number[]>(path, [])).toEqual([1, 2, 3]);
    });

    it("leaves no temp file behind", () => {
      const path = join(tmpDir, "clean.json");
      writeJsonAtomic(path, {});
      expect(existsSync(`${path}.tmp`)).toBe(false);
      expect(existsSync(path)).toBe(true);
    });
  });

  describe("writeFileAtomic", () => {
    it("writes raw content and applies the given mode", () => {
      const path = join(tmpDir, "segment.sh");
      writeFileAtomic(path, "echo hud\n", 0o755);
      expect(readFileSync(path, "utf-8")).toBe("echo hud\n");
      expect(statSync(path).mode & 0o777).toBe(0o755);
    });
  });

  describe("ensureDir", () => {
    it("creates directories recursively and is idempotent", () => {
      const dir = join(tmpDir, "a", "b", "c");
      ensureDir(dir);
      ensureDir(dir);
      expect(existsSync(dir)).toBe(true);
    });
  });

  describe("path factories", () => {
    it("getStateDir points at ~/.omp/state", () => {
      expect(getStateDir()).toBe(join(homedir(), ".omp", "state"));
    });

    it("getConfigPath resolves global under homedir and local under cwd", () => {
      vi.spyOn(process, "cwd").mockReturnValue("/work/project");
      expect(getConfigPath("global")).toBe(join(homedir(), ".omp", "config.json"));
      expect(getConfigPath("local")).toBe(join("/work/project", ".omp", "config.json"));
    });

    it("state file factories resolve under the state dir", () => {
      expect(getSpendingPath()).toBe(join(getStateDir(), "spending-monthly.json"));
      expect(getSessionIndexPath()).toBe(join(getStateDir(), "sessions.json"));
      expect(getSessionStatePath()).toBe(join(getStateDir(), "session-states.json"));
      expect(getSessionStatePath()).not.toBe(getSessionIndexPath());
      expect(getSessionsDir()).toBe(join(getStateDir(), "sessions"));
      expect(getPsmDbPath()).toBe(join(getStateDir(), "omp.db"));
    });

    it("getHudPaths resolves all HUD artifacts under <home>/.omp", () => {
      const paths = getHudPaths("/custom/home");
      expect(paths.legacyLinePath).toBe(join("/custom/home", ".omp", "hud.line"));
      expect(paths.hudDir).toBe(join("/custom/home", ".omp", "hud"));
      expect(paths.statusJsonPath).toBe(join(paths.hudDir, "status.json"));
      expect(paths.displayPath).toBe(join(paths.hudDir, "display.txt"));
      expect(paths.tmuxSegmentPath).toBe(join(paths.hudDir, "tmux-segment.sh"));
    });
  });
});
