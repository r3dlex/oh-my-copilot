#!/usr/bin/env node
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/hud/renderer.mts
function formatAge(startedAt) {
  const elapsed = Date.now() - startedAt;
  const mins = Math.floor(elapsed / 6e4);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h${remainingMins}m`;
}
function formatTokens(tokens) {
  if (tokens >= 1e6) return `${(tokens / 1e6).toFixed(1)}M`;
  if (tokens >= 1e3) return `${(tokens / 1e3).toFixed(1)}k`;
  return `${tokens}`;
}
function ctxColor(pct) {
  if (pct < 60) return "\x1B[32m";
  if (pct < 85) return "\x1B[33m";
  return "\x1B[31m";
}
function reset() {
  return "\x1B[0m";
}
function renderAnsi(state) {
  const age = formatAge(state.startedAt);
  const tokens = formatTokens(state.tokensUsed);
  const ctx = state.contextPct;
  const mode = state.activeMode || "-";
  const model = state.activeModel || "sonnet";
  const icon = STATUS_ICONS[state.status] || "\u25CF";
  const ctxClr = ctxColor(ctx);
  const ctxStr = `${ctxClr}ctx:${ctx}%${reset()}`;
  const tokenStr = `tok:~${tokens}/${state.tokensTotal}`;
  const modeStr = mode === "-" ? "-" : `\x1B[36m${mode}${reset()}`;
  const reqWarning = state.warningActive ? " !!" : "";
  const reqStr = `req:${state.premiumRequests ?? 0}/${state.premiumRequestsTotal ?? 1500}${reqWarning}`;
  return `[OMP v${state.version}] ${modeStr} | ${model} | ${ctxStr} | ${tokenStr} | ${reqStr} | ${age} | tools:${state.toolsUsed?.size || 0}/${state.toolsTotal ?? 13} | skills:${state.skillsUsed?.size || 0}/${state.skillsTotal ?? 25} | agents:${state.cumulativeAgentsUsed}/${state.agentsTotal ?? 23} | ${icon} ${state.status}`;
}
function renderPlain(state) {
  const age = formatAge(state.startedAt);
  const tokens = formatTokens(state.tokensUsed);
  const ctx = state.contextPct;
  const mode = state.activeMode || "-";
  const model = state.activeModel || "sonnet";
  const reqWarningPlain = state.warningActive ? " !!" : "";
  const reqStrPlain = `req:${state.premiumRequests ?? 0}/${state.premiumRequestsTotal ?? 1500}${reqWarningPlain}`;
  return `[OMP v${state.version}] ${mode} | ${model} | ctx:${ctx}% | tok:~${tokens}/${state.tokensTotal} | ${reqStrPlain} | ${age} | tools:${state.toolsUsed?.size || 0}/${state.toolsTotal ?? 13} | skills:${state.skillsUsed?.size || 0}/${state.skillsTotal ?? 25} | agents:${state.cumulativeAgentsUsed}/${state.agentsTotal ?? 23} | ${state.status}`;
}
var STATUS_ICONS;
var init_renderer = __esm({
  "src/hud/renderer.mts"() {
    "use strict";
    STATUS_ICONS = {
      idle: "\u25CB",
      running: "\u25CF",
      waiting: "\u25F7",
      complete: "\u2713",
      error: "\u2717",
      eco: "\u26A1"
    };
  }
});

// src/hud/statusline.mts
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import { homedir } from "os";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
function getStatuslinePaths(home = process.env["HOME"] || homedir()) {
  const ompDir = join(home, ".omp");
  const hudDir = join(ompDir, "hud");
  return {
    legacyLinePath: join(ompDir, "hud.line"),
    hudDir,
    statusJsonPath: join(hudDir, "status.json"),
    displayPath: join(hudDir, "display.txt"),
    tmuxSegmentPath: join(hudDir, "tmux-segment.sh")
  };
}
function ensureParent(filePath) {
  mkdirSync(dirname(filePath), { recursive: true });
}
function writeAtomic(filePath, content, mode) {
  ensureParent(filePath);
  const tempPath = `${filePath}.tmp`;
  writeFileSync(tempPath, content, mode === void 0 ? "utf-8" : { encoding: "utf-8", mode });
  renameSync(tempPath, filePath);
}
function normalizeStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => typeof item === "string");
}
function serializeHudState(state) {
  return {
    ...state,
    toolsUsed: Array.from(state.toolsUsed),
    skillsUsed: Array.from(state.skillsUsed)
  };
}
function deserializeHudState(raw) {
  if (!raw || typeof raw !== "object") return null;
  const value = raw;
  const toolsUsed = new Set(normalizeStringArray(value.toolsUsed));
  const skillsUsed = new Set(normalizeStringArray(value.skillsUsed));
  const agentsActive = normalizeStringArray(value.agentsActive);
  const status = typeof value.status === "string" ? value.status : "idle";
  return {
    sessionId: typeof value.sessionId === "string" ? value.sessionId : "default",
    activeMode: typeof value.activeMode === "string" ? value.activeMode : null,
    activeModel: typeof value.activeModel === "string" ? value.activeModel : "sonnet",
    contextPct: typeof value.contextPct === "number" ? value.contextPct : 0,
    tokensUsed: typeof value.tokensUsed === "number" ? value.tokensUsed : 0,
    tokensTotal: typeof value.tokensTotal === "number" ? value.tokensTotal : DEFAULT_TOKEN_BUDGET,
    agentsActive,
    lastAgent: typeof value.lastAgent === "string" ? value.lastAgent : agentsActive.at(-1) ?? "-",
    lastOutput: typeof value.lastOutput === "string" ? value.lastOutput : "",
    taskProgress: typeof value.taskProgress === "number" ? value.taskProgress : 0,
    startedAt: typeof value.startedAt === "number" ? value.startedAt : Date.now(),
    updatedAt: typeof value.updatedAt === "number" ? value.updatedAt : Date.now(),
    version: typeof value.version === "string" ? value.version : DEFAULT_VERSION,
    status,
    sessionDurationMs: typeof value.sessionDurationMs === "number" ? value.sessionDurationMs : 0,
    cumulativeAgentsUsed: typeof value.cumulativeAgentsUsed === "number" ? value.cumulativeAgentsUsed : agentsActive.length,
    toolsUsed,
    skillsUsed,
    toolsTotal: typeof value.toolsTotal === "number" ? value.toolsTotal : 13,
    skillsTotal: typeof value.skillsTotal === "number" ? value.skillsTotal : 25,
    agentsTotal: typeof value.agentsTotal === "number" ? value.agentsTotal : 23,
    premiumRequests: typeof value.premiumRequests === "number" ? value.premiumRequests : 0,
    premiumRequestsTotal: typeof value.premiumRequestsTotal === "number" ? value.premiumRequestsTotal : DEFAULT_PREMIUM_REQUESTS_TOTAL,
    warningActive: typeof value.warningActive === "boolean" ? value.warningActive : false
  };
}
function buildHudState(snapshot, now = Date.now()) {
  const startedAt = snapshot.started_at ?? now;
  const updatedAt = snapshot.updated_at ?? now;
  const toolsUsed = new Set(normalizeStringArray(snapshot.tools_used));
  const skillsUsed = new Set(normalizeStringArray(snapshot.skills_used));
  const agentsActive = normalizeStringArray(snapshot.agents_used);
  return {
    sessionId: snapshot.session_id ?? "default",
    activeMode: snapshot.active_mode ?? null,
    activeModel: snapshot.model ?? "sonnet",
    contextPct: snapshot.context_pct ?? 0,
    tokensUsed: snapshot.tokens_estimated ?? 0,
    tokensTotal: snapshot.token_budget ?? DEFAULT_TOKEN_BUDGET,
    agentsActive,
    lastAgent: agentsActive.at(-1) ?? "-",
    lastOutput: snapshot.last_output ?? "",
    taskProgress: snapshot.task_progress ?? 0,
    startedAt,
    updatedAt,
    version: snapshot.version ?? DEFAULT_VERSION,
    status: snapshot.status ?? "idle",
    sessionDurationMs: Math.max(0, updatedAt - startedAt),
    cumulativeAgentsUsed: agentsActive.length,
    toolsUsed,
    skillsUsed,
    toolsTotal: 13,
    skillsTotal: 25,
    agentsTotal: 23,
    premiumRequests: snapshot.premium_requests ?? 0,
    premiumRequestsTotal: snapshot.premium_requests_total ?? DEFAULT_PREMIUM_REQUESTS_TOTAL,
    warningActive: snapshot.warning_active ?? false
  };
}
function writeHudArtifacts(snapshot, paths = getStatuslinePaths()) {
  const state = buildHudState(snapshot);
  const line = renderPlain(state);
  const serializedState = `${JSON.stringify(serializeHudState(state), null, 2)}
`;
  writeAtomic(paths.statusJsonPath, serializedState);
  writeAtomic(paths.displayPath, `${line}
`);
  writeAtomic(paths.tmuxSegmentPath, `${line}
`, 493);
  writeAtomic(paths.legacyLinePath, `${line}
`);
  return { line, state, paths };
}
function readStatusline(paths = getStatuslinePaths()) {
  try {
    const line = readFileSync(paths.displayPath, "utf-8").trim();
    if (line) return line;
  } catch {
  }
  try {
    const parsed = JSON.parse(readFileSync(paths.statusJsonPath, "utf-8"));
    const state = deserializeHudState(parsed);
    if (state) return renderPlain(state);
  } catch {
  }
  try {
    const line = readFileSync(paths.legacyLinePath, "utf-8").trim();
    if (line) return line;
  } catch {
  }
  return DEFAULT_STATUSLINE;
}
var DEFAULT_VERSION, DEFAULT_STATUSLINE, DEFAULT_TOKEN_BUDGET, DEFAULT_PREMIUM_REQUESTS_TOTAL;
var init_statusline = __esm({
  "src/hud/statusline.mts"() {
    "use strict";
    init_renderer();
    DEFAULT_VERSION = "0.0.0";
    DEFAULT_STATUSLINE = "OMP | hud: no active session";
    DEFAULT_TOKEN_BUDGET = 2e5;
    DEFAULT_PREMIUM_REQUESTS_TOTAL = 1500;
    if (process.argv[1] === fileURLToPath(import.meta.url)) {
      console.log(readStatusline());
    }
  }
});

// src/hud/watch.mts
var watch_exports = {};
__export(watch_exports, {
  runHudWatch: () => runHudWatch
});
import { readFileSync as readFileSync2 } from "fs";
import { homedir as homedir2 } from "os";
import { join as join2 } from "path";
function readSnapshot() {
  try {
    const raw = readFileSync2(STATE_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    return parsed;
  } catch {
    return null;
  }
}
function tick(paths = getStatuslinePaths()) {
  const snapshot = readSnapshot();
  if (!snapshot) return;
  const now = Date.now();
  const state = buildHudState(snapshot, now);
  writeHudArtifacts(snapshot, paths);
  process.stdout.write("\x1B[2J\x1B[H" + renderAnsi(state) + "\x1B[K\n\x1B[J");
}
function runHudWatch() {
  const intervalMs = Math.max(
    500,
    parseInt(process.env["OMP_HUD_INTERVAL"] ?? "", 10) || DEFAULT_INTERVAL_MS
  );
  const paths = getStatuslinePaths();
  process.stdout.write("\x1B[?25l");
  try {
    tick(paths);
  } catch {
  }
  const timer = setInterval(() => {
    try {
      tick(paths);
    } catch {
    }
  }, intervalMs);
  const stop = () => {
    clearInterval(timer);
    process.stdout.write("\x1B[?25h\x1B[2J\x1B[H");
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}
var DEFAULT_INTERVAL_MS, STATE_PATH;
var init_watch = __esm({
  "src/hud/watch.mts"() {
    "use strict";
    init_statusline();
    init_renderer();
    DEFAULT_INTERVAL_MS = 2e3;
    STATE_PATH = join2(homedir2(), ".omp", "state", "session.json");
  }
});

// src/index.mts
import { parseArgs } from "util";
import { createRequire } from "module";
var _require = createRequire(import.meta.url);
var { version: PKG_VERSION, name: PKG_NAME } = _require("../package.json");
var { positionals, values: flags } = parseArgs({
  args: process.argv.slice(2),
  options: {
    help: { type: "boolean", default: false },
    version: { type: "boolean", default: false },
    watch: { type: "boolean", default: false }
  },
  allowPositionals: true
});
var subcommand = positionals[0] || "hud";
async function main() {
  switch (subcommand) {
    case "hud":
      if (flags.watch) {
        const { runHudWatch: runHudWatch2 } = await Promise.resolve().then(() => (init_watch(), watch_exports));
        runHudWatch2();
      } else {
        await printHud();
      }
      break;
    case "version":
      console.log(`${PKG_NAME} v${PKG_VERSION}`);
      break;
    case "psm":
      await runPsm(positionals.slice(1));
      break;
    case "bench":
      await runBench(positionals.slice(1));
      break;
    default:
      console.error(`Unknown subcommand: ${subcommand}`);
      console.error("Usage: omp [hud|version|psm|bench]");
      process.exit(1);
  }
}
async function printHud() {
  try {
    const { readFileSync: readFileSync3 } = await import("fs");
    const { join: join3 } = await import("path");
    const { homedir: homedir3 } = await import("os");
    const hudPath = join3(homedir3(), ".omp", "hud.line");
    const line = readFileSync3(hudPath, "utf-8").trim();
    console.log(line);
  } catch {
    console.log(`OMP v${PKG_VERSION} | hud: no active session`);
  }
}
async function runPsm(_args) {
  console.log("PSM commands:");
  console.log("  /omp:psm create <name>   Create isolated worktree session");
  console.log("  /omp:psm list           List active sessions");
  console.log("  /omp:psm switch <name>  Switch to session");
  console.log("  /omp:psm destroy <name> Destroy session");
}
async function runBench(_args) {
  console.log("SWE-bench requires Node.js subprocess with Python evaluation harness.");
  console.log("Usage: /omp:swe-bench --suite lite --compare baseline");
}
main().catch((err) => {
  console.error(err);
  process.exit(1);
});
//# sourceMappingURL=omp.mjs.map
