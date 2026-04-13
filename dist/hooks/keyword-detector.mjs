// src/hooks/keyword-detector.mts
import { fileURLToPath } from "url";
var KEYWORD_MAP = {
  "autopilot:": "autopilot",
  "ralph:": "ralph",
  "ulw:": "ultrawork",
  "team:": "team",
  "eco:": "ecomode",
  "swarm:": "swarm",
  "pipeline:": "pipeline",
  "plan:": "omp-plan",
  // Aliases (shortcut commands)
  "setup:": "setup",
  "ralplan:": "ralplan",
  "ultraqa:": "ultraqa",
  "mcp:": "mcp-setup",
  "ultrawork:": "ultrawork",
  "ecomode:": "ecomode",
  // Phase 1.1 skill stubs (19 total from plugin.json)
  "/autopilot": "autopilot",
  "/ralph": "ralph",
  "/ulw": "ultrawork",
  "/team": "team",
  "/eco": "ecomode",
  "/swarm": "swarm",
  "/pipeline": "pipeline",
  "/deep-interview": "deep-interview",
  "/omp-plan": "omp-plan",
  "/omp-setup": "omp-setup",
  "/hud": "hud",
  "/wiki": "wiki",
  "/learner": "learner",
  "/note": "note",
  "/trace": "trace",
  "/release": "release",
  "/configure-notifications": "configure-notifications",
  "/psm": "psm",
  "/swe-bench": "swe-bench",
  // v1.2 graph provider + spending skills
  "graphify:": "graphify",
  "graphwiki:": "graphwiki",
  "graph:": "graph-provider",
  "spending:": "spending",
  "/graphify": "graphify",
  "/graphwiki": "graphwiki",
  "/graph-provider": "graph-provider",
  "/spending": "spending"
};
function detectKeyword(prompt) {
  const trimmed = prompt.trimStart();
  for (const [keyword, skillId] of Object.entries(KEYWORD_MAP)) {
    if (trimmed.startsWith(keyword)) {
      return {
        keyword,
        skillId,
        position: 0
      };
    }
  }
  const slashPattern = /^\/([a-zA-Z]+)\b/;
  const slashMatch = trimmed.match(slashPattern);
  if (slashMatch) {
    const cmd = slashMatch[1].toLowerCase();
    const skillId = KEYWORD_MAP[`${cmd}:`] || cmd;
    if (skillId !== cmd || Object.values(KEYWORD_MAP).includes(cmd)) {
      return {
        keyword: slashMatch[0],
        skillId,
        position: 0
      };
    }
  }
  return null;
}
function processHook(input) {
  const start = Date.now();
  const log = [];
  try {
    if (input.hook_type !== "UserPromptSubmitted") {
      return {
        status: "skip",
        latencyMs: Date.now() - start,
        mutations: [],
        log: ["Not a UserPromptSubmitted hook"]
      };
    }
    const match = detectKeyword(input.prompt);
    if (!match) {
      return {
        status: "ok",
        latencyMs: Date.now() - start,
        mutations: [],
        log: []
      };
    }
    const taskPart = input.prompt.slice(match.position + match.keyword.length).trim();
    const rewritten = `/oh-my-githubcopilot:${match.skillId}${taskPart ? ` ${taskPart}` : ""}`;
    log.push(`Keyword detected: "${match.keyword}" \u2192 skill: ${match.skillId}`);
    log.push(`Rewritten: "${rewritten}"`);
    return {
      status: "ok",
      latencyMs: Date.now() - start,
      modifiedPrompt: rewritten,
      mutations: [
        { type: "set_mode", mode: match.skillId },
        { type: "log", level: "info", message: `Skill activated: ${match.skillId}` }
      ],
      log
    };
  } catch (err) {
    return {
      status: "error",
      latencyMs: Date.now() - start,
      mutations: [],
      log: [`Error: ${err}`]
    };
  }
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
//# sourceMappingURL=keyword-detector.mjs.map
