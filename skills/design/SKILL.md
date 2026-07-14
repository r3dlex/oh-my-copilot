---
name: design
description: UI/UX design and frontend component generation
trigger: "design:, /design"
autoinvoke: false
---
# Skill: Design

## Metadata

| Field | Value |
|-------|-------|
| **ID** | `design` |
| **Keywords** | `design:`, `/design` |
| **Tier** | Frontend Tool |
| **Source** | `src/skills/design.mts` |

## Description

Generates UI/UX designs and frontend components from natural language descriptions. Produces framework-appropriate components (React, Vue, Svelte, etc.), applies the project's existing design system tokens, and writes output files with associated tests. Accepts wireframe descriptions, mockup references, or component specs.

The packaged plugin manifest exposes this workflow as the `design` skill, invoked as `/design` in Copilot CLI.

## Interface

```typescript
interface SkillInput { trigger: string; args: string[]; }
interface SkillOutput { status: "ok" | "error"; message: string; }
export async function activate(input: SkillInput): Promise<SkillOutput>
export function deactivate(): void
```

## Implementation

Triggers UI/UX design and component generation in Copilot. The terminal companion prints guidance directing users to the packaged `/design` skill.

> **P3 scope:** Figma/Sketch import, design token extraction, and Storybook story generation (as specified in SPEC-omp-2.0 §5) are deferred to P3. The current implementation generates components from text descriptions only.
