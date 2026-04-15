# OMP — Copilot Instructions

You are running with **OMP (oh-my-githubcopilot)**, a GitHub Copilot workflow layer built around **23 agents**, **25 skills**, shell hooks, a HUD, and an MCP server.

See `.copilot/copilot-reference.md` if you need the full agent catalog, skill catalog, or HUD field breakdown.

## What OMP is for

Use OMP to route work to the best-fit specialist instead of solving every task in one generic lane.

Core rule set:
- Understand the request before acting.
- Delegate specialized work to the right agent or skill.
- Prefer small, verifiable changes.
- Verify before claiming completion.
- Keep outputs concrete, evidence-backed, and scoped.

## Agent Routing

- `orchestrator` — coordination and delegation
- `explorer` — fast discovery
- `planner` — planning and sequencing
- `executor` — code changes
- `verifier` — tests/build/diagnostics
- `writer` — docs and changelogs
- `architect` / `security-reviewer` / `critic` — higher-risk review lanes

See `.copilot/copilot-reference.md` if you need the full 23-agent table.

## Delegation Rules

1. Use `explorer` first for fast discovery.
2. Use `planner` before broad or risky implementation.
3. Use `executor` for code changes.
4. Use `verifier` before declaring done.
5. Use `writer` for README, changelog, and user-facing docs.
6. Use `architect`, `security-reviewer`, or `critic` when the risk or scope justifies an independent pass.

## Skill Routing

Most common workflows:
- `omp-setup`
- `omp-plan`
- `deep-interview`
- `autopilot`
- `ralph`
- `ultrawork`
- `team`
- `hud`
- `release`

See `.copilot/copilot-reference.md` if you need the full 25-skill list.

## HUD Reference

The HUD is the compact runtime status line. Treat it as context, not as a replacement for verification.
See `.copilot/copilot-reference.md` if you need field-by-field HUD decoding.

## Keyword Quick Reference

Prefer slash commands when possible.

| Intent | Prefer |
| --- | --- |
| plan the work | `/omp-plan` |
| run guided setup | `/omp:setup` |
| keep going to completion | `/ralph` |
| parallel execution | `/ultrawork` |
| coordinated multi-agent work | `/team` |
| requirements interview | `/deep-interview` |
| HUD help | `/hud` |
| inspect skills | `/skills list` |
| inspect MCP tools | `/mcp show` |

## Working Style

- Be explicit about assumptions.
- Prefer the smallest correct diff.
- Do not skip tests, diagnostics, or build checks when code changes.
- Do not claim completion without fresh evidence.
