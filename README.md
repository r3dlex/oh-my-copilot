# oh-my-githubcopilot (omp)

> **Sister projects:** [oh-my-claudecode (OMC)](https://github.com/Yeachan-Heo/oh-my-claudecode) | [oh-my-codex (OMX)](https://github.com/Yeachan-Heo/oh-my-codex) | [oh-my-githubcopilot (OMP)](https://github.com/r3dlex/oh-my-githubcopilot) | [oh-my-antigravity (OMG)](https://github.com/r3dlex/oh-my-antigravity) | [oh-my-auggie (OMA)](https://github.com/r3dlex/oh-my-auggie)

**Multi-agent orchestration for GitHub Copilot CLI.**

OMP adds specialized agents, reusable workflow skills, hooks, state, and a HUD to your existing Copilot CLI session.

[Get Started](#quick-start) • [How it works](#mental-model) • [Troubleshooting](#troubleshooting) • [Docs](#documentation) • [Discord](https://discord.gg/PUwSMR9XNk)

Translations: [Deutsch](README.de.md) • [Español](README.es.md) • [Français](README.fr.md) • [Italiano](README.it.md) • [日本語](README.ja.md) • [한국어](README.ko.md) • [Português](README.pt.md) • [Русский](README.ru.md) • [Türkçe](README.tr.md) • [Tiếng Việt](README.vi.md) • [中文](README.zh.md)

---

## Requirements

- [Node.js](https://nodejs.org/) 22 or newer and `npm`
- A working, authenticated GitHub Copilot CLI 1.0.60 or newer
- A terminal supported by Copilot CLI

Copilot CLI 1.0.60 introduced the extension API used for native slash commands; older releases can only fall back to keyword triggers. `tmux` is optional. It is useful for the session-management and terminal HUD integrations that explicitly use it, but it is not required for the Quick Start.

## Quick Start

Install OMP and register it with Copilot CLI:

```bash
npm install -g oh-my-githubcopilot
omp install
```

`omp install` updates `~/.copilot/settings.json` to enable the local OMP marketplace entry, plugin, experimental mode, and status line. Restart Copilot CLI so it reloads that configuration.

Confirm the terminal companion is installed:

```bash
omp version
omp help
```

Expected result: `omp version` prints a line such as `oh-my-githubcopilot v2.0.0` (the version number may be newer), and `omp help` finishes its catalog with `Total: 59 skills`.

Then open Copilot CLI in your project and run:

```text
/omp:help
```

Your first observable in-session success is the **OMP Skills Catalog**, followed by the available skill IDs and descriptions. You can now invoke a listed workflow with `/omp:<skill-id>`.

## Mental model

```text
GitHub Copilot CLI (host)
└── OMP plugin + `omp` terminal companion
    ├── agents — specialized roles selected by the orchestrator
    ├── skills — workflows invoked inside Copilot CLI
    ├── hooks  — routing, tracking, HUD, and continuation events
    ├── ./.omp/ — project-local configuration and generated workflow artifacts
    └── ~/.omp/ — user-level runtime, session, HUD, logs, and MCP state
```

OMP extends Copilot CLI; it does not replace the host, its authentication, its model access, or your repository's own instructions. `AGENTS.md` remains the operating contract when a repository provides one.

## Two command surfaces

Use the terminal companion for installation and local diagnostics:

| Terminal command | What it does |
| --- | --- |
| `omp install` | Register the packaged plugin in Copilot settings |
| `omp version` | Print the installed OMP package version |
| `omp doctor` | Scan project instructions and `.omp` state for stale 2.0 agent IDs |
| `omp help` | Print the packaged skill catalog |
| `omp hud` / `omp hud --watch` | Print or watch the local HUD state |

Use slash commands **inside GitHub Copilot CLI** for agent workflows:

```text
/omp:help
/omp:deep-interview clarify the requirements before implementation
/omp:team implement the approved plan
/omp:code-review review the current changes
```

Availability still depends on the running Copilot host and the selected workflow. In particular, attached-terminal or `tmux` coordination is only available where that runtime exists. Optional MCP servers also require their own configuration and credentials.

## Update

```bash
npm install -g oh-my-githubcopilot@latest
omp install
```

Restart Copilot CLI after reinstalling so its plugin path and bundled assets are reloaded. Then verify the upgrade:

```bash
omp version
omp doctor
```

`omp doctor` is intentionally narrow: it checks repository instructions and OMP state for agent IDs renamed or removed by the 2.0 parity migration. It is not a general Copilot authentication, network, or package-manager health check.

## Safety

- Commit or stash important work before running autonomous or multi-agent workflows; agents may execute commands and edit repository files within the permissions you grant Copilot CLI.
- Review the active repository instructions and workflow prompt before starting a long-running mode.
- Treat `./.omp/` as project-local operational data: inspect generated plans and configuration before sharing or committing them. Treat `~/.omp/` as user-level runtime data: keep its session, HUD, log, and MCP state out of repositories and backups you share.
- `omp install` changes `~/.copilot/settings.json`. With valid JSON it merges plugin and marketplace entries, but it replaces the top-level status-line setting. With missing or invalid JSON it rebuilds the file from OMP defaults. Back up custom settings first if you want an easy rollback.
- Keep credentials out of prompts and repository files. Configure optional MCP integrations through their intended credential flow.
- Report vulnerabilities privately through [GitHub Security Advisories](https://github.com/r3dlex/oh-my-githubcopilot/security/advisories), not a public issue.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `omp: command not found` | Re-run `npm install -g oh-my-githubcopilot`, then ensure npm's global binary directory is on `PATH`. |
| `omp version` works, but `/omp:help` is missing | Run `omp install`, fully restart Copilot CLI, and try `/omp:help` again. |
| `omp install` reports success, but the plugin is still unavailable | Inspect `~/.copilot/settings.json` for the `oh-my-githubcopilot` marketplace and enabled-plugin entries. If the prior file was invalid JSON, `omp install` rebuilt it; restore unrelated settings from your backup, then restart Copilot CLI. |
| `omp doctor` exits non-zero | Read each reported file and line, then replace the stale `@agent` ID with the suggested 2.0 name. |
| `omp hud` says `no active session` | Installation is working, but no hook has emitted session state yet. Start an OMP workflow in Copilot CLI; use `omp hud --watch` only when you want a live terminal view. |
| A workflow needs `tmux` or an attached runtime | Run it from a terminal environment that provides that integration, or choose an in-session workflow that does not require terminal panes. |
| An optional MCP integration fails | Re-run its in-session setup flow and verify that provider-specific credentials and endpoints are available. |

Still stuck? Search [existing issues](https://github.com/r3dlex/oh-my-githubcopilot/issues), open a reproducible bug report, or ask in [Discord](https://discord.gg/PUwSMR9XNk).

## Documentation

- **Choose a workflow:** [`spec/SKILLS.md`](spec/SKILLS.md) and the packaged [`skills/`](skills/) guides
- **Understand agents and delegation:** [`AGENTS.md`](AGENTS.md) and [`spec/AGENTS_SPEC.md`](spec/AGENTS_SPEC.md)
- **Understand the current plugin + extension architecture:** [ADR-0002](docs/architecture/adr/ADR-0002-plugin-plus-extension-architecture.md); [`spec/PLUGIN.md`](spec/PLUGIN.md) contains lower-level background and may lag the shipped manifest
- **Configure or embed the HUD:** [`spec/HUD.md`](spec/HUD.md)
- **Understand state and worktree sessions:** [`spec/PSM.md`](spec/PSM.md)
- **Inspect hooks and failure behavior:** [`spec/HOOKS.md`](spec/HOOKS.md)
- **Contribute or report security issues:** [`CONTRIBUTING.md`](CONTRIBUTING.md) and [`SECURITY.md`](SECURITY.md)
- **Review release changes:** [`CHANGELOG.md`](CHANGELOG.md)

## Community and License

- Join the [Discord community](https://discord.gg/PUwSMR9XNk).
- Report bugs and request features in [GitHub Issues](https://github.com/r3dlex/oh-my-githubcopilot/issues).
- OMP is open source under the [Apache-2.0 License](LICENSE).

## Star History

[![Star History Chart](https://api.star-history.com/chart?repos=r3dlex/oh-my-githubcopilot&type=date&legend=top-left)](https://www.star-history.com/?repos=r3dlex%2Foh-my-githubcopilot&type=date&legend=top-left)

## Sponsors

If omp saves you time, consider [sponsoring the project](https://github.com/sponsors/r3dlex) ❤️

<!-- v3-ai-sdlc-init:start -->
## AI SDLC v3
This repo follows the v3 AI-SDLC layout (`topology_type: standalone`, depth 0). `AGENTS.md` is the single source of truth; `CLAUDE.md` and `GEMINI.md` are thin pointers (ADR-0007). Workflow: [`.ai/workflows/repo-workflow.md`](.ai/workflows/repo-workflow.md) and [`.ai/workflows/repo-workflow.json`](.ai/workflows/repo-workflow.json). See `.ai/matrix.json`, `.memory/human-override/`, and `docs/architecture/adr/`. Modules at `r3dlex/skills/init-ai-repo/modules/`.
<!-- v3-ai-sdlc-init:end -->
