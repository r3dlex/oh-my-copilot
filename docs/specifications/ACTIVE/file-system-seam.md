# SPEC: Unify the file I/O seam

| Field | Value |
|-------|-------|
| Status | ACTIVE |
| Date | 2026-07-06 |
| Slug | `file-system-seam` |
| Scope | `oh-my-githubcopilot` repository only |
| Origin | improve-codebase-architecture exploration (file I/O duplication) |
| Issue | [`.ai/work-intake/file-system-seam.md`](../../../.ai/work-intake/file-system-seam.md) |

## A — Current state

Path resolution and JSON read/write patterns are duplicated across ~20 modules.
The six worst offenders each hand-roll the same three concerns:

| Module | homedir/join paths | ensure-dir | read-with-fallback | write |
|---|---|---|---|---|
| `src/utils/config.mts` | `~/.omp/config.json`, `./.omp/config.json` | `mkdirSync(dirname)` | try/parse, warn on malformed | plain `writeFileSync` |
| `src/spending/tracker.mts` | `~/.omp/state/spending-monthly.json` | `mkdirSync(dirname)` | try/parse, fresh state | plain `writeFileSync` |
| `src/hud/statusline.mts` | `~/.omp/hud/*`, `~/.omp/hud.line` | local `ensureParent` | try/parse chain | local temp+rename (`writeAtomic`) |
| `src/psm/session.mts` | `~/.omp/state/sessions*` | local `ensureDir` | try/parse, `[]` | plain `writeFileSync` |
| `src/mcp/state-manager.mts` | `~/.omp/state/omp.db`, `~/.omp/state/sessions.json` | local `ensureDir(filePath)` | existsSync + try/parse, `[]` | plain `writeFileSync` |
| `src/hooks/delegation-enforcer.mts` | `~/.omp/state/session(s)*.json` | — | try/parse, `null` | — |

Atomicity is inconsistent: only the HUD statusline writes temp+rename; every
other state file can be observed half-written by concurrent readers (HUD
watchers, tmux segments, parallel hooks).

## B — Target state

One seam module `src/utils/file-system.mts` owns:

- **Primitives**
  - `readJsonSafe<T>(path, fallback, options?)` — never throws; returns
    `fallback` on missing file or malformed JSON; optional `onMalformed`
    callback preserves the config module's warn-on-malformed behavior.
  - `writeFileAtomic(path, content, mode?)` — ensure parent dir, write
    `<path>.tmp`, `renameSync` into place (the statusline pattern, promoted).
  - `writeJsonAtomic(path, data)` — `writeFileAtomic` of
    `JSON.stringify(data, null, 2)`.
  - `ensureDir(dirPath)` — recursive mkdir.
- **Path factories** (single source of truth for the real paths above)
  - `getConfigPath(scope)` — `./.omp/config.json` (local) / `~/.omp/config.json` (global)
  - `getSpendingPath()` — `~/.omp/state/spending-monthly.json`
  - `getSessionIndexPath()` — `~/.omp/state/sessions.json`
  - `getSessionsDir()` — `~/.omp/state/sessions`
  - `getStateDir()` — `~/.omp/state`
  - `getPsmDbPath()` — `~/.omp/state/omp.db`
  - `getHudPaths(home?)` — HUD artifact paths (status.json, display.txt,
    tmux-segment.sh, legacy hud.line); `src/hud/statusline.mts` keeps
    re-exporting `getStatuslinePaths`/`StatuslinePaths` for consumers
    (`watch.mts`, `bin/omp.mjs`, `extension/extension.mjs`, tests).

The six modules listed in A are refactored onto the seam in this PR. The
remaining duplicating modules (e.g. `src/mcp/server.mts`,
`src/mcp/memory-store.mts`, `src/skills/spending.mts`) are follow-up work and
are intentionally NOT touched here.

## Acceptance criteria

- [ ] `npm run typecheck`, `npm run test`, `npm run lint`,
      `npm run archgate:check`, and `npm run build` all green.
- [ ] Behavior identical: same file paths, same JSON shapes/formatting, same
      fallback semantics (ENOENT silent, malformed-config warn), HUD writes
      remain atomic (temp+rename).
- [ ] State writes in the six refactored modules are now uniformly atomic
      (temp+rename) — this is the single intended behavioral improvement.
- [ ] New tests cover `readJsonSafe` (missing file, malformed JSON, valid),
      `writeJsonAtomic` (create, overwrite, nested dir), and the path
      factories (`tests/utils/file-system.test.mts`; repo vitest convention —
      `tests/**`, not `src/**/__tests__`).
- [ ] Total change stays under ~400 lines; only the six listed modules are
      refactored.
