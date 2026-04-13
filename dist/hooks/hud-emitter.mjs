// src/hooks/hud-emitter.mts
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { createRequire } from "module";
import { fileURLToPath } from "url";
var _require = createRequire(import.meta.url);
var { version: PKG_VERSION } = _require("../../package.json");
function getStatePath(sessionId) {
  const base = join(homedir(), ".omp", "state");
  if (sessionId) {
    return join(base, "sessions", sessionId, "session.json");
  }
  return join(base, "session.json");
}
function getHudLinePath() {
  return join(homedir(), ".omp", "hud.line");
}
function ensureDir(path) {
  mkdirSync(path.substring(0, path.lastIndexOf("/")), { recursive: true });
}
function formatAge(startedAt) {
  const elapsed = Date.now() - startedAt;
  const mins = Math.floor(elapsed / 6e4);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h${remainingMins}m`;
}
function formatTokens(tokens) {
  if (tokens >= 1e6) return `~${(tokens / 1e6).toFixed(1)}M`;
  if (tokens >= 1e3) return `~${(tokens / 1e3).toFixed(1)}k`;
  return `~${tokens}`;
}
function buildHudLine(state) {
  const age = formatAge(state.started_at);
  const tokens = formatTokens(state.tokens_estimated);
  const ctx = state.context_pct;
  const tools = state.tools_used.length;
  const skills = state.skills_used.length;
  const agents = state.agents_used.length;
  const mode = state.active_mode || "-";
  const model = state.model || "sonnet";
  return `OMP v${state.version} | ${model} | tkn: ${tokens}/${state.token_budget} | ctx: ${ctx}% | session: ${age} | tools: ${tools} | skills: ${skills} | agents: ${agents} | mode: ${mode}`;
}
function processSessionStart(input) {
  const start = Date.now();
  const log = [];
  const sessionId = input.session_id || "default";
  const state = {
    version: PKG_VERSION,
    session_id: sessionId,
    started_at: Date.now(),
    model: input.model || "claude-sonnet-4.5",
    tokens_estimated: 0,
    token_budget: 2e5,
    context_pct: 0,
    tools_used: [],
    skills_used: [],
    agents_used: [],
    active_mode: null
  };
  const statePath = getStatePath(sessionId);
  ensureDir(statePath);
  writeFileSync(statePath, JSON.stringify(state), "utf-8");
  log.push(`Session initialized: ${sessionId}`);
  const hudLine = buildHudLine(state);
  const hudPath = getHudLinePath();
  ensureDir(hudPath);
  writeFileSync(hudPath, hudLine, "utf-8");
  log.push(`HUD line written: ${hudLine}`);
  return {
    status: "ok",
    latencyMs: Date.now() - start,
    mutations: [
      {
        type: "emit_hud",
        hudEmit: {
          sessionId,
          activeMode: null,
          contextPct: 0,
          tokensUsed: 0,
          tokensTotal: 2e5,
          agentsActive: [],
          lastAgent: "-",
          lastOutput: "",
          taskProgress: 0
        }
      }
    ],
    log
  };
}
function processPostToolUse(input) {
  const start = Date.now();
  const log = [];
  const statePath = getStatePath(input.session_id);
  let state;
  try {
    const raw = JSON.parse(readFileSync(statePath, "utf-8"));
    state = {
      ...raw,
      tools_used: Array.isArray(raw.tools_used) ? raw.tools_used : [],
      skills_used: Array.isArray(raw.skills_used) ? raw.skills_used : [],
      agents_used: Array.isArray(raw.agents_used) ? raw.agents_used : []
    };
  } catch {
    return processSessionStart(input);
  }
  if (input.tool_name && !state.tools_used.includes(input.tool_name)) {
    state.tools_used.push(input.tool_name);
  }
  const hudLine = buildHudLine(state);
  const hudPath = getHudLinePath();
  ensureDir(hudPath);
  writeFileSync(hudPath, hudLine, "utf-8");
  log.push(`HUD updated: ${hudLine}`);
  writeFileSync(statePath, JSON.stringify(state), "utf-8");
  return {
    status: "ok",
    latencyMs: Date.now() - start,
    mutations: [
      {
        type: "emit_hud",
        hudEmit: {
          sessionId: state.session_id,
          activeMode: state.active_mode,
          contextPct: state.context_pct,
          tokensUsed: state.tokens_estimated,
          tokensTotal: state.token_budget,
          agentsActive: state.agents_used,
          lastAgent: state.agents_used[state.agents_used.length - 1] || "-",
          lastOutput: "",
          taskProgress: 0
        }
      }
    ],
    log
  };
}
function processHook(input) {
  if (input.hook_type === "SessionStart") {
    return processSessionStart(input);
  }
  if (input.hook_type === "PostToolUse") {
    return processPostToolUse(input);
  }
  return {
    status: "skip",
    latencyMs: 0,
    mutations: [],
    log: ["Unknown hook type"]
  };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const input = JSON.parse(await readStdin());
  const output = processHook(input);
  console.log(JSON.stringify(output));
}
async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return chunks.join("");
}
export {
  processHook
};
//# sourceMappingURL=hud-emitter.mjs.map
