import type {
  BoardState,
  CellConfig,
  CellState,
  ClearedTriple,
  CompartmentState,
  LegalMove,
  LevelConfig,
  LevelEnd,
  MoveAction,
  ProductInstance,
  ProductSKU,
  ResolutionResult
} from "./types";

const FRONT_CAPACITY = 3;
const COMBO_WINDOW_SEC = 2.5;
const MAX_NON_CLEARING_MOVES = 1;

export function cloneBoard(state: BoardState): BoardState {
  return structuredClone(state) as BoardState;
}

export function createBoardState(level: LevelConfig): BoardState {
  let totalProducts = 0;
  const compartments: CompartmentState[] = level.board.compartments.map((compartment) => {
    const front = normalizeLayer(compartment.front, compartment.id, "front");
    const hiddenLayers = compartment.hiddenLayers.map((layer, layerIndex) =>
      normalizeLayer(layer, compartment.id, `h${layerIndex}`)
    );
    for (const cell of front) {
      if (cell.product) totalProducts += 1;
    }
    for (const layer of hiddenLayers) {
      for (const cell of layer) {
        if (cell.product) totalProducts += 1;
      }
    }
    return {
      id: compartment.id,
      row: compartment.row,
      column: compartment.column,
      type: compartment.type,
      front,
      hiddenLayers,
      blocker: compartment.blocker,
      previewMode: compartment.previewMode,
      isInteractable: compartment.blocker !== "locked_shelf" && compartment.type !== "locked"
    };
  });

  return {
    levelId: level.levelId,
    seed: level.seed,
    difficultyTier: level.difficultyTier,
    timer: {
      totalSec: level.timerSec,
      remainingSec: level.timerSec,
      running: level.timerSec > 0,
      frozenUntilMs: 0
    },
    compartments,
    objective: {
      type: level.objective.type,
      targets: level.objective.targets.map((target) => ({ ...target, cleared: 0 })),
      clearedProducts: 0,
      totalProducts,
      comboTargetMet: false
    },
    combo: {
      value: 0,
      max: 0,
      lastClearAtMs: 0,
      nonClearingMoves: 0
    },
    moveHistory: [],
    moves: 0,
    score: 0,
    boostersUsed: [],
    hiddenReveals: 0,
    levelEnd: null
  };
}

function normalizeLayer(layer: CellConfig[], compartmentId: string, layerId: string): CellState[] {
  const result: CellState[] = [];
  for (let index = 0; index < FRONT_CAPACITY; index += 1) {
    const cell = layer[index] ?? {};
    result.push({
      cellIndex: index,
      product: cell.skuId
        ? {
            instanceId: `${compartmentId}_${layerId}_${index}_${cell.skuId}`,
            skuId: cell.skuId,
            flags: cell.flags ?? []
          }
        : null,
      blocker: cell.blocker ?? null
    });
  }
  return result;
}

export function getCompartment(state: BoardState, compartmentId: string): CompartmentState | undefined {
  return state.compartments.find((compartment) => compartment.id === compartmentId);
}

export function getCell(state: BoardState, compartmentId: string, cellIndex: number): CellState | undefined {
  return getCompartment(state, compartmentId)?.front[cellIndex];
}

export function isProductSelectable(compartment: CompartmentState, cell: CellState): boolean {
  if (!compartment.isInteractable || compartment.blocker === "locked_shelf") return false;
  if (!cell.product) return false;
  if (cell.blocker === "frost" || cell.blocker === "crate") return false;
  if (cell.product.flags.includes("frozen") || cell.product.flags.includes("taped")) return false;
  return true;
}

export function isLegalMove(state: BoardState, move: MoveAction | LegalMove): { ok: boolean; reason?: string } {
  if (state.levelEnd) return { ok: false, reason: "level_ended" };
  if (move.sourceCompartmentId === move.targetCompartmentId) {
    return { ok: false, reason: "same_compartment" };
  }

  const sourceCompartment = getCompartment(state, move.sourceCompartmentId);
  const targetCompartment = getCompartment(state, move.targetCompartmentId);
  if (!sourceCompartment || !targetCompartment) return { ok: false, reason: "missing_compartment" };
  if (!sourceCompartment.isInteractable || !targetCompartment.isInteractable) {
    return { ok: false, reason: "locked_compartment" };
  }

  const source = sourceCompartment.front[move.sourceCellIndex];
  const target = targetCompartment.front[move.targetCellIndex];
  if (!source || !target) return { ok: false, reason: "missing_cell" };
  if (!isProductSelectable(sourceCompartment, source)) return { ok: false, reason: "source_not_selectable" };
  if (target.product) return { ok: false, reason: "target_occupied" };
  if (target.blocker === "crate" || target.blocker === "frost") return { ok: false, reason: "target_blocked" };
  return { ok: true };
}

export function generateLegalMoves(state: BoardState): LegalMove[] {
  const moves: LegalMove[] = [];
  for (const sourceCompartment of state.compartments) {
    for (const source of sourceCompartment.front) {
      if (!isProductSelectable(sourceCompartment, source)) continue;
      for (const targetCompartment of state.compartments) {
        if (!targetCompartment.isInteractable) continue;
        for (const target of targetCompartment.front) {
          const move = {
            sourceCompartmentId: sourceCompartment.id,
            sourceCellIndex: source.cellIndex,
            targetCompartmentId: targetCompartment.id,
            targetCellIndex: target.cellIndex
          };
          if (isLegalMove(state, { ...move, timestamp: Date.now() }).ok) {
            moves.push(move);
          }
        }
      }
    }
  }
  return moves;
}

export function applyMoveAndResolve(state: BoardState, move: MoveAction, nowMs = Date.now()): ResolutionResult {
  const legal = isLegalMove(state, move);
  if (!legal.ok) {
    return emptyResolution(state.levelEnd);
  }

  const sourceCompartment = getCompartment(state, move.sourceCompartmentId)!;
  const targetCompartment = getCompartment(state, move.targetCompartmentId)!;
  const source = sourceCompartment.front[move.sourceCellIndex];
  const targetIndex = findSmartTargetCell(targetCompartment, source.product!.skuId, move.targetCellIndex);
  const target = targetCompartment.front[targetIndex];
  const product = source.product!;

  source.product = null;
  target.product = product;
  state.moveHistory.push({ ...move, targetCellIndex: targetIndex });
  state.moves += 1;

  const result: ResolutionResult = {
    movedProducts: [product],
    clearedTriples: [],
    revealedLayers: [],
    objectiveUpdates: [],
    comboChanged: false,
    scoreDelta: 0,
    levelEnd: null
  };

  const affected = new Set([sourceCompartment.id, targetCompartment.id]);
  resolveAffected(state, affected, result, nowMs);
  if (result.clearedTriples.length === 0) {
    state.combo.nonClearingMoves += 1;
    if (state.combo.nonClearingMoves > MAX_NON_CLEARING_MOVES) {
      if (state.combo.value !== 0) result.comboChanged = true;
      state.combo.value = 0;
    }
  }

  result.levelEnd = evaluateLevelEnd(state);
  state.levelEnd = result.levelEnd;
  return result;
}

function findSmartTargetCell(compartment: CompartmentState, skuId: string, requestedIndex: number): number {
  const requested = compartment.front[requestedIndex];
  if (requested && !requested.product && !requested.blocker) return requestedIndex;
  const hasMatchingProduct = compartment.front.some((cell) => cell.product?.skuId === skuId);
  if (!hasMatchingProduct) {
    return compartment.front.find((cell) => !cell.product && !cell.blocker)?.cellIndex ?? requestedIndex;
  }
  return compartment.front.find((cell) => !cell.product && !cell.blocker)?.cellIndex ?? requestedIndex;
}

export function resolveAffected(
  state: BoardState,
  affectedCompartmentIds = new Set(state.compartments.map((compartment) => compartment.id)),
  result: ResolutionResult = emptyResolution(null),
  nowMs = Date.now()
): ResolutionResult {
  let changed = true;
  while (changed) {
    changed = false;
    for (const compartment of state.compartments) {
      if (!affectedCompartmentIds.has(compartment.id)) continue;
      const triple = tryClearTriple(state, compartment, nowMs);
      if (triple) {
        result.clearedTriples.push(triple);
        result.scoreDelta += 100 + triple.combo * 20;
        state.score += 100 + triple.combo * 20;
        result.comboChanged = true;
        result.objectiveUpdates.push(`cleared:${triple.skuId}`);
        changed = true;
      }
    }

    for (const compartment of state.compartments) {
      const isEmptyFront = compartment.front.every((cell) => !cell.product && !cell.blocker);
      if (!isEmptyFront || compartment.hiddenLayers.length === 0) continue;
      const hiddenDepthBefore = compartment.hiddenLayers.length;
      compartment.front = compartment.hiddenLayers.shift()!.map((cell, index) => ({ ...cell, cellIndex: index }));
      state.hiddenReveals += 1;
      result.revealedLayers.push({
        compartmentId: compartment.id,
        hiddenDepthBefore,
        hiddenDepthAfter: compartment.hiddenLayers.length
      });
      affectedCompartmentIds.add(compartment.id);
      changed = true;
    }
  }
  return result;
}

function tryClearTriple(state: BoardState, compartment: CompartmentState, nowMs: number): ClearedTriple | null {
  if (compartment.blocker === "locked_shelf") return null;
  if (compartment.front.some((cell) => !cell.product || cell.blocker)) return null;
  const skuId = compartment.front[0].product!.skuId;
  if (!compartment.front.every((cell) => cell.product?.skuId === skuId)) return null;

  for (const cell of compartment.front) {
    cell.product = null;
  }

  state.objective.clearedProducts += FRONT_CAPACITY;
  updateTargets(state, skuId, FRONT_CAPACITY);
  const withinWindow = (nowMs - state.combo.lastClearAtMs) / 1000 <= COMBO_WINDOW_SEC;
  if (state.combo.value === 0 || !withinWindow) {
    state.combo.value = 1;
  } else {
    state.combo.value += 1;
  }
  state.combo.nonClearingMoves = 0;
  state.combo.lastClearAtMs = nowMs;
  state.combo.max = Math.max(state.combo.max, state.combo.value);
  if (state.combo.value >= 5) state.objective.comboTargetMet = true;
  return { compartmentId: compartment.id, skuId, combo: state.combo.value };
}

function updateTargets(state: BoardState, skuId: string, amount: number): void {
  for (const target of state.objective.targets) {
    if (target.skuId === skuId) {
      target.cleared = Math.min(target.count, target.cleared + amount);
    }
  }
}

export function tickTimer(state: BoardState, deltaSec: number, nowMs = Date.now()): LevelEnd {
  if (!state.timer.running || state.levelEnd) return state.levelEnd;
  if (state.timer.frozenUntilMs > nowMs) return state.levelEnd;
  state.timer.remainingSec = Math.max(0, state.timer.remainingSec - deltaSec);
  if (state.timer.remainingSec <= 0 && !isWin(state)) {
    state.levelEnd = "loss_timeout";
  }
  return state.levelEnd;
}

export function addTime(state: BoardState, seconds: number): void {
  state.timer.remainingSec = Math.min(state.timer.totalSec + seconds, state.timer.remainingSec + seconds);
  if (state.levelEnd === "loss_timeout") {
    state.levelEnd = null;
    state.timer.running = true;
  }
}

export function freezeTimer(state: BoardState, durationSec: number, nowMs = Date.now()): void {
  state.timer.frozenUntilMs = Math.max(state.timer.frozenUntilMs, nowMs + durationSec * 1000);
}

export function isWin(state: BoardState): boolean {
  if (state.objective.type === "collect_orders") {
    return state.objective.targets.every((target) => target.cleared >= target.count);
  }
  if (state.objective.type === "combo_target") {
    return state.objective.comboTargetMet && allProductsCleared(state);
  }
  return allProductsCleared(state);
}

export function allProductsCleared(state: BoardState): boolean {
  return state.compartments.every(
    (compartment) =>
      compartment.front.every((cell) => !cell.product) &&
      compartment.hiddenLayers.every((layer) => layer.every((cell) => !cell.product))
  );
}

export function evaluateLevelEnd(state: BoardState): LevelEnd {
  if (isWin(state)) return "win";
  if (state.timer.remainingSec <= 0 && state.timer.totalSec > 0) return "loss_timeout";
  if (generateLegalMoves(state).length === 0) return "loss_stalemate";
  return null;
}

export function calculateStars(state: BoardState): number {
  const ratio = state.timer.totalSec === 0 ? 1 : state.timer.remainingSec / state.timer.totalSec;
  if (ratio >= 0.35) return 3;
  if (ratio >= 0.15) return 2;
  return 1;
}

export function scoreMoveHeuristic(state: BoardState, move: LegalMove): number {
  const sourceCell = getCell(state, move.sourceCompartmentId, move.sourceCellIndex);
  const targetCompartment = getCompartment(state, move.targetCompartmentId);
  if (!sourceCell?.product || !targetCompartment) return -9999;
  const skuId = sourceCell.product.skuId;
  let score = 0;
  const targetSkuCount = targetCompartment.front.filter((cell) => cell.product?.skuId === skuId).length;
  if (targetSkuCount === 2) score += 1000;
  if (targetSkuCount === 1) score += 250;
  const sourceCompartment = getCompartment(state, move.sourceCompartmentId);
  const sourceOccupied = sourceCompartment?.front.filter((cell) => cell.product).length ?? 0;
  if (sourceOccupied === 1 && (sourceCompartment?.hiddenLayers.length ?? 0) > 0) score += 200;
  if (targetCompartment.type === "reserve") score += 30;
  return score;
}

export function visibleProductCounts(state: BoardState): Map<string, number> {
  const counts = new Map<string, number>();
  for (const compartment of state.compartments) {
    for (const cell of compartment.front) {
      if (!cell.product) continue;
      counts.set(cell.product.skuId, (counts.get(cell.product.skuId) ?? 0) + 1);
    }
  }
  return counts;
}

export function productDisplayName(product: ProductSKU): string {
  return product.displayNameKey.replace("sku.", "").replaceAll("_", " ");
}

function emptyResolution(levelEnd: LevelEnd): ResolutionResult {
  return {
    movedProducts: [],
    clearedTriples: [],
    revealedLayers: [],
    objectiveUpdates: [],
    comboChanged: false,
    scoreDelta: 0,
    levelEnd
  };
}

export function makeProduct(skuId: string, instanceId: string): ProductInstance {
  return { skuId, instanceId, flags: [] };
}
