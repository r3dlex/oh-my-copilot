// src/skills/mcp-setup.mts
import { spawn } from "child_process";
async function activateMcpSetupSkill(input) {
  const args = input?.args ?? [];
  const isInteractive = args.includes("--interactive") || args.length === 0;
  const spawnArgs = ["setup", "--mcp-only"];
  if (!isInteractive) {
    spawnArgs.push("--non-interactive");
  }
  for (const arg of args) {
    if (arg !== "--interactive" && !spawnArgs.includes(arg)) {
      spawnArgs.push(arg);
    }
  }
  return new Promise((resolve) => {
    const child = spawn("omp", spawnArgs, { stdio: "inherit" });
    child.on("close", (code) => {
      if (code === 0) {
        resolve({
          status: "ok",
          message: "MCP configuration complete.",
          hud: "MCP servers configured."
        });
      } else {
        resolve({
          status: "error",
          message: `MCP configuration exited with code ${code}.`
        });
      }
    });
    child.on("error", (err) => {
      resolve({
        status: "error",
        message: `Failed to spawn omp: ${err.message}`
      });
    });
  });
}
export {
  activateMcpSetupSkill
};
//# sourceMappingURL=mcp-setup.mjs.map
