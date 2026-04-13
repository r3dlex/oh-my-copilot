# Copilot Local Docs

This directory holds Copilot-specific reference material that is useful inside the repository but does not need to live in `.github/`.

## Files

- `copilot-instructions.md` — primary Copilot-facing shared instructions for this repo.
- `copilot-reference.md` — extended agent/skill/HUD reference for Copilot-related workflows.
- `agents/` — Copilot-facing agent docs.
- `skills/` — Copilot-facing skill docs.
- `plugin/skills/` — Copilot plugin-bundled skill docs that were previously kept under `.github/plugin/skills/`.

## Boundary

- Keep Copilot-facing docs here under `.copilot/`.
- Keep `.github/` for workflows, plugin metadata, and hook entrypoints rather than Copilot docs.
