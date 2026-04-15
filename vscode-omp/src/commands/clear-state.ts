import * as vscode from "vscode";
import { clearWorkflowState, listClearableStateFiles } from "../adapters/state-reader";
import { formatError, requireTrustedWorkspace, requireWorkspace, revealOutput } from "./shared";

export function registerClearStateCommand(
  context: vscode.ExtensionContext,
  outputChannel: vscode.OutputChannel,
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("omp.clearState", async () => {
      await clearState(outputChannel);
    }),
  );
}

async function clearState(outputChannel: vscode.OutputChannel): Promise<void> {
  const workspace = requireWorkspace();
  if (!workspace || !requireTrustedWorkspace("Clear Workflow State")) {
    return;
  }

  const clearableFiles = listClearableStateFiles(workspace.uri.fsPath);
  if (clearableFiles.length === 0) {
    void vscode.window.showInformationMessage("OMP: No workflow state files were found to clear.");
    return;
  }

  const answer = await vscode.window.showWarningMessage(
    `OMP: Clear ${clearableFiles.length} workflow state file(s) for this workspace?`,
    { modal: true },
    "Clear State",
    "Cancel",
  );
  if (answer !== "Clear State") {
    return;
  }

  try {
    outputChannel.clear();
    outputChannel.appendLine("=== OMP Clear Workflow State ===");
    const removedFiles = clearWorkflowState(workspace.uri.fsPath);
    for (const file of removedFiles) {
      outputChannel.appendLine(`Removed ${file}`);
    }
    outputChannel.appendLine(`OMP: Cleared ${removedFiles.length} workflow state file(s).`);
    revealOutput(outputChannel);

    void vscode.window.showInformationMessage(
      `OMP: Cleared ${removedFiles.length} workflow state file(s).`,
    );
  } catch (error) {
    outputChannel.appendLine(`OMP clear-state failed: ${formatError(error)}`);
    revealOutput(outputChannel);
    void vscode.window.showErrorMessage("OMP: Failed to clear workflow state. Check Output > OMP.");
  }
}
