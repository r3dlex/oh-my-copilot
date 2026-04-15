import * as vscode from "vscode";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

interface CopilotCliConfig {
  trusted_folders?: string[];
}

export function registerMcpProvider(
  context: vscode.ExtensionContext,
  workspace: vscode.WorkspaceFolder,
  outputChannel: vscode.OutputChannel,
): boolean {
  if (!vscode.workspace.isTrusted) {
    outputChannel.appendLine("OMP: Workspace is untrusted; MCP provider registration skipped.");
    return false;
  }

  if (!isCopilotTrusted(workspace.uri.fsPath)) {
    outputChannel.appendLine(
      `OMP: ${workspace.uri.fsPath} is not listed in ~/.copilot/config.json trusted_folders; MCP tools remain gated.`,
    );
    return false;
  }

  if (typeof vscode.lm?.registerMcpServerDefinitionProvider !== "function") {
    outputChannel.appendLine("OMP: VS Code MCP provider API unavailable; writing static .vscode/mcp.json fallback.");
    ensureStaticMcpConfig(workspace, outputChannel);
    return true;
  }

  const disposable = vscode.lm.registerMcpServerDefinitionProvider("ompMcpProvider", {
    provideMcpServerDefinitions: async () => {
      if (!vscode.workspace.isTrusted || !isCopilotTrusted(workspace.uri.fsPath)) {
        return [];
      }

      const serverDist = resolveBundledMcpEntry(workspace.uri.fsPath);
      if (!serverDist) {
        outputChannel.appendLine("OMP: dist/mcp/server.mjs not found; MCP provider withheld until the workspace is built.");
        return [];
      }

      return [
        new vscode.McpStdioServerDefinition(
          "OMP Workspace",
          "node",
          [serverDist],
          {
            OMP_WORKSPACE_ROOT: workspace.uri.fsPath,
            OMX_TEAM_STATE_ROOT: join(workspace.uri.fsPath, ".omx", "state"),
          },
        ),
      ];
    },
  });

  context.subscriptions.push(disposable);
  outputChannel.appendLine("OMP: MCP server definition provider registered.");
  return true;
}

function resolveBundledMcpEntry(workspaceRoot: string): string | undefined {
  const candidate = join(workspaceRoot, "dist", "mcp", "server.mjs");
  return existsSync(candidate) ? candidate : undefined;
}

function ensureStaticMcpConfig(workspace: vscode.WorkspaceFolder, outputChannel: vscode.OutputChannel): void {
  const serverDist = resolveBundledMcpEntry(workspace.uri.fsPath);
  if (!serverDist) {
    outputChannel.appendLine("OMP: dist/mcp/server.mjs not found; static MCP fallback not written.");
    return;
  }

  const configPath = join(workspace.uri.fsPath, ".vscode", "mcp.json");
  mkdirSync(dirname(configPath), { recursive: true });

  const config = {
    servers: {
      omp: {
        type: "stdio",
        command: "node",
        args: ["${workspaceFolder}/dist/mcp/server.mjs"],
        env: {
          OMP_WORKSPACE_ROOT: "${workspaceFolder}",
          OMX_TEAM_STATE_ROOT: "${workspaceFolder}/.omx/state",
        },
      },
    },
  };

  writeFileSync(configPath, JSON.stringify(config, null, 2));
  outputChannel.appendLine(`OMP: Wrote MCP fallback config to ${configPath}.`);
}

function isCopilotTrusted(workspaceRoot: string): boolean {
  const configPath = join(homedir(), ".copilot", "config.json");
  if (!existsSync(configPath)) {
    return true;
  }

  try {
    const config = JSON.parse(readFileSync(configPath, "utf8")) as CopilotCliConfig;
    const trustedFolders = config.trusted_folders;
    if (!Array.isArray(trustedFolders) || trustedFolders.length === 0) {
      return true;
    }

    return trustedFolders.some((trustedFolder) =>
      workspaceRoot === trustedFolder || workspaceRoot.startsWith(`${trustedFolder}/`),
    );
  } catch {
    return true;
  }
}
