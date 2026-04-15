import * as vscode from "vscode";
import { registerClearStateCommand } from "./commands/clear-state";
import { registerHealthCheckCommand } from "./commands/health-check";
import { registerInitializeCommand } from "./commands/initialize";
import { registerShowStatusCommand } from "./commands/show-status";
import { registerUpdateFilesCommand } from "./commands/update-files";
import { registerMcpProvider } from "./mcp/provider";
import { createStatusBar } from "./ui/status-bar";
import { registerTreeViews } from "./ui/tree-view";

export function activate(context: vscode.ExtensionContext): void {
  const outputChannel = vscode.window.createOutputChannel("OMP");
  outputChannel.appendLine("OMP VS Code extension activated.");

  registerInitializeCommand(context, outputChannel);
  registerUpdateFilesCommand(context, outputChannel);
  registerHealthCheckCommand(context, outputChannel);
  registerShowStatusCommand(context, outputChannel);
  registerClearStateCommand(context, outputChannel);
  context.subscriptions.push(outputChannel);

  const workspace = vscode.workspace.workspaceFolders?.[0];
  if (!workspace) {
    outputChannel.appendLine("OMP: no workspace folder is open; UI helpers are idle.");
    return;
  }

  registerTreeViews(context, workspace);
  createStatusBar(context, workspace);
  initializeTrustedFeatures(context, workspace, outputChannel);

  context.subscriptions.push(
    vscode.workspace.onDidGrantWorkspaceTrust(() => {
      outputChannel.appendLine("OMP: workspace trust granted; enabling background features.");
      initializeTrustedFeatures(context, workspace, outputChannel);
    }),
  );
}

function initializeTrustedFeatures(
  context: vscode.ExtensionContext,
  workspace: vscode.WorkspaceFolder,
  outputChannel: vscode.OutputChannel,
): void {
  if (!vscode.workspace.isTrusted) {
    outputChannel.appendLine("OMP: background features are gated until the workspace is trusted.");
    return;
  }

  const extensionState = context.workspaceState;
  if (!extensionState.get<boolean>("omp.mcpProviderRegistered")) {
    const registered = registerMcpProvider(context, workspace, outputChannel);
    if (registered) {
      void extensionState.update("omp.mcpProviderRegistered", true);
    }
  }
}

export function deactivate(): void {
  // VS Code disposes registered subscriptions automatically.
}
