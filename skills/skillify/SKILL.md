---
name: skillify
description: Turn a repeatable workflow from the current session into a reusable OMP skill draft
triggers:
  - /omp:skillify
---

# Skillify

Use this skill when the current session uncovered a repeatable workflow that should become a reusable OMP skill.

## Goal
Capture a successful multi-step workflow as a concrete skill draft instead of rediscovering it later.

## Workflow
1. Identify the repeatable task the session accomplished.
2. Extract:
   - inputs
   - ordered steps
   - success criteria
   - constraints / pitfalls
   - best target location for the skill
3. Decide whether the workflow belongs as:
   - a repo built-in skill (in `skills/` directory of oh-my-githubcopilot)
   - a project learned skill (in `.omp/skills/<skill-name>.md`)
   - documentation only
4. When drafting a learned skill file, output a complete skill file that starts with YAML frontmatter.
   - Never emit plain markdown-only skill files.
   - Minimum frontmatter:
     ```yaml
     ---
     name: <skill-name>
     description: <one-line description>
     triggers:
       - /omp:<skill-name>
       - <keyword-trigger>
     ---
     ```
   - Write learned/project skills to:
     - `.omp/skills/<skill-name>.md`
   - Write repo built-in skills to:
     - `skills/<skill-name>/SKILL.md` in the oh-my-githubcopilot repo
     - `src/skills/<skill-name>.mts` in the oh-my-githubcopilot repo
5. Draft the rest of the skill file with clear triggers, steps, and success criteria.
6. Point out anything still too fuzzy to encode safely.

## State Paths

OMP state uses the `.omp/` prefix:
- `.omp/skills/` — project-local learned skills
- `.omp/state/` — runtime state
- `.omp/notepad.md` — working notepad

## Rules
- Only capture workflows that are actually repeatable.
- Keep the skill practical and scoped.
- Prefer explicit success criteria over vague prose.
- If the workflow still has unresolved branching decisions, note them before drafting.
- Use `omp:` prefix for all skill references, never `omc:` or `oma:`.
- Do not output model parameters (haiku/sonnet/opus) in skill files.

## Output
- Proposed skill name
- Target location (repo built-in or `.omp/skills/`)
- Draft workflow structure
- Open questions, if any
