# oh-my-githubcopilot (OMP)

<p align="center">
  <img src="assets/omp-banner.png" alt="Oh My Copilot" width="100%"/>
</p>

<p align="center">
  Multi-agent orchestration for GitHub Copilot CLI — powered by 23 specialized agents, 25 skills, and a real-time HUD.
</p>

[![npm version](https://img.shields.io/npm/v/oh-my-githubcopilot?color=red)](https://npmjs.com/package/oh-my-githubcopilot)
[![npm downloads](https://img.shields.io/npm/dm/oh-my-githubcopilot?color=blue)](https://npmjs.com/package/oh-my-githubcopilot)
[![License: Apache-2.0](https://img.shields.io/npm/l/oh-my-githubcopilot?color=green)](LICENSE)
[![Sponsor](https://img.shields.io/static/v1?label=Sponsor&message=r3dlex&color=EA4949&logo=github-sponsors)](https://github.com/sponsors/r3dlex)

---

## Why OMP?

Every software team juggles implementation, architecture, security review, testing, and DevOps — all simultaneously. OMP orchestrates specialized agents so every dimension gets expert attention, in parallel, without you herding cats.

| What you get | Why it matters |
|--------------|----------------|
| **23 agents** | executor, architect, planner, reviewer, debugger, designer, security-reviewer, scientist, analyst, and more — each tuned to a different craft |
| **25 skills** | `autopilot`, `ralph`, `ultrawork`, `team`, `ecomode`, `swarm`, `pipeline`, `plan`, `graphify`, `spending`, and more — trigger with a slash command |
| **6 hooks** | Keyword detection, delegation routing, model selection, token tracking, HUD emission, stop-continuation |
| **MCP server** | 10 built-in tools for extended capabilities |
| **HUD display** | Real-time session context and progress tracking |
| **PSM** | Plugin State Manager with SQLite persistence across sessions |
| **SWE-bench** | Benchmark harness for reproducible evaluation |
| **`.github/` convention** | Agents, skills, and hooks auto-discovered by VS Code Copilot — no config required |

<p align="center">
  <img src="assets/buddy-swarm.png" alt="OMP swarm mode" width="600"/>
</p>

## Quick Start

### Option A: Workspace Convention (Recommended)

Copy OMP agents, skills, and hooks directly into your project's `.github/` directory:

```bash
git clone https://github.com/r3dlex/oh-my-githubcopilot.git /tmp/omp
/tmp/omp/scripts/omp-adopt.sh --target . --mode template
```

Open your project in VS Code with GitHub Copilot. Agents, skills, and hooks are auto-discovered from `.github/`.

### Option B: Copilot CLI Plugin (Global)

```bash
copilot plugin install r3dlex/oh-my-githubcopilot
```

### Option C: Track Updates via Submodule

```bash
git clone https://github.com/r3dlex/oh-my-githubcopilot.git /tmp/omp
/tmp/omp/scripts/omp-adopt.sh --target . --mode submodule
```

### CLI Companion (Optional)

```bash
npm install -g oh-my-githubcopilot
omp setup     # Creates ~/.omp/ config directory
omp hud       # Displays current HUD line
```

The `omp` CLI is a companion tool, not required for core functionality.

### Using OMP

After installation, use skills as slash commands or magic keywords:

```
/ralph build a REST API for task management
/ultrawork refactor the auth module
autopilot: build a TODO app with tests
/team 3:executor fix all TypeScript errors
```

<p align="center">
  <img src="assets/buddy-playful.png" alt="OMP in action" width="600"/>
</p>

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    oh-my-githubcopilot                        │
├──────────────────┬──────────────────┬────────────────────────┤
│  Agents (23)     │  Hooks (6)       │  PSM (SQLite)          │
│  ─────────────   │  ─────────────   │  ────────────────      │
│  executor        │  keyword-        │  Cross-session         │
│  architect       │  detector        │  state persistence     │
│  planner         │  delegation-     │                        │
│  reviewer        │  enforcer        │  MCP Server            │
│  debugger        │  model-router    │  ─────────────         │
│  designer        │  token-tracker   │  10 tools exposed      │
│  security-       │  hud-emitter     │                        │
│  reviewer        │  stop-contin.    │  HUD Display           │
│  ... (23 total)  │                  │  ─────────────         │
│                  │                  │  tmux status bar       │
├──────────────────┴──────────────────┴────────────────────────┤
│  .github/agents/  +  .github/skills/  +  .github/hooks/      │
│  ~/.omp/ (user config)  +  .omp/ (workspace config)          │
└──────────────────────────────────────────────────────────────┘
```

### Agents

OMP provides 23 specialized agents, each with Copilot CLI frontmatter for native auto-discovery:

| Agent | Model tier | Use case |
|-------|-----------|---------|
| executor | sonnet | Implementation, file edits, testing |
| architect | opus | Architecture decisions, security analysis |
| planner | opus | Strategic planning, task decomposition |
| analyst | opus | Requirements analysis, pre-planning |
| critic | opus | Work plan and code review |
| reviewer | sonnet | Code review, style, SOLID checks |
| verifier | sonnet | Verification, evidence-based completion |
| debugger | sonnet | Root-cause analysis, stack traces |
| designer | sonnet | UI/UX, responsive layouts |
| test-engineer | sonnet | Test strategy, e2e coverage, TDD |
| security-reviewer | sonnet | OWASP Top 10, secrets, unsafe patterns |
| code-reviewer | opus | Severity-rated feedback, logic defects |
| writer | haiku | Technical docs, README, API docs |
| scientist | sonnet | Data analysis, research execution |
| qa-tester | sonnet | Interactive CLI testing via tmux |
| document-specialist | sonnet | External docs & reference lookup |
| explorer | haiku | Codebase search, file patterns |
| researcher | sonnet | Complex research, web fetch |
| tracer | sonnet | Evidence-driven causal tracing |
| simplifier | sonnet | Code simplification, refactoring |
| git-master | sonnet | Atomic commits, rebasing, history |
| orchestrator | opus | Multi-agent coordination |
| tester | sonnet | Test writing and maintenance |

_Full specs: [AGENTS.md](AGENTS.md) · [spec/AGENTS_SPEC.md](spec/AGENTS_SPEC.md)_

### Skills

25 skills, each triggerable via slash command or magic keyword:

| Skill | Trigger | Description |
|-------|---------|-------------|
| autopilot | `autopilot:` | Full autonomous pipeline: explore → plan → implement → verify |
| ralph | `/ralph` | Persistence loop with architect gate |
| ultrawork | `ulw:` | Parallel multi-agent high-throughput implementation |
| team | `/team` | Coordinated N-agent team with staged pipeline |
| ecomode | `eco:` | Cost-optimized execution with haiku agents |
| swarm | `/swarm` | Parallel agent swarm for independent tasks |
| pipeline | `pipeline:` | Sequential stage-based execution |
| plan | `/plan` | Strategic planning with critic review |
| graphify | `/graphify` | Convert any input to a knowledge graph |
| graphwiki | `/graphwiki` | graphwiki CLI: query, lint, build, status |
| graph-provider | `/graph-provider` | Manage active graph provider |
| spending | `/spending` | Premium request usage tracking |
| hud | `/hud` | Display current HUD state |
| psm | `/psm` | Plugin State Manager operations |
| swe-bench | `/swe-bench` | SWE-bench evaluation harness |
| release | `/release` | Guided release workflow |
| setup | `/setup` | Onboarding wizard |
| mcp-setup | `/mcp-setup` | MCP server configuration |
| wiki | `/wiki` | Project wiki operations |
| learner | `/learner` | Structured learning sessions |
| note | `/note` | Session notes and context |
| trace | `/trace` | Execution tracing |
| omp-plan | `/omp-plan` | OMP-aware planning |
| deep-interview | `/deep-interview` | Requirements deep-dive |
| configure-notifications | `/configure-notifications` | Notification settings |

### Hooks

Six hooks power the orchestration pipeline:

- **keyword-detector** — triggers OMP skills on magic keywords
- **delegation-enforcer** — routes tasks to appropriate agents
- **model-router** — selects optimal model tier per task
- **token-tracker** — monitors usage and cost
- **hud-emitter** — streams session context to HUD
- **stop-continuation** — graceful cancellation handling

### `.github/` Workspace Convention

OMP ships a fully populated `.github/` directory for VS Code Copilot auto-discovery:

```
.github/
  agents/          # 23 agent .md files with Copilot CLI frontmatter
  skills/          # 25 skill directories with SKILL.md
  hooks/           # pre-tool-use.sh, post-tool-use.sh
  copilot-instructions.md  # full agent registry + model routing
```

No configuration required — open any project that has adopted OMP and all agents, skills, and hooks are live.

### PSM (Plugin State Manager)

Cross-session persistence via SQLite:

```javascript
// State persists across sessions
await state.write({ mode: 'autopilot', iteration: 3 });
const state = await state.read();
```

### MCP Server

10 tools exposed for extended capabilities. See [spec/MCP.md](spec/MCP.md).

## Documentation

- [AGENTS.md](AGENTS.md) — Agent registry and delegation rules
- [spec/AGENTS_SPEC.md](spec/AGENTS_SPEC.md) — Agent capabilities table
- [spec/SKILLS.md](spec/SKILLS.md) — Skill catalog
- [spec/HOOKS.md](spec/HOOKS.md) — Hook system
- [spec/HUD.md](spec/HUD.md) — HUD display
- [spec/PSM.md](spec/PSM.md) — Plugin State Manager
- [spec/MCP.md](spec/MCP.md) — MCP server

## Requirements

- Node.js >= 22.0.0
- GitHub Copilot CLI (for plugin install mode)
- VS Code + GitHub Copilot extension (for workspace convention mode)

---

## 💛 Love this project? [Sponsor r3dlex](https://github.com/sponsors/r3dlex)

If OMP saves you time, consider sponsoring the maintainer:

[![Sponsor r3dlex](https://github.githubassets.com/assets/images/modules/sponsors/modules/SponsorButton--glyph-sm-b5211212fc9306694a295e37672660c1.gif)](https://github.com/sponsors/r3dlex)

Every sponsorship helps keep development going.

Apache-2.0 License | [GitHub](https://github.com/r3dlex/oh-my-githubcopilot)
