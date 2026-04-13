// src/skills/setup.mts
async function activate(input2) {
  const { spawn } = await import("child_process");
  const isNonInteractive = input2.args.includes("--non-interactive");
  const isMcpOnly = input2.args.includes("--mcp-only");
  const isSkipMcp = input2.args.includes("--skip-mcp");
  const baseArgs = ["bin/omp.mjs", "setup"];
  if (isMcpOnly) baseArgs.push("--mcp-only");
  if (isSkipMcp) baseArgs.push("--skip-mcp");
  if (isNonInteractive) baseArgs.push("--non-interactive");
  return new Promise((resolve) => {
    const child = spawn("node", baseArgs, { stdio: "inherit" });
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ status: "ok", message: "OMP setup complete." });
      } else {
        resolve({ status: "error", message: `Setup exited with code ${code}` });
      }
    });
    child.on("error", (err) => {
      resolve({ status: "error", message: `Failed to spawn omp setup: ${err.message}` });
    });
  });
}
var input = JSON.parse(await readStdin());
var output = await activate(input);
console.log(JSON.stringify(output));
async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return chunks.join("");
}
export {
  activate
};
//# sourceMappingURL=setup.mjs.map
