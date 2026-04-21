/**
 * notifications skill
 *
 * ID:       notifications
 * Keywords: notifications:, /notifications, /omp:notifications
 * Tier:     developer tool
 *
 * Send and manage runtime notifications across Telegram, Discord, Slack, and Email.
 * Handles immediate alerts, digests, and escalation patterns.
 * For initial channel setup, use configure-notifications instead.
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
  const baseArgs = ["bin/omp.mjs", "notifications", ...input.args];
  return new Promise((resolve) => {
    const child = spawn("node", baseArgs, { stdio: "inherit" });
    child.on("close", (code) => {
      resolve({ status: code === 0 ? "ok" : "error", message: `Notifications exited with code ${code}` });
    });
    child.on("error", (err) => resolve({ status: "error", message: `Failed to spawn: ${err.message}` }));
  });
}

export function deactivate(): void {
  // No persistent resources to clean up
}
