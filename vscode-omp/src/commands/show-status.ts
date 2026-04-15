import * as vscode from "vscode";
import { readWorkflowStates } from "../adapters/state-reader";
import { requireWorkspace, revealOutput } from "./shared";

export function registerShowStatusCommand(
  context: vscode.ExtensionContext,
  outputChannel: vscode.OutputChannel,
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("omp.showStatus", async () => {
      await showStatus(outputChannel);
    }),
  );
}

async function showStatus(outputChannel: vscode.OutputChannel): Promise<void> {
  const workspace = requireWorkspace();
  if (!workspace) {
    return;
  }

  const workflowStates = readWorkflowStates(workspace.uri.fsPath);
  outputChannel.clear();
  outputChannel.appendLine("=== OMP Workflow Status ===");
  outputChannel.appendLine(`Workspace: ${workspace.uri.fsPath}`);
  outputChannel.appendLine("");

  if (workflowStates.length === 0) {
    outputChannel.appendLine("No OMP workflow state files were found.");
    void vscode.window.showInformationMessage("OMP: No workflow state found for this workspace.", "Open Output").then(
      (selection) => {
        if (selection === "Open Output") {
          revealOutput(outputChannel);
        }
      },
    );
    return;
  }

  const activeStates = workflowStates.filter((state) => state.active);
  for (const state of workflowStates) {
    outputChannel.appendLine(`• ${state.label}`);
    outputChannel.appendLine(`  file: ${state.file}`);
    outputChannel.appendLine(`  active: ${String(state.active)}`);
    if (state.phase) outputChannel.appendLine(`  phase: ${state.phase}`);
    if (state.iteration !== undefined) outputChannel.appendLine(`  iteration: ${state.iteration}`);
    if (state.updatedAt) outputChannel.appendLine(`  updated: ${state.updatedAt}`);
    if (state.description) outputChannel.appendLine(`  task: ${state.description}`);
    outputChannel.appendLine("");
  }

  revealOutput(outputChannel);
  if (activeStates.length > 0) {
    void vscode.window.showInformationMessage(
      `OMP: ${activeStates.length} active workflow${activeStates.length === 1 ? "" : "s"} detected.`,
    );
    return;
  }

  void vscode.window.showInformationMessage("OMP: No active workflows, but historical state was found.");
}
