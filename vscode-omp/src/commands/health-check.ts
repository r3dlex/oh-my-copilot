import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import * as vscode from "vscode";
import { MANAGED_TEMPLATE_PATHS } from "../adapters/template-sync";
import { readWorkflowStates, resolveStateDirectories } from "../adapters/state-reader";
import { requireWorkspace, revealOutput } from "./shared";

type Severity = "error" | "warning" | "info";

interface HealthIssue {
  severity: Severity;
  message: string;
}

export function registerHealthCheckCommand(
  context: vscode.ExtensionContext,
  outputChannel: vscode.OutputChannel,
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("omp.healthCheck", async () => {
      await runHealthCheck(context, outputChannel);
    }),
  );
}

async function runHealthCheck(
  context: vscode.ExtensionContext,
  outputChannel: vscode.OutputChannel,
): Promise<void> {
  const workspace = requireWorkspace();
  if (!workspace) {
    return;
  }

  const issues: HealthIssue[] = [];
  const workspaceRoot = workspace.uri.fsPath;

  for (const relativePath of MANAGED_TEMPLATE_PATHS) {
    if (!existsSync(join(workspaceRoot, relativePath))) {
      issues.push({
        severity: "error",
        message: `Missing managed path: ${relativePath}`,
      });
    }
  }

  if (!vscode.workspace.isTrusted) {
    issues.push({
      severity: "warning",
      message: "Workspace is untrusted; write commands stay disabled until trust is granted.",
    });
  }

  const stateDirectories = resolveStateDirectories(workspaceRoot);
  if (stateDirectories.length === 0) {
    issues.push({
      severity: "info",
      message: "No .omx/state or .omp/state directory found yet.",
    });
  } else {
    const workflowStates = readWorkflowStates(workspaceRoot);
    issues.push({
      severity: "info",
      message: `Detected ${workflowStates.length} workflow state file(s) across ${stateDirectories.length} state director${stateDirectories.length === 1 ? "y" : "ies"}.`,
    });
  }

  const bundledManifest = join(context.extensionPath, "resources", "templates", "manifest.json");
  if (!existsSync(bundledManifest)) {
    issues.push({
      severity: "warning",
      message: "Template manifest missing from extension bundle.",
    });
  }

  if (isCliAvailable()) {
    issues.push({
      severity: "info",
      message: "OMP CLI detected on PATH.",
    });
  } else {
    issues.push({
      severity: "warning",
      message: "OMP CLI not found on PATH; command-driven workspace setup will still work, but local CLI flows may be unavailable.",
    });
  }

  outputChannel.clear();
  outputChannel.appendLine("=== OMP Health Check ===");
  outputChannel.appendLine(`Workspace: ${workspaceRoot}`);
  outputChannel.appendLine(`Trusted: ${String(vscode.workspace.isTrusted)}`);
  outputChannel.appendLine("");

  if (issues.length === 0) {
    outputChannel.appendLine("✅ No issues detected.");
    void vscode.window.showInformationMessage("OMP: Health check passed.");
    return;
  }

  for (const issue of issues) {
    const icon = issue.severity === "error" ? "❌" : issue.severity === "warning" ? "⚠️" : "ℹ️";
    outputChannel.appendLine(`${icon} [${issue.severity.toUpperCase()}] ${issue.message}`);
  }

  revealOutput(outputChannel);

  const errorCount = issues.filter((issue) => issue.severity === "error").length;
  const warningCount = issues.filter((issue) => issue.severity === "warning").length;

  if (errorCount > 0) {
    void vscode.window.showErrorMessage(
      `OMP: Health check found ${errorCount} error(s) and ${warningCount} warning(s). Check Output > OMP.`,
    );
    return;
  }

  if (warningCount > 0) {
    void vscode.window.showWarningMessage(
      `OMP: Health check found ${warningCount} warning(s). Check Output > OMP.`,
    );
    return;
  }

  void vscode.window.showInformationMessage("OMP: Health check completed. Check Output > OMP for details.");
}

function isCliAvailable(): boolean {
  const command = process.platform === "win32" ? "where" : "which";
  const result = spawnSync(command, ["omp"], { encoding: "utf8" });
  return result.status === 0;
}
