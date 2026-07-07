# issue:omp-root:file-system-seam

- **Title**: refactor(utils): unify file I/O behind file-system seam
- **Type**: architecture-deepening refactor
- **Status**: in-progress
- **Spec**: [`docs/specifications/ACTIVE/file-system-seam.md`](../../docs/specifications/ACTIVE/file-system-seam.md)
- **Branch**: `improve-arch/file-system-seam`

## Problem

Path resolution + JSON read/write patterns (homedir/join, ensure-dir,
read-with-fallback) are duplicated across ~20 modules with inconsistent
atomicity — only the HUD statusline writes temp+rename; other state files can
be read half-written.

## Scope

Create `src/utils/file-system.mts` (readJsonSafe / writeJsonAtomic /
writeFileAtomic / ensureDir + path factories) and refactor exactly six
modules onto it: `src/utils/config.mts`, `src/spending/tracker.mts`,
`src/hud/statusline.mts`, `src/psm/session.mts`, `src/mcp/state-manager.mts`,
`src/hooks/delegation-enforcer.mts`. Remaining duplicators are follow-up.

## Acceptance criteria

See spec §Acceptance criteria — typecheck, vitest, eslint, archgate:check,
build all green; behavior identical apart from uniform atomic writes.
