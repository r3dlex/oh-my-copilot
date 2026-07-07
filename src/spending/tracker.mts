/**
 * Spending tracker for OMP.
 * Tracks premium API requests per session and per calendar month.
 * Persists to ~/.omp/state/spending-monthly.json
 *
 * // v1.1 known limitation: no /omp:spending reset command. To reset monthly counter manually: rm ~/.omp/state/spending-monthly.json
 */

import { getSpendingPath, readJsonSafe, writeJsonAtomic } from "../utils/file-system.mts";
import type { SpendingState } from "./types.mjs";

const SPENDING_PATH = getSpendingPath();

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function loadSpending(sessionId: string): SpendingState {
  const raw = readJsonSafe<SpendingState | null>(SPENDING_PATH, null);
  if (!raw) {
    // Missing or malformed file — start fresh
    return {
      version: 1,
      sessionId,
      sessionPremiumRequests: 0,
      month: currentMonth(),
      monthlyPremiumRequests: 0,
    };
  }

  const month = currentMonth();

  // Reset monthly counter when month rolls over
  if (raw.month !== month) {
    return {
      version: 1,
      sessionId,
      sessionPremiumRequests: 0,
      month,
      monthlyPremiumRequests: 0,
    };
  }

  // Reset session counter when session changes
  if (raw.sessionId !== sessionId) {
    return {
      version: 1,
      sessionId,
      sessionPremiumRequests: 0,
      month,
      monthlyPremiumRequests: raw.monthlyPremiumRequests,
    };
  }

  return { ...raw, version: 1 };
}

export function saveSpending(state: SpendingState): void {
  try {
    writeJsonAtomic(SPENDING_PATH, state);
  } catch (e) {
    console.warn(`[OMP] spending: failed to save state: ${e}`);
  }
}

export function incrementSpending(sessionId: string): SpendingState {
  const state = loadSpending(sessionId);
  state.sessionPremiumRequests += 1;
  state.monthlyPremiumRequests += 1;
  saveSpending(state);
  return state;
}
