import * as vscode from "vscode";
import { registerClearStateCommand } from "./commands/clear-state";
import { registerHealthCheckCommand } from "./commands/health-check";
import { registerInitializeCommand } from "./commands/initialize";
import { registerShowStatusCommand } from "./commands/show-status";
import { registerUpdateFilesCommand } from "./commands/update-files";

export function activate(context: vscode.ExtensionContext): void {
  const outputChannel = vscode.window.createOutputChannel("OMP");
  outputChannel.appendLine("OMP VS Code extension activated.");

  registerInitializeCommand(context, outputChannel);
  registerUpdateFilesCommand(context, outputChannel);
  registerHealthCheckCommand(context, outputChannel);
  registerShowStatusCommand(context, outputChannel);
  registerClearStateCommand(context, outputChannel);

  context.subscriptions.push(outputChannel);
}

export function deactivate(): void {
  // VS Code disposes registered subscriptions automatically.
}
