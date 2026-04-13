# Changelog

All notable changes to **oh-my-githubcopilot** are documented here, ordered newest first.

---

## [v1.5.5] — Copilot docs move and release refresh

### Documentation
- **Copilot docs moved to `.copilot/`** — relocated Copilot-facing instructions, agent docs, skill docs, and plugin skill docs out of `.github/` so `.copilot/` is now the single home for Copilot-specific documentation.
- **Adoption flow updated** — `scripts/omp-adopt.sh` now installs Copilot docs under `.copilot/` while leaving `.github/` focused on workflows, plugin metadata, and hook entrypoints.

### Release readiness
- **Next release metadata advanced** — package, plugin, marketplace, and Claude plugin manifests move to `1.5.5` so the post-STATUS_LINE and post-doc-relocation state is ready for the next release cut.
- **Release notes refreshed** — changelog and release docs now reflect the `.copilot/` doc boundary and the new release target.

## [v1.5.4] — Experimental Copilot setup and STATUS_LINE integration

### Features
- **Experimental Copilot defaults in setup** — `omp setup` now merges the required Copilot experimental feature flags into `~/.copilot/config.json`, preserves existing flags and custom status-line commands, and writes the packaged OMP status-line command when needed.
- **Packaged STATUS_LINE support** — added a dedicated `src/hud/statusline.mts` entrypoint plus `bin/omp-statusline.sh` wrapper so Copilot CLI can render OMP session state directly from the installed plugin.
- **HUD artifact export for status line rendering** — `hud-emitter` now writes the minimal status-line artifacts needed by the STATUS_LINE command in addition to the legacy HUD line output.

### Fixes
- **Setup verification harness** — added direct temp-HOME setup tests so Copilot config merging is exercised without depending on the limited top-level `omp` CLI subcommand surface.
- **STATUS_LINE verification harness** — updated HUD/statusline tests so temp-HOME artifact paths are asserted correctly and lint-cleanly under the new status-line flow.

### Verification
- **Coverage remains above release floor** — fresh coverage evidence remains above the required 80% thresholds: statements `88.26%`, branches `83.98%`, functions `92.4%`.
- **Focused addendum verification** — setup and status-line focused suites, typecheck, lint, build, and wrapper smoke all pass on the merged leader tree, with the remaining skipped integration setup test called out as pre-existing infrastructure debt rather than an addendum regression.

## [v1.5.3] — Release readiness and CI enforcement

### Fixes
- **Version bump for the next publishable release** — advanced package, plugin, marketplace, and Claude plugin manifests to `1.5.3`, which clears the existing `v1.5.1` / `v1.5.2` tag history and avoids the next release colliding with already-used versions.
- **Real CI test failures** — removed the `|| true` bypasses from the main CI test and coverage jobs so GitHub Actions now fails when tests or coverage regress.
- **Claude plugin manifest sync** — normalized `.claude-plugin/plugin.json` to a single version field by re-syncing it from the root `plugin.json`.

### Verification
- **Fresh coverage evidence** — `npm run test:coverage` now reports `88.26%` statements, `83.96%` branches, and `92.4%` functions, satisfying the repo's `80%` thresholds.
- **Fresh local CI parity run** — `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npx archgate check`, and `npm pack --dry-run` all pass on the release candidate branch.

### Documentation
- **Release process clarified** — `RELEASING.md` now calls out syncing all plugin manifests plus marketplace metadata and choosing the next unreleased semver before tagging.

## [v1.5.0] — Copilot CLI release alignment

### Features
- **Copilot-ready agent metadata** — normalized `src/agents/*.md` frontmatter for Copilot-compatible agent loading fields while preserving the existing prompt bodies.
- **Copilot instructions refresh** — rewrote the Copilot instructions with an OMP overview, delegation guidance, agent catalog, skill catalog, HUD reference, and keyword quick reference, now carried under the Copilot-facing docs set instead of `.github/` docs.
- **README quick start refresh** — replaced the install flow with `copilot plugin install ...`, `/omp:setup`, and first-run Copilot commands.

### Fixes
- **Version sync to `1.5.0`** — aligned `package.json`, `package-lock.json`, root/plugin manifests, and marketplace metadata on the release target.
- **Plugin manifest agent path** — `.github/plugin/plugin.json` now points at `./agents` so the manifest matches the Copilot-facing agent bundle.
- **Release notes alignment** — consolidated the current Copilot CLI packaging/runtime fixes under the `v1.5.0` release line for a single consumer-facing release target.

### Documentation
- **Release expectations clarified** — release docs now call out the committed `dist/` expectation for plugin consumers.

---

## [v1.4.2] — Dynamic version in HUD emitter

### Fixes
- **HUD version** — `hud-emitter` hook no longer hardcodes `"1.0.0"` as the session state version; reads from `package.json` via `createRequire` so `omp hud` always displays the installed package version

---

## [v1.4.1] — CLI shebang fix, dynamic version

### Fixes
- **CLI shebang** — `bin/omp.mjs` now includes `#!/usr/bin/env node` banner (via esbuild `banner` option); the binary is executable directly without explicit `node` invocation (`550b764`)
- **Dynamic version** — `omp version` now reads name and version from `package.json` at runtime via `createRequire`; no more hardcoded version string in source (`550b764`)

---

## [v1.4.0] — Package renamed to oh-my-githubcopilot

### Breaking Changes
- **Package renamed** — npm package renamed from `oh-my-copilot` to `oh-my-githubcopilot`; GitHub Packages now publishes as `@r3dlex/oh-my-githubcopilot`; install with `npm install oh-my-githubcopilot`
- **Repository moved** — git remote updated to `git@github.com:r3dlex/oh-my-githubcopilot.git`

### Changes
- All source files, tests, specs, docs, and manifests updated to reflect the new package name
- MCP server identity updated to `oh-my-githubcopilot`
- All 11 localized READMEs, archgate ADRs, and release docs updated
- `bin/omp.mjs` rebuilt with updated package identity

---

## [v1.3.0] — Continuous release pipeline, dual-registry publish

Commits: `fd366e6`…`a26f673`

### Features
- **Continuous alpha releases** — every push to `main` publishes `X.Y.Z-alpha.<sha>` to the `alpha` dist-tag; tagged commits (`vX.Y.Z`) publish stable to `latest` (`ec8fffa`)
- **Hybrid dual-registry publish** — publishes to GitHub Packages (`@r3dlex/oh-my-githubcopilot`) always via `GITHUB_TOKEN`; publishes to npmjs.com (`oh-my-githubcopilot`) when `NPM_TOKEN` secret is configured; graceful skip with notice if absent (`ee42604`)
- **npm release CI pipeline** — `release.yml` with four jobs: `build` (version resolution + artifact), `test` (CHANGELOG gate for stable only), `publish` (dual-registry), `github-release` (stable only, attaches `.tgz`) (`5a3ae67`)

### Fixes
- **Workflow parse error** — replaced `secrets.NPM_TOKEN != ''` in step `if:` conditions with a dedicated check step outputting `available=true/false` (`e82e807`)
- **Version-agnostic plugin test assertions** — `plugin-install.test.mts` now reads version from `packageJson().version`; `marketplace.json` metadata.version synced (`7f99f14`)
- **Stale agent/skill counts** — JSON descriptors and e2e tests corrected to 23 agents / 25 skills (`74c5122`)

### Documentation
- **CHANGELOG rewritten** — entries now derived from actual git log commit ranges per version (`a26f673`)
- **Agent and skill docs normalized** — all 23 agent descriptors and 25 skill `SKILL.md` files updated to consistent format (`fd366e6`)

---

## [v1.2.0] — GraphProvider abstraction, graphwiki adapter, spending skill

Commits: `a234799`, `feb5e65` (PR #10)

### Features
- **GraphProvider abstraction** — new `src/graph/` module with `GraphBuildable` and `GraphWikiClient` interfaces; provider resolved from `.omp/config.json` `graph.provider` with local > global > default (`graphwiki`) resolution
- **GraphifyAdapter** — extracted graphify CLI wrapper from `src/skills/graphify.mts` into `src/graph/graphify-adapter.mts`; graphify skill now delegates to the adapter (public API unchanged)
- **GraphwikiAdapter** — new `src/graph/graphwiki-adapter.mts` wrapping the `graphwiki` npm CLI (`npm install -g graphwiki`); implements both `GraphBuildable` and `GraphWikiClient`
- **graphwiki skill** — new `/omp:graphwiki` skill for direct access to graphwiki CLI: `query`, `path`, `lint`, `refine`, `build`, `status`, `clean`
- **graph-provider skill** — new `/omp:graph-provider` skill for managing the active provider: `get`, `set`, `list`, `build`, `status`, `clean`, `query`
- **spending skill** — new `/omp:spending` skill exposing `status` and `reset` for premium request usage tracking
- **keyword-detector wiring** — 8 new keyword entries: `graphify:`, `graphwiki:`, `graph:`, `spending:`, `/graphify`, `/graphwiki`, `/graph-provider`, `/spending`

### Fixes
- **plugin.json** — removed non-existent `./agents` path from agents array; added `graphify`, `graphwiki`, `graph-provider`, `spending` to skills list (25 skills total)
- **gitignore** — untracked `coverage/.tmp`, `.omc/` state files, `devops.md` (`a234799`)

---

## [v1.1.0] — CI hardening, HUD format change

Commits: `ce6f3bd`…`051ac20` (PR #9)

### Features
- **HUD format: `tools:N` → `tools:N/M`** — all count fields (tools, skills, agents) now display as used/total (e.g., `tools:12/13`, `skills:5/25`, `agents:3/23`); added `toolsTotal`, `skillsTotal`, `agentsTotal` fields to `HudState` and `HudMetrics`
- **CLI elicitation support** — expanded OMP setup wizard to handle interactive CLI prompts during MCP config generation

### Fixes
- **CI: zero-install artifact pattern** — build artifact uploaded once in `build` job and downloaded in `test`/`publish` jobs; eliminates redundant `npm install` across CI jobs (`d46f647`)
- **CI: vitest hanging** — added `< /dev/null` stdin redirect and `timeout 120` to prevent vitest blocking indefinitely in non-TTY environments (`fa9fdfb`)
- **CI: vitest `--forceExit`** — added flag to ensure process exits after tests complete in CI (`c88c2c7`)
- **CI: coverage job timeout** — separated coverage into its own job with a 10-minute timeout; tests run without coverage in parallel (`9608b07`)
- **CI: coverage provider** — removed incompatible `@vitest/coverage-istanbul`; using `@vitest/coverage-v8` exclusively (`ce6f3bd`)
- **Redundant `root/agents` directory** — removed stale agents directory at repo root; all 23 agents live in `src/agents/` (`8c521c0`)

---

## [v1.0.0] — Initial release

Commits: `804fc37`…`0f96d48` (initial implementation + `6ee243f` rename)

Initial release of **oh-my-githubcopilot (OMP)** — a multi-agent orchestration plugin for GitHub Copilot CLI.

### Features
- **23 specialized agents** via Claude Code subagents: orchestrator, explorer, planner, executor, verifier, writer, reviewer, designer, researcher, tester, debugger, architect, security-reviewer, simplifier, test-engineer, critic, tracer, scientist, code-reviewer, document-specialist, qa-tester, git-master, analyst
- **22 skills** including: `setup`, `mcp-setup`, `autopilot`, `ralph`, `ultrawork`, `team`, `ecomode`, `swarm`, `pipeline`, `plan`, `omp-plan`, `hud`, `note`, `trace`, `learner`, `swe-bench`, `wiki`, `psm`, `release`, `graphify`, `spending`, `spawn`
- **6 hooks**: `keyword-detector`, `delegation-enforcer`, `model-router`, `token-tracker`, `hud-emitter`, `stop-continuation`
- **HUD display system** — real-time session context, token tracking, and agent/skill usage counters in tmux status bar
- **PSM (Plugin State Manager)** — SQLite-backed cross-session state persistence with fleet-level visibility
- **MCP server** — 10 tools for extended capabilities (`omp_get_agents`, `omp_delegate_task`, `omp_activate_skill`, `omp_get_hud_state`, `omp_get_session_state`, `omp_save_session`, `omp_list_sessions`, `omp_invoke_hook`, `omp_subscribe_hud_events`, `omp_fleet_status`)
- **SWE-bench harness** — reproducible benchmark runner for performance evaluation
- **Double-tiered MCP config** — user-level (`~/.omp/`) and workspace-level (`.omp/`) config with merge resolution
- **Setup wizard** — `/setup` and `/mcp-setup` skills for frictionless onboarding
- **ADR governance** — `archgate` CLI integration for architecture decision records (`d38b46d`, `9cc3d09`)
- **OMP rename** — project renamed from `oh-my-claudecode (OMC)` to `oh-my-githubcopilot (OMP)` targeting GitHub Copilot CLI (`6ee243f`)

### Documentation
- `AGENTS.md` — agent registry and delegation rules
- `CLAUDE.md` — project instructions and quick reference
- `SECURITY.md` — vulnerability reporting policy
- `FUNDING.yml` — GitHub Sponsors link
- Spec documents: `spec/AGENTS_SPEC.md`, `spec/SKILLS.md`, `spec/HOOKS.md`, `spec/HUD.md`, `spec/PSM.md`, `spec/MCP.md`
- 11 localized READMEs, SVG logo, buddy screenshots
