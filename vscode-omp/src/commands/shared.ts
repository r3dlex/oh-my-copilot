import * as vscode from "vscode";

export function getWorkspaceFolder(): vscode.WorkspaceFolder | undefined {
  return vscode.workspace.workspaceFolders?.[0];
}

export function requireWorkspace(): vscode.WorkspaceFolder | undefined {
  const workspace = getWorkspaceFolder();
  if (!workspace) {
    void vscode.window.showErrorMessage("OMP: No workspace folder is open.");
    return undefined;
  }
  return workspace;
}

export function requireTrustedWorkspace(action: string): boolean {
  if (vscode.workspace.isTrusted) {
    return true;
  }

  void vscode.window.showWarningMessage(
    `OMP: ${action} requires a trusted workspace because it writes workspace files.`,
  );
  return false;
}

export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export function revealOutput(channel: vscode.OutputChannel): void {
  channel.show(true);
}
