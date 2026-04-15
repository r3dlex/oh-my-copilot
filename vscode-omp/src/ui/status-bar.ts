import * as vscode from "vscode";
import { readWorkflowStates } from "../adapters/state-reader";

export function createStatusBar(
  context: vscode.ExtensionContext,
  workspace: vscode.WorkspaceFolder,
): void {
  const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 50);
  item.command = "omp.showStatus";
  item.tooltip = "OMP workflow status — click for details";
  context.subscriptions.push(item);

  const update = (): void => {
    const states = readWorkflowStates(workspace.uri.fsPath);
    const activeStates = states.filter((state) => state.active);

    if (activeStates.length === 0) {
      item.text = "$(circle-large-outline) OMP: idle";
      item.backgroundColor = undefined;
      item.show();
      return;
    }

    if (activeStates.length === 1) {
      const [state] = activeStates;
      const phaseText = state.phase ? ` [${state.phase}]` : "";
      item.text = `$(sync~spin) OMP: ${state.label}${phaseText}`;
      item.backgroundColor = new vscode.ThemeColor("statusBarItem.warningBackground");
      item.show();
      return;
    }

    item.text = `$(sync~spin) OMP: ${activeStates.length} active`;
    item.backgroundColor = new vscode.ThemeColor("statusBarItem.warningBackground");
    item.show();
  };

  update();

  const watcherPatterns = [
    new vscode.RelativePattern(workspace, ".omx/state/**/*.json"),
    new vscode.RelativePattern(workspace, ".omp/state/**/*.json"),
  ];

  for (const pattern of watcherPatterns) {
    const watcher = vscode.workspace.createFileSystemWatcher(pattern);
    watcher.onDidChange(update);
    watcher.onDidCreate(update);
    watcher.onDidDelete(update);
    context.subscriptions.push(watcher);
  }
}
