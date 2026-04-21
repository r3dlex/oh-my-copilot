import { mkdtemp, readFile, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  isAutoUpdateDisabled,
  isNewerVersion,
  maybeCheckAndPromptUpdate,
  shouldCheckForUpdates,
  shouldSkipUpdatePrompt,
  type UpdateCheckContext,
} from "../../src/cli/update.mts";

const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

async function withInteractiveTty(run: () => Promise<void>): Promise<void> {
  const originalStdinTty = process.stdin.isTTY;
  const originalStdoutTty = process.stdout.isTTY;

  Object.defineProperty(process.stdin, "isTTY", { configurable: true, value: true });
  Object.defineProperty(process.stdout, "isTTY", { configurable: true, value: true });

  try {
    await run();
  } finally {
    Object.defineProperty(process.stdin, "isTTY", { configurable: true, value: originalStdinTty });
    Object.defineProperty(process.stdout, "isTTY", { configurable: true, value: originalStdoutTty });
  }
}

async function withTempHome(run: (home: string) => Promise<void>): Promise<void> {
  const home = await mkdtemp(join(tmpdir(), "omp-update-"));
  const originalHome = process.env["HOME"];
  process.env["HOME"] = home;
  try {
    await run(home);
  } finally {
    if (originalHome === undefined) delete process.env["HOME"];
    else process.env["HOME"] = originalHome;
    await rm(home, { recursive: true, force: true });
  }
}

function createContext(overrides: Partial<UpdateCheckContext> = {}): UpdateCheckContext {
  return {
    cwd: process.cwd(),
    packageName: "oh-my-githubcopilot",
    currentVersion: "1.5.8",
    subcommand: "hud",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env["OMP_AUTO_UPDATE"];
  delete process.env["OMP_DISABLE_UPDATE_CHECK"];
});

describe("isNewerVersion", () => {
  it("detects patch/minor/major upgrades", () => {
    expect(isNewerVersion("1.5.8", "1.5.9")).toBe(true);
    expect(isNewerVersion("1.5.8", "1.6.0")).toBe(true);
    expect(isNewerVersion("1.5.8", "2.0.0")).toBe(true);
  });

  it("handles prerelease-to-stable updates", () => {
    expect(isNewerVersion("1.5.8-alpha.1", "1.5.8")).toBe(true);
    expect(isNewerVersion("1.5.8", "1.5.8-alpha.1")).toBe(false);
  });
});

describe("update check helpers", () => {
  it("respects disable env vars and low-value command filtering", () => {
    expect(shouldSkipUpdatePrompt("version")).toBe(true);
    expect(shouldSkipUpdatePrompt("hud")).toBe(false);
    expect(shouldSkipUpdatePrompt("hud", { help: true })).toBe(true);

    process.env["OMP_AUTO_UPDATE"] = "0";
    expect(isAutoUpdateDisabled()).toBe(true);
    delete process.env["OMP_AUTO_UPDATE"];

    process.env["OMP_DISABLE_UPDATE_CHECK"] = "true";
    expect(isAutoUpdateDisabled()).toBe(true);
  });

  it("honors TTL state when deciding whether to re-check", () => {
    const now = Date.now();
    expect(shouldCheckForUpdates(now, null)).toBe(true);
    expect(shouldCheckForUpdates(now, { last_checked_at: new Date(now).toISOString() })).toBe(false);
  });
});

describe("maybeCheckAndPromptUpdate", () => {
  it("prompts and runs npm update when a newer version is approved", async () => {
    let updateRuns = 0;
    let promptRuns = 0;

    await withTempHome(async (home) => {
      await withInteractiveTty(async () => {
        await maybeCheckAndPromptUpdate(createContext(), {
          fetchLatestVersion: async () => "1.5.9",
          askYesNo: async () => {
            promptRuns += 1;
            return true;
          },
          runGlobalUpdate: () => {
            updateRuns += 1;
            return { ok: true, stderr: "" };
          },
        });
      });

      const statePath = join(home, ".omp", "state", "update-check.json");
      const state = JSON.parse(await readFile(statePath, "utf-8")) as { last_seen_latest?: string };
      expect(state.last_seen_latest).toBe("1.5.9");
    });

    expect(promptRuns).toBe(1);
    expect(updateRuns).toBe(1);
    expect(consoleLog).toHaveBeenCalledWith("[omp] Running: npm install -g oh-my-githubcopilot@latest");
    expect(consoleLog).toHaveBeenCalledWith("[omp] Updated to v1.5.9. Restart this shell to load the new CLI.");
  });

  it("skips duplicate checks inside the TTL window", async () => {
    let fetchCalls = 0;

    await withTempHome(async () => {
      await withInteractiveTty(async () => {
        const dependencies = {
          fetchLatestVersion: async () => {
            fetchCalls += 1;
            return "1.6.0";
          },
          askYesNo: async () => false,
          runGlobalUpdate: () => ({ ok: true, stderr: "" }),
        };

        await maybeCheckAndPromptUpdate(createContext(), dependencies);
        await maybeCheckAndPromptUpdate(createContext(), dependencies);
      });
    });

    expect(fetchCalls).toBe(1);
  });

  it("skips checks for low-value commands and when disabled", async () => {
    let fetchCalls = 0;
    process.env["OMP_AUTO_UPDATE"] = "0";

    await withTempHome(async () => {
      await withInteractiveTty(async () => {
        await maybeCheckAndPromptUpdate(createContext({ subcommand: "version" }), {
          fetchLatestVersion: async () => {
            fetchCalls += 1;
            return "2.0.0";
          },
        });
      });
    });

    expect(fetchCalls).toBe(0);
  });
});
