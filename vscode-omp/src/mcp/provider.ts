import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import * as vscode from "vscode";

interface McpRuntimeResolution {
  command: string;
  args: string[];
  displayPath: string;
}

interface VscodeMcpApi {
  lm?: {
    registerMcpServerDefinitionProvider?: (
      id: string,
      provider: { provideMcpServerDefinitions(): unknown[] },
    ) => vscode.Disposable;
  };
  McpStdioServerDefinition?: new (
    label: string,
    command: string,
    args: string[],
    env?: Record<string, string>,
  ) => unknown;
}

export async function registerMcpProvider(
  context: vscode.ExtensionContext,
  workspace: vscode.WorkspaceFolder,
  outputChannel: vscode.OutputChannel,
): Promise<void> {
  if (!vscode.workspace.isTrusted) {
    outputChannel.appendLine("OMP: Skipping MCP registration because the workspace is untrusted.");
    return;
  }

  const runtime = resolveMcpRuntime(workspace.uri.fsPath);
  if (!runtime) {
    outputChannel.appendLine("OMP: No MCP runtime was found in the workspace or installed OMP package.");
    return;
  }

  const mcpApi = vscode as typeof vscode & VscodeMcpApi;
  const registerProvider = mcpApi.lm?.registerMcpServerDefinitionProvider;
  const McpDefinition = mcpApi.McpStdioServerDefinition;

  if (typeof registerProvider === "function" && typeof McpDefinition === "function") {
    const disposable = registerProvider("ompMcpProvider", {
      provideMcpServerDefinitions(): unknown[] {
        if (!vscode.workspace.isTrusted) {
          return [];
        }

        const latestRuntime = resolveMcpRuntime(workspace.uri.fsPath);
        if (!latestRuntime) {
          return [];
        }

        return [
          new McpDefinition("OMP Workflow", latestRuntime.command, latestRuntime.args, {
            OMP_LOG_LEVEL: "info",
            WORKSPACE_ROOT: workspace.uri.fsPath,
          }),
        ];
      },
    });

    context.subscriptions.push(disposable);
    outputChannel.appendLine(`OMP: Registered MCP provider for ${runtime.displayPath}.`);
    return;
  }

  outputChannel.appendLine("OMP: VS Code MCP provider API unavailable; offering .vscode/mcp.json fallback.");
  await offerFallbackConfig(workspace, runtime, outputChannel);
}

function resolveMcpRuntime(workspaceRoot: string): McpRuntimeResolution | undefined {
  const candidates = [
    join(workspaceRoot, "dist", "mcp", "server.mjs"),
    join(workspaceRoot, ".omp", "dist", "mcp", "server.mjs"),
    join(workspaceRoot, "node_modules", "oh-my-githubcopilot", "dist", "mcp", "server.mjs"),
  ];

  const serverPath = candidates.find((candidate) => existsSync(candidate));
  if (!serverPath) {
    return undefined;
  }

  return {
    command: "node",
    args: [serverPath],
    displayPath: relative(workspaceRoot, serverPath) || serverPath,
  };
}

async function offerFallbackConfig(
  workspace: vscode.WorkspaceFolder,
  runtime: McpRuntimeResolution,
  outputChannel: vscode.OutputChannel,
): Promise<void> {
  const choice = await vscode.window.showInformationMessage(
    "OMP: VS Code's MCP provider API is unavailable. Create a trusted-workspace fallback .vscode/mcp.json?",
    "Create Config",
    "Not Now",
  );

  if (choice !== "Create Config") {
    return;
  }

  const configPath = join(workspace.uri.fsPath, ".vscode", "mcp.json");
  const desiredConfig = buildFallbackConfig(workspace.uri.fsPath, runtime);
  const serialized = JSON.stringify(desiredConfig, null, 2);

  if (existsSync(configPath)) {
    const current = readFileSync(configPath, "utf8");
    if (current.trim() === serialized.trim()) {
      outputChannel.appendLine("OMP: Existing .vscode/mcp.json already matches the desired fallback config.");
      return;
    }

    outputChannel.appendLine("OMP: Existing .vscode/mcp.json differs; leaving it untouched.");
    void vscode.window.showWarningMessage(
      "OMP: Existing .vscode/mcp.json differs from the OMP fallback template and was not overwritten.",
    );
    return;
  }

  mkdirSync(dirname(configPath), { recursive: true });
  writeFileSync(configPath, serialized);
  outputChannel.appendLine("OMP: Created .vscode/mcp.json fallback configuration.");
  void vscode.window.showInformationMessage("OMP: Created .vscode/mcp.json for MCP fallback mode.");
}

function buildFallbackConfig(workspaceRoot: string, runtime: McpRuntimeResolution): object {
  const relativeRuntimePath = relative(workspaceRoot, runtime.args[0] ?? "");
  const normalizedRuntimePath = relativeRuntimePath.startsWith(".")
    ? relativeRuntimePath
    : `./${relativeRuntimePath}`;

  return {
    schemaVersion: "1.0",
    mcpServers: {
      "oh-my-githubcopilot": {
        type: "stdio",
        command: runtime.command,
        args: [normalizedRuntimePath],
        env: {
          OMP_LOG_LEVEL: "info",
          WORKSPACE_ROOT: "${workspaceFolder}",
        },
      },
    },
  };
}
