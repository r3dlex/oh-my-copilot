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

  const workspace = vscode.workspace.workspaceFolders?.[0];
  let backgroundFeaturesStarted = false;

  if (workspace) {
    registerTreeViews(context, workspace);

    const startBackgroundFeatures = (): void => {
      if (backgroundFeaturesStarted) {
        return;
      }

      backgroundFeaturesStarted = true;
      const config = vscode.workspace.getConfiguration("omp");

      if (config.get<boolean>("showStatusBar", true)) {
        createStatusBar(context, workspace);
      }

      if (config.get<boolean>("autoRegisterMcp", true)) {
        void registerMcpProvider(context, workspace, outputChannel);
      }
    };

    if (vscode.workspace.isTrusted) {
      startBackgroundFeatures();
    } else {
      outputChannel.appendLine("OMP: Workspace is untrusted; UI is visible, but status/MCP background features are deferred.");
    }

    context.subscriptions.push(
      vscode.workspace.onDidGrantWorkspaceTrust(() => {
        outputChannel.appendLine("OMP: Workspace trust granted. Starting background features.");
        startBackgroundFeatures();
      }),
    );
  }

  context.subscriptions.push(outputChannel);
}

export function deactivate(): void {
  // VS Code disposes registered subscriptions automatically.
}
