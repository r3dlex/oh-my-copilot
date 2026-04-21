---
name: session
description: Worktree and tmux session management. Use for "new session", "worktree", "tmux", and "session management".
trigger: "session:, /session, /omp:session"
autoinvoke: false
---
# Skill: Session

## Metadata

| Field | Value |
|-------|-------|
| **ID** | `session` |
| **Keywords** | `session:`, `/session` |
| **Tier** | Developer Tool |
| **Source** | `src/skills/session.mts` |

## Description

Manage development sessions with git worktrees and tmux. Create, attach, detach, list, and end sessions with isolated worktrees for parallel development.

## Differentiation from psm

| Aspect | session | psm |
|--------|---------|-----|
| **Scope** | Git worktrees + tmux sessions for development isolation | OMP Plugin State Manager — inspect and update plugin runtime state |
| **Manages** | Branches, worktrees, tmux windows/panes, session lifecycle | OMP internal state, session metadata, plugin config values |
| **Use when** | You need to create/switch/end a development context | You need to inspect or modify OMP's running plugin state |

## Interface

```typescript
interface SkillInput {
  trigger: string;
  args: string[];
}

interface SkillOutput {
  status: "ok" | "error";
  message: string;
}

export async function activate(input: SkillInput): Promise<SkillOutput>
export function deactivate(): void
```

## Implementation

Spawns `bin/omp.mjs session [args]`. No persistent resources are maintained.

## When to Use

- Creating new branches
- Managing multiple tasks
- Isolating work
- Session recovery
- Parallel development

## Session Types

### Development Session
- Feature work
- Bug fixes
- Single focused task

### Exploration Session
- Research
- Prototyping
- Proof of concept

### Review Session
- Code review
- Pair programming
- Pair review

## Worktree Management

### Create Worktree
```bash
git worktree add {path} {branch}
```

### List Worktrees
```bash
git worktree list
```

### Remove Worktree
```bash
git worktree remove {path}
```

### Worktree for Feature
```
{project}-feature-{name}
```

## Tmux Session Management

### Session Structure
```
session:{project}
  └── window:feature-{name}
      └── pane: editor
      └── pane: terminal
      └── pane: tests
```

### Commands
```bash
# Create session
tmux new-session -s {name} -d

# Attach
tmux attach -t {name}

# List
tmux list-sessions

# Kill
tmux kill-session -t {name}
```

## Session Workflow

### Start New Feature
1. Create worktree
2. Start tmux session
3. Set up windows/panes
4. Track session info
5. Begin work

### Switch Context
1. Detach current session
2. Attach target session
3. Resume work

### End Session
1. Commit changes
2. Push if needed
3. Clean up tmux
4. Optionally remove worktree
5. Log session summary

## Commands

### Start Session
```
/omp:session start {name}
```

### Attach Session
```
/omp:session attach {name}
```

### Detach Session
```
/omp:session detach
```

### List Sessions
```
/omp:session list
```

### End Session
```
/omp:session end {name}
```

### Create Worktree
```
/omp:session worktree create {branch} {path}
```

## State

Session state is stored in `.omp/sessions/`. Each session has a JSON record with worktree path, branch, tmux session name, and timestamps.

## Output Format

```
## Session: {name}

### Type
{type}

### Worktree
**Path:** {path}
**Branch:** {branch}
**Status:** {clean|dirty}

### Tmux
**Session:** {tmux-session}
**Windows:** {n}
**Created:** {date}
**Last active:** {date}

### Windows
| Window | Panes | Current |
|--------|-------|---------|
| {name} | {n} | {yes/no} |

### Recent Sessions
| Name | Type | Last Active | Status |
|------|------|-------------|--------|
| {name} | {type} | {date} | {active/ended} |

### Session Notes
{notes}
```

## Constraints

- Clean up completed sessions
- Don't forget worktree paths
- Keep session names unique
- Document session purpose
- Backup before major changes
