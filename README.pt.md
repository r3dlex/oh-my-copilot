# oh-my-githubcopilot (omp)

> **Sister projects:** [oh-my-claudecode (OMC)](https://github.com/Yeachan-Heo/oh-my-claudecode) | [oh-my-codex (OMX)](https://github.com/Yeachan-Heo/oh-my-codex) | [oh-my-githubcopilot (OMP)](https://github.com/r3dlex/oh-my-githubcopilot) | [oh-my-antigravity (OMG)](https://github.com/r3dlex/oh-my-antigravity) | [oh-my-auggie (OMA)](https://github.com/r3dlex/oh-my-auggie)

**Orquestração multiagente para GitHub Copilot CLI.**

[Quick Start](README.md#quick-start) • [Mental model](README.md#mental-model) • [Troubleshooting](README.md#troubleshooting) • [Discord](https://discord.gg/PUwSMR9XNk)

> **Canonical guide:** See [README.md](README.md) for the current detailed installation, safety, limits, and troubleshooting guide.

---

## Por que omp?

Toda equipe de software lida com implementação, arquitetura, revisão de segurança, testes e DevOps ao mesmo tempo. omp orquestra agentes especializados para que cada dimensão receba atenção especializada em paralelo.

GitHub Copilot já é onde muitos desenvolvedores pedem ajuda; omp transforma essa superfície em uma equipe de engenharia coordenada. Ele mantém agentes, skills, hooks, configuração MCP e estado HUD voltados ao Copilot em um fluxo previsível, do prompt à entrega verificada.

---

<a id="quick-start"></a>
## Início rápido

```bash
npm install -g oh-my-githubcopilot
omp install
```

Depois do setup, reinicie sua CLI para que os comandos `/` apareçam.

```bash
omp version             # verify the installed version
omp doctor              # check stale 2.0 agent references
omp hud --watch         # optional live HUD view
```

---

## Recursos

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
## Referência CLI

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
## Fluxos de trabalho

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
/omp:team review src/ for reliability gaps
```

Para GitHub Copilot CLI, o modo team mantém os ativos de agentes e skills em `.copilot/` sincronizados enquanto workers de terminal se coordenam via estado durável OMX/OMP. Use quando uma tarefa do Copilot precisar de trilhas separadas de implementação, verificação, documentação ou release com evidências antes de avançar o branch.

---

## Documentação

- [Full Documentation](https://github.com/r3dlex/oh-my-githubcopilot#readme)
- [GitHub Repository](https://github.com/r3dlex/oh-my-githubcopilot)
- [Issues](https://github.com/r3dlex/oh-my-githubcopilot/issues)
- [Security Policy](https://github.com/r3dlex/oh-my-githubcopilot/security)

---

## Licença

omp is open source under the [Apache-2.0 License](LICENSE).

---

## Patrocinadores

If omp saves you time, consider [sponsoring the project](https://github.com/sponsors/r3dlex) ❤️
