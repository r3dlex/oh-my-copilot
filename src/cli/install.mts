import { spawnSync } from "child_process";
import { existsSync } from "fs";
import { mkdir, readFile, rename, writeFile } from "fs/promises";
import { homedir } from "os";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

interface CommandResult {
  error?: Error;
  status: number | null;
  stdout: string;
  stderr: string;
}

interface InstallDependencies {
  runCommand: (command: string, args: string[]) => CommandResult;
}

function resolvePackageRoot(): string {
  const moduleDirectory = dirname(fileURLToPath(import.meta.url));
  const candidates = [join(moduleDirectory, ".."), join(moduleDirectory, "..", "..")];
  const packageRoot = candidates.find((candidate) => existsSync(join(candidate, "plugin.json")));

  if (!packageRoot) {
    throw new Error("omp install: could not locate the packaged plugin manifest");
  }

  return packageRoot;
}

function runCommand(command: string, args: string[]): CommandResult {
  const result = spawnSync(command, args, {
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  return {
    error: result.error,
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

const defaultDependencies: InstallDependencies = { runCommand };

function defaultSettingsPath(): string {
  const copilotHome = process.env.COPILOT_HOME || join(homedir(), ".copilot");
  return join(copilotHome, "settings.json");
}

export async function runInstall(
  settingsPath = defaultSettingsPath(),
  dependencies: Partial<InstallDependencies> = {},
): Promise<void> {
  const pkgRoot = resolvePackageRoot();
  const installResult = (dependencies.runCommand ?? defaultDependencies.runCommand)("copilot", [
    "plugin",
    "install",
    pkgRoot,
  ]);

  if (installResult.error) {
    const missingCommand = "code" in installResult.error && installResult.error.code === "ENOENT";
    const detail = missingCommand
      ? "`copilot` was not found on PATH. Install GitHub Copilot CLI before running `omp install`."
      : installResult.error.message;
    throw new Error(`omp install: could not register the plugin: ${detail}`, {
      cause: installResult.error,
    });
  }

  if (installResult.status !== 0) {
    const detail = installResult.stderr.trim() || installResult.stdout.trim();
    throw new Error(
      `omp install: \`copilot plugin install\` failed with exit code ${installResult.status ?? "unknown"}${
        detail ? `: ${detail}` : ""
      }`,
    );
  }

  const statusLineCommand = join(pkgRoot, "bin", "omp-statusline.sh");
  const marketplacePath = pkgRoot;

  let existing: Record<string, unknown> = {};
  try {
    const raw = await readFile(settingsPath, "utf-8");
    const parsed: unknown = JSON.parse(raw);
    if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
      existing = parsed as Record<string, unknown>;
    }
  } catch { /* missing or invalid — start fresh */ }

  const existingPlugins =
    typeof existing.enabledPlugins === "object" &&
    existing.enabledPlugins !== null &&
    !Array.isArray(existing.enabledPlugins)
      ? (existing.enabledPlugins as Record<string, unknown>)
      : {};

  const existingMarketplaces =
    typeof existing.extraKnownMarketplaces === "object" &&
    existing.extraKnownMarketplaces !== null &&
    !Array.isArray(existing.extraKnownMarketplaces)
      ? (existing.extraKnownMarketplaces as Record<string, unknown>)
      : {};

  const merged = {
    ...existing,
    enabledPlugins: {
      ...existingPlugins,
      "oh-my-githubcopilot@oh-my-githubcopilot": true,
    },
    experimental: true,
    statusLine: { type: "command", command: statusLineCommand },
    extraKnownMarketplaces: {
      ...existingMarketplaces,
      "oh-my-githubcopilot": {
        source: { source: "directory", path: marketplacePath },
      },
    },
  };

  // Atomic write: tmp → rename (prevents partial write on crash/disk-full)
  const tmp = `${settingsPath}.tmp`;
  await mkdir(dirname(settingsPath), { recursive: true });
  await writeFile(tmp, JSON.stringify(merged, null, 2) + "\n", "utf-8");
  await rename(tmp, settingsPath);

  console.log(`omp install: registered ${pkgRoot} with Copilot CLI`);
  console.log(`omp install: wrote ${settingsPath}`);
  console.log(`  statusLine.command: ${statusLineCommand}`);
  console.log(`  marketplace path:   ${marketplacePath}`);
  console.log(`  plugin:             oh-my-githubcopilot@oh-my-githubcopilot`);
  console.log(`\nRestart Copilot CLI to activate OMP.`);
}
