import * as vscode from "vscode";
import { syncBundledTemplates } from "../adapters/template-sync";
import { formatError, requireTrustedWorkspace, requireWorkspace, revealOutput } from "./shared";

export function registerUpdateFilesCommand(
  context: vscode.ExtensionContext,
  outputChannel: vscode.OutputChannel,
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("omp.updateFiles", async () => {
      await updateFiles(context, outputChannel);
    }),
  );
}

async function updateFiles(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel): Promise<void> {
  const workspace = requireWorkspace();
  if (!workspace || !requireTrustedWorkspace("Update Convention Files")) {
    return;
  }

  const answer = await vscode.window.showWarningMessage(
    "OMP: Update the managed convention files in this workspace to the bundled extension version?",
    { modal: true },
    "Update",
    "Cancel",
  );
  if (answer !== "Update") {
    return;
  }

  try {
    outputChannel.clear();
    outputChannel.appendLine("=== OMP Update Convention Files ===");
    const copied = syncBundledTemplates({
      extensionPath: context.extensionPath,
      workspaceRoot: workspace.uri.fsPath,
      outputChannel,
    });
    outputChannel.appendLine(`OMP: Updated ${copied.length} managed path(s).`);

    void vscode.window.showInformationMessage(
      "OMP: Managed convention files updated.",
      "Open Output",
    ).then((selection) => {
      if (selection === "Open Output") {
        revealOutput(outputChannel);
      }
    });
  } catch (error) {
    outputChannel.appendLine(`OMP update failed: ${formatError(error)}`);
    revealOutput(outputChannel);
    void vscode.window.showErrorMessage("OMP: Update failed. Check Output > OMP.");
  }
}
