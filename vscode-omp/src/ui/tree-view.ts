import * as vscode from "vscode";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join, relative } from "node:path";

const STATE_DIRECTORY_CANDIDATES = [join(".omx", "state"), join(".omp", "state")] as const;
const IGNORED_STATE_FILES = new Set([
  "notify-hook-state.json",
  "tmux-hook-state.json",
  "notify-fallback-state.json",
  "notify-fallback-authority-owner.json",
  "native-stop-state.json",
]);
const STATE_FILE_SUFFIX = "-state.json";

interface WorkflowSummary {
  file: string;
  label: string;
  active: boolean;
  phase?: string;
  iteration?: number;
  updatedAt?: string;
  description?: string;
}

export function registerTreeViews(
  context: vscode.ExtensionContext,
  workspace: vscode.WorkspaceFolder,
): void {
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

  const watchers = [
    vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(workspace, ".omx/**/*.json")),
    vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(workspace, ".omp/**/*.json")),
    vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(workspace, ".copilot/agents/**/*")),
    vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(workspace, ".github/agents/**/*")),
    vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(workspace, "agents/**/*")),
    vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(workspace, ".omx/plans/**/*")),
  ];

  for (const watcher of watchers) {
    watcher.onDidChange(refreshAll);
    watcher.onDidCreate(refreshAll);
    watcher.onDidDelete(refreshAll);
    context.subscriptions.push(watcher);
  }
}

class WorkflowTreeProvider implements vscode.TreeDataProvider<WorkflowItem> {
  private readonly onDidChangeEmitter = new vscode.EventEmitter<WorkflowItem | undefined>();
  readonly onDidChangeTreeData = this.onDidChangeEmitter.event;

  constructor(private readonly workspace: vscode.WorkspaceFolder) {}

  refresh(): void {
    this.onDidChangeEmitter.fire(undefined);
  }

  getTreeItem(element: WorkflowItem): vscode.TreeItem {
    return element;
  }

  getChildren(): WorkflowItem[] {
    const workflows = readWorkflowStates(this.workspace.uri.fsPath);
    if (workflows.length === 0) {
      return [
        new WorkflowItem(
          "No workflow state detected",
          "Run OMP workflows to populate .omx/state",
          vscode.TreeItemCollapsibleState.None,
        ),
      ];
    }

    return workflows.map((workflow) => {
      const icon = workflow.active ? "$(sync~spin)" : "$(history)";
      const details = [
        workflow.active ? "active" : "inactive",
        workflow.phase,
        workflow.iteration !== undefined ? `iteration ${workflow.iteration}` : undefined,
      ].filter(Boolean).join(" · ");

      const item = new WorkflowItem(
        `${icon} ${workflow.label}`,
        details || workflow.file,
        vscode.TreeItemCollapsibleState.None,
      );
      item.tooltip = [workflow.file, workflow.description, workflow.updatedAt].filter(Boolean).join("\n");
      item.contextValue = workflow.active ? "workflow-active" : "workflow-inactive";
      return item;
    });
  }
}

class WorkflowItem extends vscode.TreeItem {
  constructor(
    label: string,
    description: string,
    collapsibleState: vscode.TreeItemCollapsibleState,
  ) {
    super(label, collapsibleState);
    this.description = description;
  }
}

class AgentTreeProvider implements vscode.TreeDataProvider<AgentCategoryItem | AgentLeafItem> {
  private readonly onDidChangeEmitter = new vscode.EventEmitter<AgentCategoryItem | AgentLeafItem | undefined>();
  readonly onDidChangeTreeData = this.onDidChangeEmitter.event;

  constructor(private readonly workspace: vscode.WorkspaceFolder) {}

  refresh(): void {
    this.onDidChangeEmitter.fire(undefined);
  }

  getTreeItem(element: AgentCategoryItem | AgentLeafItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: AgentCategoryItem | AgentLeafItem): Array<AgentCategoryItem | AgentLeafItem> {
    if (element instanceof AgentCategoryItem) {
      return element.children;
    }
    if (element instanceof AgentLeafItem) {
      return [];
    }

    const sources = discoverAgentFiles(this.workspace.uri.fsPath);
    if (sources.length === 0) {
      return [new AgentLeafItem("No agents found", "Initialize this workspace to install agent templates")];
    }

    const categories = new Map<string, AgentLeafItem[]>();
    for (const source of sources) {
      const bucket = categories.get(source.category) ?? [];
      bucket.push(new AgentLeafItem(source.label, source.description, source.filePath));
      categories.set(source.category, bucket);
    }

    return [...categories.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([category, children]) => new AgentCategoryItem(category, children));
  }
}

class AgentCategoryItem extends vscode.TreeItem {
  constructor(
    label: string,
    readonly children: AgentLeafItem[],
  ) {
    super(label, vscode.TreeItemCollapsibleState.Expanded);
    this.description = String(children.length);
    this.iconPath = new vscode.ThemeIcon("folder-library");
  }
}

class AgentLeafItem extends vscode.TreeItem {
  constructor(label: string, description: string, filePath?: string) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.description = description;
    this.iconPath = new vscode.ThemeIcon("person");
    if (filePath) {
      const uri = vscode.Uri.file(filePath);
      this.resourceUri = uri;
      this.command = {
        command: "vscode.open",
        title: "Open agent file",
        arguments: [uri],
      };
    }
  }
}

class PlanTreeProvider implements vscode.TreeDataProvider<PlanItem> {
  private readonly onDidChangeEmitter = new vscode.EventEmitter<PlanItem | undefined>();
  readonly onDidChangeTreeData = this.onDidChangeEmitter.event;

  constructor(private readonly workspace: vscode.WorkspaceFolder) {}

  refresh(): void {
    this.onDidChangeEmitter.fire(undefined);
  }

  getTreeItem(element: PlanItem): vscode.TreeItem {
    return element;
  }

  getChildren(): PlanItem[] {
    const plansDirectory = join(this.workspace.uri.fsPath, ".omx", "plans");
    if (!existsSync(plansDirectory)) {
      return [new PlanItem("No plans found", "Plan artifacts will appear under .omx/plans")];
    }

    const files = readdirSync(plansDirectory)
      .filter((entry) => entry.endsWith(".md"))
      .sort();

    if (files.length === 0) {
      return [new PlanItem("No plans found", "Plan artifacts will appear under .omx/plans")];
    }

    return files.map((entry) => {
      const filePath = join(plansDirectory, entry);
      const label = derivePlanLabel(entry);
      const item = new PlanItem(label, relative(this.workspace.uri.fsPath, filePath), filePath);
      return item;
    });
  }
}

class PlanItem extends vscode.TreeItem {
  constructor(label: string, description: string, filePath?: string) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.description = description;
    this.iconPath = new vscode.ThemeIcon("note");
    if (filePath) {
      const uri = vscode.Uri.file(filePath);
      this.resourceUri = uri;
      this.command = {
        command: "vscode.open",
        title: "Open plan file",
        arguments: [uri],
      };
    }
  }
}

function readWorkflowStates(workspaceRoot: string): WorkflowSummary[] {
  const stateDirectories = STATE_DIRECTORY_CANDIDATES
    .map((relativePath) => join(workspaceRoot, relativePath))
    .filter(existsSync);

  const workflows: WorkflowSummary[] = [];
  for (const stateDirectory of stateDirectories) {
    for (const filePath of listStateFiles(stateDirectory)) {
      const summary = parseWorkflowState(workspaceRoot, filePath);
      if (summary) {
        workflows.push(summary);
      }
    }
  }

  return workflows.sort((left, right) => {
    if (left.active !== right.active) {
      return left.active ? -1 : 1;
    }

    if (left.updatedAt && right.updatedAt) {
      return right.updatedAt.localeCompare(left.updatedAt);
    }

    return left.label.localeCompare(right.label);
  });
}

function listStateFiles(stateDirectory: string): string[] {
  const directFiles = readdirSync(stateDirectory)
    .filter((entry) => entry.endsWith(STATE_FILE_SUFFIX) && !IGNORED_STATE_FILES.has(entry))
    .map((entry) => join(stateDirectory, entry));

  const sessionsDirectory = join(stateDirectory, "sessions");
  if (!existsSync(sessionsDirectory)) {
    return directFiles;
  }

  const sessionFiles = readdirSync(sessionsDirectory).flatMap((sessionId) => {
    const sessionDirectory = join(sessionsDirectory, sessionId);
    if (!existsSync(sessionDirectory)) {
      return [];
    }

    return readdirSync(sessionDirectory)
      .filter((entry) => entry.endsWith(STATE_FILE_SUFFIX) && !IGNORED_STATE_FILES.has(entry))
      .map((entry) => join(sessionDirectory, entry));
  });

  return [...directFiles, ...sessionFiles];
}

function parseWorkflowState(workspaceRoot: string, filePath: string): WorkflowSummary | undefined {
  try {
    const raw = JSON.parse(readFileSync(filePath, "utf8")) as Record<string, unknown>;
    const label = asString(raw.mode) ?? asString(raw.skill);
    if (!label) {
      return undefined;
    }

    return {
      file: relative(workspaceRoot, filePath),
      label,
      active: Boolean(raw.active),
      phase: asString(raw.current_phase) ?? asString(raw.phase),
      iteration: typeof raw.iteration === "number" ? raw.iteration : undefined,
      updatedAt: asString(raw.updated_at),
      description: asString(raw.task_description),
    };
  } catch {
    return undefined;
  }
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function discoverAgentFiles(workspaceRoot: string): Array<{
  category: string;
  label: string;
  description: string;
  filePath: string;
}> {
  const roots = [
    { path: join(workspaceRoot, ".copilot", "agents"), category: "Workspace agents" },
    { path: join(workspaceRoot, ".github", "agents"), category: "GitHub agents" },
    { path: join(workspaceRoot, "agents"), category: "Built-in agents" },
  ].filter((entry) => existsSync(entry.path));

  return roots.flatMap(({ path, category }) =>
    readdirSync(path)
      .filter((entry) => entry.endsWith(".md"))
      .sort()
      .map((entry) => {
        const filePath = join(path, entry);
        const label = `@${basename(entry, ".md")}`;
        const description = readAgentDescription(filePath) ?? relative(workspaceRoot, filePath);
        return { category, label, description, filePath };
      }),
  );
}

function readAgentDescription(filePath: string): string | undefined {
  try {
    const content = readFileSync(filePath, "utf8");
    const descriptionLine = content
      .split(/\r?\n/)
      .find((line) => line.toLowerCase().startsWith("description:"));
    if (!descriptionLine) {
      return undefined;
    }

    return descriptionLine.slice(descriptionLine.indexOf(":") + 1).trim() || undefined;
  } catch {
    return undefined;
  }
}

function derivePlanLabel(fileName: string): string {
  if (fileName.startsWith("prd-")) {
    return `PRD: ${fileName.slice(4, -3)}`;
  }
  if (fileName.startsWith("test-spec-")) {
    return `Test spec: ${fileName.slice(10, -3)}`;
  }
  return basename(fileName, ".md");
}
