# oh-my-githubcopilot (omp)

> **Sister projects:** [oh-my-claudecode (OMC)](https://github.com/Yeachan-Heo/oh-my-claudecode) | [oh-my-codex (OMX)](https://github.com/Yeachan-Heo/oh-my-codex) | [oh-my-githubcopilot (OMP)](https://github.com/r3dlex/oh-my-githubcopilot) | [oh-my-antigravity (OMG)](https://github.com/r3dlex/oh-my-antigravity) | [oh-my-auggie (OMA)](https://github.com/r3dlex/oh-my-auggie)

**Orquestación multiagente para GitHub Copilot CLI.**

[Quick Start](README.md#quick-start) • [Mental model](README.md#mental-model) • [Troubleshooting](README.md#troubleshooting) • [Discord](https://discord.gg/PUwSMR9XNk)

> **Canonical guide:** See [README.md](README.md) for the current detailed installation, safety, limits, and troubleshooting guide.

---

## ¿Por qué omp?

Todo equipo de software gestiona implementación, arquitectura, revisión de seguridad, pruebas y DevOps al mismo tiempo. omp orquesta agentes especializados para que cada dimensión reciba atención experta en paralelo, sin que tengas que pastorear gatos.

GitHub Copilot ya es el lugar donde muchos desarrolladores piden ayuda; omp convierte esa superficie en un equipo de ingeniería coordinado. Mantiene agentes, habilidades, hooks, configuración MCP y estado HUD para Copilot en un flujo predecible para pasar del prompt a una entrega verificada sin cablear la orquestación a mano.

---

<a id="quick-start"></a>
## Inicio rápido

```bash
npm install -g oh-my-githubcopilot
omp install
```

Después del setup, reinicia tu CLI para que aparezcan los comandos `/`.

```bash
omp version             # verify the installed version
omp doctor              # check stale 2.0 agent references
omp hud --watch         # optional live HUD view
```

---

## Funciones

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
## Referencia CLI

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
## Flujos de trabajo

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

## Modo Team

tmux-first multi-worker orchestration with persistent state and lifecycle controls.

```text
/team review src/ for reliability gaps
```

Para GitHub Copilot CLI, el modo team mantiene sincronizados los agentes y habilidades de `.copilot/` mientras los workers de terminal se coordinan mediante estado durable OMX/OMP. Úsalo cuando una tarea de Copilot necesite carriles separados de implementación, verificación, documentación o release y quieras evidencia de cada carril antes de avanzar el branch.

---

## Documentación

- [Full Documentation](https://github.com/r3dlex/oh-my-githubcopilot#readme)
- [GitHub Repository](https://github.com/r3dlex/oh-my-githubcopilot)
- [Issues](https://github.com/r3dlex/oh-my-githubcopilot/issues)
- [Security Policy](https://github.com/r3dlex/oh-my-githubcopilot/security)

---

## Licencia

omp is open source under the [Apache-2.0 License](LICENSE).

---

## Patrocinadores

If omp saves you time, consider [sponsoring the project](https://github.com/sponsors/r3dlex) ❤️
