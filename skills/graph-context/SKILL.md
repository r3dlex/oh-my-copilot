---
name: graph-context
description: Load codebase context from knowledge graph instead of scanning raw files
invocation: auto (injected by session-start when graph provider is configured)
autoinvoke: true
---
# Skill: Graph Context

## Metadata

| Field | Value |
|-------|-------|
| **ID** | `graph-context` |
| **Keywords** | `graph-context:`, `/graph-context` |
| **Tier** | Context Tool |
| **Source** | `src/skills/graph-context.mts` |

## Description

Load codebase context from a knowledge graph instead of scanning raw files. Auto-injected at session start when a graph provider is configured. Dramatically reduces token cost for codebase exploration.

## Cross-Reference: graph-provider

For engine selection (graphify vs graphwiki) and provider management, use the `graph-provider` skill (`/omp:graph-provider`). Graph-context uses the provider configured there. Relationship:

| Skill | Role |
|-------|------|
| `graph-provider` | Manages which engine is active; set/switch/build/query |
| `graph-context` | Reads context from the active provider at session start |

Provider configuration is stored in `.omp/config.json` under `graph.provider`. Resolution order: local > global > default (`graphwiki`).

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

Spawns `bin/omp.mjs graph-context [args]`. No persistent resources are maintained.

## Provider: graphwiki

If `graphwiki-out/` exists:

1. Read `graphwiki-out/GRAPH_REPORT.md` for project overview (~1-2K tokens)
2. Use `graphwiki path <nodeA> <nodeB>` for structural queries (0 extra tokens)
3. Read `graphwiki-out/wiki/index.md` to find relevant pages (~1-3K tokens)
4. Read targeted wiki pages (~2-5K each, max 3 pages per query)
5. Only read raw source files if wiki page is missing or confidence is low

### Commands

| Command | Use When |
|---------|----------|
| `graphwiki query "<question>"` | General questions about the codebase |
| `graphwiki path <nodeA> <nodeB>` | How two modules/concepts connect |
| `graphwiki status` | Check graph health and drift score |
| `graphwiki lint` | Find contradictions in the graph |
| `graphwiki build . --update` | After changing files (incremental) |
| `graphwiki build . --resume` | Resume a crashed/interrupted build |
| `graphwiki ingest <file>` | Add a new file to the graph |
| `graphwiki benchmark "<question>"` | Measure token cost of a query |

### Hard Constraints
- **NEVER** modify files in `raw/` (immutable source files)
- **NEVER** modify files in `graphwiki-out/` (auto-generated output)
- Maximum 3 wiki pages per query (token budget)

## Provider: graphify

If `graphify-out/` exists:

1. Read `graphify-out/GRAPH_REPORT.md` for project overview
2. Use `graphify query "<question>"` for targeted lookups
3. Use `graphify path "<nodeA>" "<nodeB>"` for structural connections
4. Read `graphify-out/graph.json` only for programmatic traversal
5. Only read raw source files if graph data is insufficient

### Commands

| Command | Use When |
|---------|----------|
| `/graphify query "<question>"` | General codebase questions (BFS) |
| `/graphify query "<question>" --dfs` | Trace a specific path (DFS) |
| `/graphify path "<nodeA>" "<nodeB>"` | Shortest path between two concepts |
| `/graphify explain "<node>"` | Understand what a specific node does |
| `/graphify .` | Full rebuild of the knowledge graph |
| `/graphify . --update` | Incremental rebuild (changed files only) |
| `/graphify . --wiki` | Generate agent-crawlable wiki output |
| `/graphify add <url>` | Fetch and add a URL to the graph |
| `/graphify . --watch` | Auto-rebuild on file changes |
| `/graphify . --mcp` | Start MCP stdio server for agent access |

### Hard Constraints
- **NEVER** modify files in `graphify-out/` (auto-generated output)
- `graphify-out/graph.json` is for programmatic traversal only. Use query/path commands.

## Token Budget

The entire point of using a graph provider is to avoid re-reading raw source files every session. A 50-file codebase costs ~100K+ tokens to read raw. The graph reduces this to ~2-5K tokens per query.

Do NOT fall back to reading raw files unless the graph explicitly lacks the information needed.

## State

Provider selection is stored in `.omp/config.json`. No session-level state is maintained by this skill.
