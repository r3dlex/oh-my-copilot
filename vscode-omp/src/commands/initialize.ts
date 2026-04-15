import * as vscode from "vscode";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { findBundledTemplateProblems, syncBundledTemplates } from "../adapters/template-sync";
import { formatError, requireTrustedWorkspace, requireWorkspace, revealOutput } from "./shared";

export function registerInitializeCommand(
  context: vscode.ExtensionContext,
  outputChannel: vscode.OutputChannel,
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("omp.initWorkspace", async () => {
      await initializeWorkspace(context, outputChannel);
    }),
  );
}

async function initializeWorkspace(
  context: vscode.ExtensionContext,
  outputChannel: vscode.OutputChannel,
): Promise<void> {
  const workspace = requireWorkspace();
  if (!workspace || !requireTrustedWorkspace("Initialize Workspace")) {
    return;
  }

  const templateProblems = findBundledTemplateProblems(context.extensionPath);
  if (templateProblems.length > 0) {
    void vscode.window.showErrorMessage(
      "OMP: Bundled templates are missing. Rebuild the extension package and try again.",
    );
    outputChannel.appendLine(`OMP init aborted: missing templates → ${templateProblems.join(", ")}`);
    revealOutput(outputChannel);
    return;
  }

  const existingTargets = [".copilot", ".github/hooks"].map((relativePath) =>
    existsSync(join(workspace.uri.fsPath, relativePath)),
  );
  if (existingTargets.some(Boolean)) {
    const answer = await vscode.window.showWarningMessage(
      "OMP: This workspace already contains OMP convention files. Overwrite the managed files?",
      { modal: true },
      "Overwrite",
      "Cancel",
    );
    if (answer !== "Overwrite") {
      return;
    }
  }

  try {
    outputChannel.clear();
    outputChannel.appendLine("=== OMP Initialize Workspace ===");
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "OMP: Initializing workspace",
        cancellable: false,
      },
      async () => {
        const copied = syncBundledTemplates({
          extensionPath: context.extensionPath,
          workspaceRoot: workspace.uri.fsPath,
          outputChannel,
        });
        outputChannel.appendLine(`OMP: Updated ${copied.length} managed path(s).`);
      },
    );

    void vscode.window.showInformationMessage(
      "OMP: Workspace conventions initialized successfully.",
      "Open Output",
    ).then((selection) => {
      if (selection === "Open Output") {
        revealOutput(outputChannel);
      }
    });
  } catch (error) {
    outputChannel.appendLine(`OMP init failed: ${formatError(error)}`);
    revealOutput(outputChannel);
    void vscode.window.showErrorMessage("OMP: Initialization failed. Check Output > OMP.");
  }
}
