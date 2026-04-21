/**
 * Launch-time update checks for the omp CLI companion.
 * Non-fatal, TTY-only, and throttled via ~/.omp/state/update-check.json.
 */

import { spawnSync } from "child_process";
import { mkdir, readFile, writeFile } from "fs/promises";
import { homedir } from "os";
import { dirname, join } from "path";
import { createInterface } from "node:readline/promises";

export interface UpdateState {
  last_checked_at: string;
  last_seen_latest?: string;
}

export interface UpdateCheckFlags {
  help?: boolean;
  version?: boolean;
}

export interface UpdateCheckContext {
  cwd: string;
  packageName: string;
  currentVersion: string;
  subcommand: string;
  flags?: UpdateCheckFlags;
}

interface LatestPackageInfo {
  version?: string;
}

interface ParsedSemver {
  major: number;
  minor: number;
  patch: number;
  prerelease: string | null;
}

interface UpdateDependencies {
  nowMs: () => number;
  readUpdateState: (statePath: string) => Promise<UpdateState | null>;
  writeUpdateState: (statePath: string, state: UpdateState) => Promise<void>;
  fetchLatestVersion: (packageName: string) => Promise<string | null>;
  askYesNo: (question: string) => Promise<boolean>;
  runGlobalUpdate: (packageName: string, cwd: string) => { ok: boolean; stderr: string };
}

const CHECK_INTERVAL_MS = 12 * 60 * 60 * 1000; // 12h
const PROMPTABLE_SUBCOMMANDS = new Set(["hud", "psm", "bench"]);
const DISABLED_AUTO_UPDATE_VALUES = new Set(["0", "false", "no", "off"]);
const ENABLED_DISABLE_FLAG_VALUES = new Set(["1", "true", "yes", "on"]);

function parseSemver(version: string): ParsedSemver | null {
  const match = version.trim().match(/^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/);
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] ?? null,
  };
}

export function isNewerVersion(current: string, latest: string): boolean {
  const currentVersion = parseSemver(current);
  const latestVersion = parseSemver(latest);
  if (!currentVersion || !latestVersion) return false;

  if (latestVersion.major !== currentVersion.major) return latestVersion.major > currentVersion.major;
  if (latestVersion.minor !== currentVersion.minor) return latestVersion.minor > currentVersion.minor;
  if (latestVersion.patch !== currentVersion.patch) return latestVersion.patch > currentVersion.patch;

  // Stable release of the same numeric version is newer than a prerelease.
  if (currentVersion.prerelease && !latestVersion.prerelease) return true;
  return false;
}

export function shouldCheckForUpdates(
  nowMs: number,
  state: UpdateState | null,
  intervalMs = CHECK_INTERVAL_MS
): boolean {
  if (!state?.last_checked_at) return true;
  const lastCheckedAt = Date.parse(state.last_checked_at);
  if (!Number.isFinite(lastCheckedAt)) return true;
  return nowMs - lastCheckedAt >= intervalMs;
}

export function isAutoUpdateDisabled(env: NodeJS.ProcessEnv = process.env): boolean {
  const autoUpdate = env["OMP_AUTO_UPDATE"]?.trim().toLowerCase();
  if (autoUpdate && DISABLED_AUTO_UPDATE_VALUES.has(autoUpdate)) return true;

  const disableCheck = env["OMP_DISABLE_UPDATE_CHECK"]?.trim().toLowerCase();
  if (disableCheck && ENABLED_DISABLE_FLAG_VALUES.has(disableCheck)) return true;

  return false;
}

export function shouldSkipUpdatePrompt(subcommand: string, flags: UpdateCheckFlags = {}): boolean {
  if (flags.help || flags.version) return true;
  return !PROMPTABLE_SUBCOMMANDS.has(subcommand);
}

function updateStatePath(homeDir: string): string {
  return join(homeDir, ".omp", "state", "update-check.json");
}

async function readCachedUpdateState(statePath: string): Promise<UpdateState | null> {
  try {
    const raw = await readFile(statePath, "utf-8");
    return JSON.parse(raw) as UpdateState;
  } catch {
    return null;
  }
}

async function writeCachedUpdateState(statePath: string, state: UpdateState): Promise<void> {
  await mkdir(dirname(statePath), { recursive: true });
  await writeFile(statePath, JSON.stringify(state, null, 2), "utf-8");
}

async function fetchLatestVersionFromNpm(packageName: string, timeoutMs = 3500): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const url = `https://registry.npmjs.org/${encodeURIComponent(packageName)}/latest`;
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return null;
    const payload = (await response.json()) as LatestPackageInfo;
    return typeof payload.version === "string" ? payload.version : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function runNpmGlobalUpdate(packageName: string, cwd: string): { ok: boolean; stderr: string } {
  const result = spawnSync("npm", ["install", "-g", `${packageName}@latest`], {
    encoding: "utf-8",
    stdio: ["ignore", "ignore", "pipe"],
    timeout: 120000,
    windowsHide: true,
    cwd,
  });

  if (result.error) return { ok: false, stderr: result.error.message };
  if (result.status !== 0) {
    return { ok: false, stderr: (result.stderr || "").trim() || `npm exited ${result.status}` };
  }
  return { ok: true, stderr: "" };
}

async function askYesNo(question: string): Promise<boolean> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) return false;
  const readline = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = (await readline.question(question)).trim().toLowerCase();
    return answer === "" || answer === "y" || answer === "yes";
  } finally {
    readline.close();
  }
}

const defaultDependencies: UpdateDependencies = {
  nowMs: () => Date.now(),
  readUpdateState: readCachedUpdateState,
  writeUpdateState: writeCachedUpdateState,
  fetchLatestVersion: fetchLatestVersionFromNpm,
  askYesNo,
  runGlobalUpdate: runNpmGlobalUpdate,
};

export async function maybeCheckAndPromptUpdate(
  context: UpdateCheckContext,
  dependencies: Partial<UpdateDependencies> = {}
): Promise<void> {
  const updateDependencies: UpdateDependencies = {
    ...defaultDependencies,
    ...dependencies,
  };

  try {
    if (isAutoUpdateDisabled()) return;
    if (!process.stdin.isTTY || !process.stdout.isTTY) return;
    if (shouldSkipUpdatePrompt(context.subcommand, context.flags)) return;

    const statePath = updateStatePath(process.env["HOME"] || homedir());
    const now = updateDependencies.nowMs();
    const state = await updateDependencies.readUpdateState(statePath);

    if (!shouldCheckForUpdates(now, state)) return;

    const latestVersion = await updateDependencies.fetchLatestVersion(context.packageName);
    await updateDependencies.writeUpdateState(statePath, {
      last_checked_at: new Date(now).toISOString(),
      last_seen_latest: latestVersion || state?.last_seen_latest,
    });

    if (!latestVersion || !isNewerVersion(context.currentVersion, latestVersion)) return;

    const approved = await updateDependencies.askYesNo(
      `[omp] Update available: v${context.currentVersion} → v${latestVersion}. Update now? [Y/n] `
    );
    if (!approved) return;

    console.log(`[omp] Running: npm install -g ${context.packageName}@latest`);
    const result = updateDependencies.runGlobalUpdate(context.packageName, context.cwd);

    if (result.ok) {
      console.log(`[omp] Updated to v${latestVersion}. Restart this shell to load the new CLI.`);
    } else {
      console.log(`[omp] Update failed. Run manually: npm install -g ${context.packageName}@latest`);
    }
  } catch {
    // Update checks should never block normal CLI flows.
  }
}
