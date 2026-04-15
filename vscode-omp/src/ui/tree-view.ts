import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import * as vscode from "vscode";
import { readWorkflowStates } from "../adapters/state-reader";

export function registerTreeViews(context: vscode.ExtensionContext, workspace: vscode.WorkspaceFolder): void {
  const workflowProvider = new WorkflowTreeProvider(workspace);
  const agentProvider = new AgentTreeProvider(workspace);
  const planProvider = new PlanTreeProvider(workspace);

  context.subscriptions.push(
    vscode.window.createTreeView("omp.workflows", { treeDataProvider: workflowProvider }),
    vscode.window.createTreeView("omp.agents", { treeDataProvider: agentProvider }),
    vscode.window.createTreeView("omp.plans", { treeDataProvider: planProvider }),
  );

  const refreshAll = (): void => {
    workflowProvider.refresh();
    agentProvider.refresh();
    planProvider.refresh();
  };

  const watcherPatterns = [
    new vscode.RelativePattern(workspace, ".omx/**/*.json"),
    new vscode.RelativePattern(workspace, ".omp/**/*.json"),
    new vscode.RelativePattern(workspace, ".omx/plans/**/*.md"),
    new vscode.RelativePattern(workspace, ".copilot/agents/**/*.md"),
  ];

  for (const pattern of watcherPatterns) {
    const watcher = vscode.workspace.createFileSystemWatcher(pattern);
    watcher.onDidChange(refreshAll);
    watcher.onDidCreate(refreshAll);
    watcher.onDidDelete(refreshAll);
    context.subscriptions.push(watcher);
  }
}

class WorkflowTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private readonly onDidChangeEmitter = new vscode.EventEmitter<vscode.TreeItem | undefined>();
  readonly onDidChangeTreeData = this.onDidChangeEmitter.event;

  constructor(private readonly workspace: vscode.WorkspaceFolder) {}

  refresh(): void {
    this.onDidChangeEmitter.fire(undefined);
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(): vscode.TreeItem[] {
    const states = readWorkflowStates(this.workspace.uri.fsPath);
    if (states.length === 0) {
      return [placeholderItem("No OMP workflow state found", "Run an OMP workflow to populate state.")];
    }

    return states.map((state) => {
      const item = new vscode.TreeItem(state.label, vscode.TreeItemCollapsibleState.None);
      item.description = [state.active ? "active" : "inactive", state.phase].filter(Boolean).join(" — ");
      item.tooltip = [state.file, state.description].filter(Boolean).join("\n");
      item.iconPath = new vscode.ThemeIcon(state.active ? "play-circle" : "history");
      return item;
    });
  }
}

class AgentTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private readonly onDidChangeEmitter = new vscode.EventEmitter<vscode.TreeItem | undefined>();
  readonly onDidChangeTreeData = this.onDidChangeEmitter.event;

  constructor(private readonly workspace: vscode.WorkspaceFolder) {}

  refresh(): void {
    this.onDidChangeEmitter.fire(undefined);
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(): vscode.TreeItem[] {
    const agentDirectory = resolveAgentDirectory(this.workspace.uri.fsPath);
    if (!agentDirectory) {
      return [placeholderItem("No OMP agents found", "Initialize the workspace to install .copilot/agents.")];
    }

    return readdirSync(agentDirectory)
      .filter((entry) => entry.endsWith(".md"))
      .sort()
      .map((entry) => {
        const filePath = join(agentDirectory, entry);
        const item = new vscode.TreeItem(
          entry.replace(/\.agent\.md$|\.md$/u, ""),
          vscode.TreeItemCollapsibleState.None,
        );
        item.description = readAgentDescription(filePath);
        item.iconPath = new vscode.ThemeIcon("person");
        item.command = {
          command: "vscode.open",
          title: "Open Agent Definition",
          arguments: [vscode.Uri.file(filePath)],
        };
        return item;
      });
  }
}

class PlanTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private readonly onDidChangeEmitter = new vscode.EventEmitter<vscode.TreeItem | undefined>();
  readonly onDidChangeTreeData = this.onDidChangeEmitter.event;

  constructor(private readonly workspace: vscode.WorkspaceFolder) {}

  refresh(): void {
    this.onDidChangeEmitter.fire(undefined);
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(): vscode.TreeItem[] {
    const planDirectory = join(this.workspace.uri.fsPath, ".omx", "plans");
    if (!existsSync(planDirectory)) {
      return [placeholderItem("No OMP plans found", "Plan files appear under .omx/plans.")];
    }

    const planFiles = readdirSync(planDirectory)
      .filter((entry) => entry.endsWith(".md"))
      .sort();

    if (planFiles.length === 0) {
      return [placeholderItem("No OMP plans found", "Plan files appear under .omx/plans.")];
    }

    return planFiles.map((entry) => {
      const filePath = join(planDirectory, entry);
      const item = new vscode.TreeItem(entry, vscode.TreeItemCollapsibleState.None);
      item.description = inferPlanDescription(entry);
      item.iconPath = new vscode.ThemeIcon(entry.startsWith("test-spec-") ? "beaker" : "book");
      item.command = {
        command: "vscode.open",
        title: "Open Plan",
        arguments: [vscode.Uri.file(filePath)],
      };
      return item;
    });
  }
}

function resolveAgentDirectory(workspaceRoot: string): string | undefined {
  const candidates = [join(workspaceRoot, ".copilot", "agents"), join(workspaceRoot, "agents")];
  return candidates.find((candidate) => existsSync(candidate));
}

function readAgentDescription(filePath: string): string {
  const content = readFileSync(filePath, "utf8");
  const descriptionMatch = content.match(/^description:\s*(.+)$/mu);
  return descriptionMatch?.[1]?.trim() ?? "";
}

function inferPlanDescription(fileName: string): string {
  if (fileName.startsWith("prd-")) {
    return "Product requirements";
  }
  if (fileName.startsWith("test-spec-")) {
    return "Verification spec";
  }
  return "OMP plan";
}

function placeholderItem(label: string, description: string): vscode.TreeItem {
  const item = new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.None);
  item.description = description;
  item.iconPath = new vscode.ThemeIcon("info");
  return item;
}
