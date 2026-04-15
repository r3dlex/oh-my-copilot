import { existsSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { join, relative } from "node:path";

const STATE_DIRECTORY_CANDIDATES = [join(".omx", "state"), join(".omp", "state")] as const;
const STATE_FILE_SUFFIX = "-state.json";
const IGNORED_STATE_FILES = new Set([
  "notify-hook-state.json",
  "tmux-hook-state.json",
  "notify-fallback-state.json",
  "notify-fallback-authority-owner.json",
  "native-stop-state.json",
]);

export interface WorkflowStateSummary {
  file: string;
  label: string;
  active: boolean;
  phase?: string;
  iteration?: number;
  updatedAt?: string;
  description?: string;
}

interface RawState {
  active?: boolean;
  mode?: string;
  skill?: string;
  phase?: string;
  current_phase?: string;
  updated_at?: string;
  iteration?: number;
  task_description?: string;
}

export function resolveStateDirectories(workspaceRoot: string): string[] {
  return STATE_DIRECTORY_CANDIDATES.map((relativePath) => join(workspaceRoot, relativePath)).filter(existsSync);
}

export function readWorkflowStates(workspaceRoot: string): WorkflowStateSummary[] {
  const summaries: WorkflowStateSummary[] = [];

  for (const stateDirectory of resolveStateDirectories(workspaceRoot)) {
    for (const filePath of listCandidateStateFiles(stateDirectory)) {
      const summary = parseWorkflowState(workspaceRoot, filePath);
      if (summary) {
        summaries.push(summary);
      }
    }
  }

  return summaries.sort((left, right) => {
    if (left.active !== right.active) {
      return left.active ? -1 : 1;
    }

    if (left.updatedAt && right.updatedAt) {
      return right.updatedAt.localeCompare(left.updatedAt);
    }

    return left.label.localeCompare(right.label);
  });
}

export function listClearableStateFiles(workspaceRoot: string): string[] {
  return resolveStateDirectories(workspaceRoot).flatMap((stateDirectory) => [
    ...listCandidateStateFiles(stateDirectory),
    ...listSessionStateFiles(stateDirectory),
  ]);
}

export function clearWorkflowState(workspaceRoot: string): string[] {
  const removableFiles = listClearableStateFiles(workspaceRoot);
  for (const filePath of removableFiles) {
    rmSync(filePath, { force: true });
  }
  return removableFiles.map((filePath) => relative(workspaceRoot, filePath));
}

function listCandidateStateFiles(stateDirectory: string): string[] {
  if (!existsSync(stateDirectory)) {
    return [];
  }

  return readdirSync(stateDirectory)
    .filter((entry) => entry.endsWith(STATE_FILE_SUFFIX) && !IGNORED_STATE_FILES.has(entry))
    .map((entry) => join(stateDirectory, entry));
}

function listSessionStateFiles(stateDirectory: string): string[] {
  const sessionsDirectory = join(stateDirectory, "sessions");
  if (!existsSync(sessionsDirectory)) {
    return [];
  }

  return readdirSync(sessionsDirectory)
    .flatMap((sessionId) => {
      const sessionPath = join(sessionsDirectory, sessionId);
      if (!existsSync(sessionPath)) {
        return [];
      }

      return readdirSync(sessionPath)
        .filter((entry) => entry.endsWith(STATE_FILE_SUFFIX) && !IGNORED_STATE_FILES.has(entry))
        .map((entry) => join(sessionPath, entry));
    });
}

function parseWorkflowState(workspaceRoot: string, filePath: string): WorkflowStateSummary | undefined {
  let rawState: RawState;
  try {
    rawState = JSON.parse(readFileSync(filePath, "utf8")) as RawState;
  } catch {
    return undefined;
  }

  const label = rawState.mode ?? rawState.skill;
  if (!label) {
    return undefined;
  }

  return {
    file: relative(workspaceRoot, filePath),
    label,
    active: rawState.active ?? false,
    phase: rawState.current_phase ?? rawState.phase,
    iteration: rawState.iteration,
    updatedAt: rawState.updated_at,
    description: rawState.task_description,
  };
}
