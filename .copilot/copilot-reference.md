# OMP Copilot Reference

Use this file only when you need the full agent catalog, skill catalog, or HUD field breakdown referenced by `.copilot/copilot-instructions.md`.

## Agent Catalog

| Agent | Primary use |
| --- | --- |
| `orchestrator` | Top-level coordination and delegation |
| `explorer` | Fast codebase surveys and file discovery |
| `planner` | Execution plans, sequencing, and risk framing |
| `executor` | Implementation, refactors, and file edits |
| `verifier` | Build/test/diagnostic evidence collection |
| `writer` | Documentation and changelog updates |
| `reviewer` | General quality and completeness review |
| `architect` | System design and read-only design verification |
| `debugger` | Root-cause analysis and failure isolation |
| `researcher` | External docs and reference lookups |
| `designer` | UI/UX and design-system translation |
| `security-reviewer` | Security findings and trust-boundary review |
| `analyst` | Requirements clarification and acceptance criteria |
| `critic` | Plan review and gap analysis |
| `code-reviewer` | Severity-rated code review |
| `test-engineer` | Test strategy and regression design |
| `tester` | Test authoring and coverage work |
| `qa-tester` | Runtime QA and interaction checks |
| `git-master` | Commit strategy and history hygiene |
| `scientist` | Data/experiment-style analysis |
| `tracer` | Evidence-driven causal tracing |
| `document-specialist` | Documentation synthesis and reference support |
| `simplifier` | Behavior-preserving simplification |

## Skill Catalog

### Core workflows
- `autopilot`
- `ralph`
- `ultrawork`
- `team`
- `swarm`
- `pipeline`
- `deep-interview`
- `omp-plan`
- `omp-setup`
- `ecomode`

### Utilities and platform support
- `hud`
- `trace`
- `note`
- `configure-notifications`
- `release`
- `mcp-setup`
- `setup`
- `psm`
- `learner`

### Graph + knowledge workflows
- `graphify`
- `graphwiki`
- `graph-provider`
- `wiki`
- `spending`
- `swe-bench`

## HUD Field Breakdown

The HUD is the compact session status line. Read it left-to-right:
- version / mode
- active model
- context usage
- approximate token usage
- request count / age
- tools used
- skills used
- agents used
- current status

Treat the HUD as runtime context, not a replacement for verification.
