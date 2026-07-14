# oh-my-githubcopilot (omp)

> **Sister projects:** [oh-my-claudecode (OMC)](https://github.com/Yeachan-Heo/oh-my-claudecode) | [oh-my-codex (OMX)](https://github.com/Yeachan-Heo/oh-my-codex) | [oh-my-githubcopilot (OMP)](https://github.com/r3dlex/oh-my-githubcopilot) | [oh-my-antigravity (OMG)](https://github.com/r3dlex/oh-my-antigravity) | [oh-my-auggie (OMA)](https://github.com/r3dlex/oh-my-auggie)

**Multi-Agent-Orchestrierung für GitHub Copilot CLI.**

[Quick Start](README.md#quick-start) • [Mental model](README.md#mental-model) • [Troubleshooting](README.md#troubleshooting) • [Discord](https://discord.gg/PUwSMR9XNk)

> **Canonical guide:** See [README.md](README.md) for the current detailed installation, safety, limits, and troubleshooting guide.

---

## Warum omp?

Jedes Softwareteam jongliert gleichzeitig mit Implementierung, Architektur, Sicherheitsprüfung, Tests und DevOps. omp orchestriert spezialisierte Agenten, damit jede Dimension parallel fachkundige Aufmerksamkeit erhält — ohne dass du die Katzen hüten musst.

GitHub Copilot ist bereits der Ort, an dem viele Entwickler um Hilfe bitten; omp macht daraus ein koordiniertes Engineering-Team. Es bündelt Copilot-Agenten, Skills, Hooks, MCP-Setup und HUD-Zustand in einem vorhersehbaren Workflow, damit du vom Prompt zur verifizierten Lieferung kommst, ohne die Orchestrierung von Hand zu verdrahten.

---

<a id="quick-start"></a>
## Schnellstart

```bash
npm install -g oh-my-githubcopilot
omp install
```

Starte deine CLI nach dem Setup neu, damit die `/`-Befehle erscheinen.

```bash
omp version             # verify the installed version
omp doctor              # check stale 2.0 agent references
omp hud --watch         # optional live HUD view
```

---

## Funktionen

| Feature | Description |
|---------|-------------|
| **Specialized Agents** | Agent roles for analysis, architecture, execution, debugging, review, testing, documentation, and more |
| **Parallel Team Mode** | tmux-based multi-worker orchestration with shared task state |
| **Workflow Skills** | 59 skills built in — plan, deep-interview, ralph, autopilot, ultrawork, code-review, and more |
| **Persistent Hooks** | Automatic tool tracking, project memory, session management |
| **Real-time HUD** | Live status overlay showing agents, costs, and progress |
| **Multilingual** | README in 12 languages |

---

<a id="cli-reference"></a>
## CLI-Referenz

| Command | Description |
|---------|-------------|
| `omp install` | Register OMP with GitHub Copilot CLI |
| `omp version` | Show the installed OMP version |
| `omp doctor` | Check for stale 2.0 agent references |
| `omp help` | Show the packaged skill catalog |
| `omp hud --watch` | Show live status overlay |

See the [full documentation](https://github.com/r3dlex/oh-my-githubcopilot#readme) for all commands.

---

<a id="workflows"></a>
## Workflows

omp ships execution-mode and planning-mode workflows as built-in skills.

### Execution Modes

| Skill | Purpose |
|-------|---------|
| `$autopilot` | Idea → working code end-to-end |
| `$team` | N coordinated agents on a shared task |
| `$ralph` | Persistent completion loop until verified |
| `$ultrawork` | Maximum parallel throughput execution |
| `$ultraqa` | QA cycling until goals are met |

### Planning Modes

| Skill | Purpose |
|-------|---------|
| `$plan` | Strategic planning with optional interviews |
| `$deep-interview` | Socratic clarification before execution |
| `$ralplan` | Consensus planning with Architect + Critic review |

### Utility Modes

| Skill | Purpose |
|-------|---------|
| `$code-review` | Comprehensive code review |
| `$security-review` | Security audit |
| `$doctor` | Diagnose and fix installation issues |
| `$trace` | Agent flow trace and summary |
| `$note` | Save session notes |
| `$wiki` | Persistent project wiki |

---

## Team-Modus

tmux-first multi-worker orchestration with persistent state and lifecycle controls.

```text
/omp:team review src/ for reliability gaps
```

Für GitHub Copilot CLI hält Team-Modus die Agenten- und Skill-Assets unter `.copilot/` synchron, während Terminal-Worker sich über langlebigen OMX/OMP-Zustand koordinieren. Nutze ihn, wenn eine Copilot-Aufgabe getrennte Implementierungs-, Prüf-, Dokumentations- oder Release-Lanes braucht und jede Lane Evidenz melden soll, bevor der Branch weiterläuft.

---

## Dokumentation

- [Full Documentation](https://github.com/r3dlex/oh-my-githubcopilot#readme)
- [GitHub Repository](https://github.com/r3dlex/oh-my-githubcopilot)
- [Issues](https://github.com/r3dlex/oh-my-githubcopilot/issues)
- [Security Policy](https://github.com/r3dlex/oh-my-githubcopilot/security)

---

## Lizenz

omp is open source under the [Apache-2.0 License](LICENSE).

---

## Sponsoren

If omp saves you time, consider [sponsoring the project](https://github.com/sponsors/r3dlex) ❤️
