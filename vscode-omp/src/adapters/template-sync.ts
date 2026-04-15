import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import type * as vscode from "vscode";

export const MANAGED_TEMPLATE_PATHS = [".copilot", ".github/hooks"] as const;

export function getTemplateRoot(extensionPath: string): string {
  return join(extensionPath, "resources", "templates");
}

export function findBundledTemplateProblems(extensionPath: string): string[] {
  const templateRoot = getTemplateRoot(extensionPath);
  return MANAGED_TEMPLATE_PATHS.filter((relativePath) => !existsSync(join(templateRoot, relativePath)));
}

export function syncBundledTemplates(input: {
  extensionPath: string;
  workspaceRoot: string;
  outputChannel?: vscode.OutputChannel;
}): string[] {
  const templateRoot = getTemplateRoot(input.extensionPath);
  const copiedPaths: string[] = [];

  for (const relativePath of MANAGED_TEMPLATE_PATHS) {
    const sourcePath = join(templateRoot, relativePath);
    const targetPath = join(input.workspaceRoot, relativePath);

    if (!existsSync(sourcePath)) {
      throw new Error(`Bundled template path missing: ${relativePath}`);
    }

    copyPath(sourcePath, targetPath);
    copiedPaths.push(relativePath);
    input.outputChannel?.appendLine(`OMP: Synced ${relativePath}`);
  }

  return copiedPaths;
}

function copyPath(sourcePath: string, targetPath: string): void {
  const sourceStats = statSync(sourcePath);
  if (sourceStats.isDirectory()) {
    mkdirSync(targetPath, { recursive: true });
    for (const entry of readdirSync(sourcePath)) {
      copyPath(join(sourcePath, entry), join(targetPath, entry));
    }
    return;
  }

  mkdirSync(dirname(targetPath), { recursive: true });
  copyFileSync(sourcePath, targetPath);
}
