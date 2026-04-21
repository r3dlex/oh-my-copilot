/**
 * omp-reference skill
 *
 * ID:       omp-reference
 * Keywords: (none — auto-loaded as context, not user-invoked)
 * Tier:     reference
 *
 * OMP agent catalog, available tools, team pipeline routing, commit protocol,
 * and skills registry. Auto-loads when delegating to agents, using OMP tools,
 * orchestrating teams, making commits, or invoking skills.
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
  const baseArgs = ["bin/omp.mjs", "omp-reference", ...input.args];
  return new Promise((resolve) => {
    const child = spawn("node", baseArgs, { stdio: "inherit" });
    child.on("close", (code) => {
      resolve({ status: code === 0 ? "ok" : "error", message: `OMP Reference exited with code ${code}` });
    });
    child.on("error", (err) => resolve({ status: "error", message: `Failed to spawn: ${err.message}` }));
  });
}

export function deactivate(): void {
  // No persistent resources to clean up
}
