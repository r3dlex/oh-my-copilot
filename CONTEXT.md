# Domain Context

## Project Session

A worktree-backed development context with a name, branch, lifecycle status,
and recent activity. A Project Session identifies where work is performed.

## Session State

A durable snapshot of OMP runtime activity, including orchestration state tied
to an optional worktree. A Session State records what OMP was doing.

Project Sessions and Session States are distinct records with incompatible
schemas.
