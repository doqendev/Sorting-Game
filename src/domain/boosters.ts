import {
  addTime,
  applyMoveAndResolve,
  cloneBoard,
  evaluateLevelEnd,
  freezeTimer,
  generateLegalMoves,
  getCell,
  getCompartment,
  resolveAffected,
  scoreMoveHeuristic
} from "./board";
import type { BoardState, BoosterId, LegalMove, ResolutionResult } from "./types";

export interface BoosterContext {
  nowMs: number;
  selected?: { compartmentId: string; cellIndex: number };
  seed?: number;
}

export interface BoosterResult {
  ok: boolean;
  reason?: string;
  board: BoardState;
  hint?: LegalMove;
  resolution?: ResolutionResult;
}

export interface BoosterCommand {
  id: BoosterId;
  canExecute(state: BoardState, context: BoosterContext): boolean;
  preview(state: BoardState, context: BoosterContext): string;
  execute(state: BoardState, context: BoosterContext): BoosterResult;
  analyticsPayload(context: BoosterContext): Record<string, unknown>;
}

export function createBooster(id: BoosterId): BoosterCommand {
  switch (id) {
    case "hint":
      return hintBooster;
    case "shuffle":
      return shuffleBooster;
    case "hammer":
      return hammerBooster;
    case "freeze_time":
      return freezeTimeBooster;
    case "extra_slot":
      return extraSlotBooster;
  }
}

export function findHint(state: BoardState): LegalMove | undefined {
  return generateLegalMoves(state)
    .map((move) => ({ move, score: scoreMoveHeuristic(state, move) }))
    .sort((a, b) => b.score - a.score)[0]?.move;
}

const hintBooster: BoosterCommand = {
  id: "hint",
  canExecute: (state) => generateLegalMoves(state).length > 0,
  preview: (state) => {
    const hint = findHint(state);
    return hint
      ? `Move ${hint.sourceCompartmentId}:${hint.sourceCellIndex} to ${hint.targetCompartmentId}:${hint.targetCellIndex}`
      : "No hint available";
  },
  execute: (state) => ({ ok: true, board: state, hint: findHint(state) }),
  analyticsPayload: () => ({ boosterId: "hint" })
};

const shuffleBooster: BoosterCommand = {
  id: "shuffle",
  canExecute: (state) => state.compartments.some((compartment) => compartment.front.some((cell) => cell.product)),
  preview: () => "Shuffle visible products while preserving hidden queues.",
  execute: (state, context) => {
    const products = [];
    const cells = [];
    for (const compartment of state.compartments) {
      for (const cell of compartment.front) {
        if (cell.product) {
          products.push(cell.product);
          cells.push(cell);
        }
      }
    }
    const shuffled = seededShuffle(products, context.seed ?? state.seed + state.moves);
    cells.forEach((cell, index) => {
      cell.product = shuffled[index] ?? null;
    });
    state.combo.value = 0;
    state.boostersUsed.push("shuffle");
    const resolution = resolveAffected(state);
    state.levelEnd = evaluateLevelEnd(state);
    return { ok: true, board: state, resolution };
  },
  analyticsPayload: (context) => ({ boosterId: "shuffle", seed: context.seed })
};

const hammerBooster: BoosterCommand = {
  id: "hammer",
  canExecute: (state, context) => {
    if (!context.selected) return false;
    return !!getCell(state, context.selected.compartmentId, context.selected.cellIndex)?.product;
  },
  preview: () => "Clear one selected visible product.",
  execute: (state, context) => {
    if (!context.selected) return { ok: false, reason: "no_selection", board: state };
    const cell = getCell(state, context.selected.compartmentId, context.selected.cellIndex);
    if (!cell?.product) return { ok: false, reason: "empty_cell", board: state };
    const skuId = cell.product.skuId;
    cell.product = null;
    state.objective.clearedProducts += 1;
    state.boostersUsed.push("hammer");
    const resolution = resolveAffected(state, new Set([context.selected.compartmentId]));
    resolution.objectiveUpdates.push(`hammer:${skuId}`);
    state.levelEnd = evaluateLevelEnd(state);
    return { ok: true, board: state, resolution };
  },
  analyticsPayload: (context) => ({ boosterId: "hammer", selected: context.selected })
};

const freezeTimeBooster: BoosterCommand = {
  id: "freeze_time",
  canExecute: (state) => state.timer.totalSec > 0,
  preview: () => "Freeze timer for 15 seconds and add 30 seconds.",
  execute: (state, context) => {
    freezeTimer(state, 15, context.nowMs);
    addTime(state, 30);
    state.boostersUsed.push("freeze_time");
    return { ok: true, board: state };
  },
  analyticsPayload: () => ({ boosterId: "freeze_time", addSeconds: 30, freezeSeconds: 15 })
};

const extraSlotBooster: BoosterCommand = {
  id: "extra_slot",
  canExecute: () => true,
  preview: () => "Add a temporary empty reserve shelf.",
  execute: (state) => {
    const maxRow = Math.max(...state.compartments.map((compartment) => compartment.row));
    state.compartments.push({
      id: `extra_${state.moves}_${state.compartments.length}`,
      row: maxRow + 1,
      column: 0,
      type: "reserve",
      front: [0, 1, 2].map((cellIndex) => ({ cellIndex, product: null, blocker: null })),
      hiddenLayers: [],
      blocker: null,
      previewMode: "dim_exact",
      isInteractable: true
    });
    state.boostersUsed.push("extra_slot");
    return { ok: true, board: state };
  },
  analyticsPayload: () => ({ boosterId: "extra_slot" })
};

export function simulateHintMove(state: BoardState): BoardState {
  const next = cloneBoard(state);
  const hint = findHint(next);
  if (hint) applyMoveAndResolve(next, { ...hint, timestamp: Date.now() });
  return next;
}

function seededShuffle<T>(items: T[], seed: number): T[] {
  const result = [...items];
  let x = seed || 1;
  for (let index = result.length - 1; index > 0; index -= 1) {
    x = (x * 1664525 + 1013904223) >>> 0;
    const swapIndex = x % (index + 1);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function boosterTargetDescription(state: BoardState, compartmentId: string, cellIndex: number): string {
  const compartment = getCompartment(state, compartmentId);
  const cell = compartment?.front[cellIndex];
  return `${compartmentId}:${cellIndex}:${cell?.product?.skuId ?? "empty"}`;
}
