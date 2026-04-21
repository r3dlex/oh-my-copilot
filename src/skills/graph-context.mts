/**
 * graph-context skill
 *
 * ID:       graph-context
 * Keywords: graph-context:, /graph-context, /omp:graph-context
 * Tier:     context tool
 *
 * Load codebase context from knowledge graph instead of scanning raw files.
 * Auto-injected at session start when a graph provider is configured.
 * Provider selection managed by the graph-provider skill.
 */

export interface SkillInput {
  trigger: string;
  args: string[];
}

export interface SkillOutput {
  status: "ok" | "error";
  message: string;
}

export async function activate(input: SkillInput): Promise<SkillOutput> {
  const { spawn } = await import("child_process");
  const baseArgs = ["bin/omp.mjs", "graph-context", ...input.args];
  return new Promise((resolve) => {
    const child = spawn("node", baseArgs, { stdio: "inherit" });
    child.on("close", (code) => {
      resolve({ status: code === 0 ? "ok" : "error", message: `Graph-context exited with code ${code}` });
    });
    child.on("error", (err) => resolve({ status: "error", message: `Failed to spawn: ${err.message}` }));
  });
}

export function deactivate(): void {
  // No persistent resources to clean up
}
