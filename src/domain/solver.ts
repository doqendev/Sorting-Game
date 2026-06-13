import {
  applyMoveAndResolve,
  cloneBoard,
  createBoardState,
  evaluateLevelEnd,
  generateLegalMoves,
  isWin,
  scoreMoveHeuristic,
  visibleProductCounts
} from "./board";
import type { BoardState, LegalMove, LevelConfig } from "./types";

export interface SolverResult {
  status: "solved" | "unsolved" | "timeout_unknown";
  nodes: number;
  minSolutionMoves: number;
  path: LegalMove[];
}

export interface LevelValidationResult extends SolverResult {
  secondarySolverStatus: "solved" | "unsolved" | "timeout_unknown";
  productCountValid: boolean;
  schemaValid: boolean;
  riskFlags: string[];
  difficultyScore: number;
  averageBotMoves: number;
  botWinRate: number;
  deadEndProbability: number;
  averageReservePressure: number;
  revealCount: number;
  hiddenInformationRatio: number;
  timePressureRatio: number;
  boosterFreeWinProbability: number;
  autoClearRisk: number;
  readabilityRisk: number;
}

export function validateLevel(level: LevelConfig, nodeLimit = 12000): LevelValidationResult {
  const schemaValid = validateLevelSchema(level).length === 0;
  const productCountValid = validateProductCounts(level);
  const primary = collectionSolve(createBoardState(level), nodeLimit);
  const secondary = collectionSolve(createBoardState(level), nodeLimit, true);
  const solver = primary.status === "solved" ? primary : secondary;
  const difficultyScore = estimateDifficulty(level, solver);
  const bot = simulateBots(level, solver);
  const autoClearRisk = calculateAutoClearRisk(level);
  const averageReservePressure = calculateReservePressure(level);
  const hiddenInformationRatio = calculateHiddenInformationRatio(level);
  const readabilityRisk = calculateReadabilityRisk(level);
  const timePressureRatio = level.timerSec / Math.max(1, solver.minSolutionMoves || level.validation.minSolutionMoves || 1);
  const riskFlags = buildRiskFlags(level, solver, productCountValid, {
    autoClearRisk,
    averageReservePressure,
    hiddenInformationRatio,
    readabilityRisk,
    botWinRate: bot.botWinRate
  });
  return {
    ...solver,
    secondarySolverStatus: secondary.status,
    schemaValid,
    productCountValid,
    riskFlags,
    difficultyScore,
    averageBotMoves: bot.averageBotMoves,
    botWinRate: bot.botWinRate,
    deadEndProbability: bot.deadEndProbability,
    averageReservePressure,
    revealCount: countHiddenLayers(level),
    hiddenInformationRatio,
    timePressureRatio,
    boosterFreeWinProbability: bot.botWinRate,
    autoClearRisk,
    readabilityRisk
  };
}

export function solveLevel(level: LevelConfig, nodeLimit = 12000): SolverResult {
  const start = createBoardState(level);
  const collection = collectionSolve(start, nodeLimit);
  if (collection.status === "solved") return collection;
  const direct = greedySolve(start, nodeLimit);
  if (direct.status === "solved") return direct;
  return beamSolve(start, nodeLimit);
}

function collectionSolve(start: BoardState, nodeLimit: number, reverseCandidates = false): SolverResult {
  const state = cloneBoard(start);
  const path: LegalMove[] = [];
  let nodes = 0;
  while (!isWin(state) && nodes < nodeLimit) {
    nodes += 1;
    const visibleCounts = visibleProductCounts(state);
    const candidates = [...visibleCounts.entries()]
      .filter(([, count]) => count >= 3)
      .sort((a, b) => (reverseCandidates ? a[0].localeCompare(b[0]) : b[1] - a[1] || b[0].localeCompare(a[0])));
    let progressed = false;

    for (const [skuId] of candidates) {
      const target = findCleanTargetForSku(state, skuId);
      if (!target) continue;
      while (target.front.filter((cell) => cell.product?.skuId === skuId).length < 3) {
        const empty = target.front.find((cell) => !cell.product && !cell.blocker);
        const source = findSourceForSku(state, skuId, target.id);
        if (!empty || !source) break;
        const move = {
          sourceCompartmentId: source.compartmentId,
          sourceCellIndex: source.cellIndex,
          targetCompartmentId: target.id,
          targetCellIndex: empty.cellIndex
        };
        applyMoveAndResolve(state, { ...move, timestamp: nodes });
        path.push(move);
        progressed = true;
        if (isWin(state)) return { status: "solved", nodes, minSolutionMoves: path.length, path };
        const refreshed = state.compartments.find((compartment) => compartment.id === target.id);
        if (!refreshed) break;
        if (refreshed.front.every((cell) => !cell.product)) break;
      }
      if (progressed) break;
    }

    if (!progressed) {
      return { status: "unsolved", nodes, minSolutionMoves: path.length, path };
    }
  }
  return {
    status: isWin(state) ? "solved" : "timeout_unknown",
    nodes,
    minSolutionMoves: path.length,
    path
  };
}

function findCleanTargetForSku(state: BoardState, skuId: string) {
  const cleanTargets = state.compartments.filter(
    (compartment) =>
      compartment.isInteractable &&
      compartment.front.some((cell) => !cell.product && !cell.blocker) &&
      compartment.front.filter((cell) => !cell.blocker).length >= 3 &&
      compartment.front.every((cell) => !cell.product || cell.product.skuId === skuId)
  );
  return (
    cleanTargets.sort((a, b) => {
      const aCount = a.front.filter((cell) => cell.product?.skuId === skuId).length;
      const bCount = b.front.filter((cell) => cell.product?.skuId === skuId).length;
      const aReserve = a.type === "reserve" ? 1 : 0;
      const bReserve = b.type === "reserve" ? 1 : 0;
      return bCount - aCount || bReserve - aReserve;
    })[0] ?? null
  );
}

function findSourceForSku(state: BoardState, skuId: string, targetCompartmentId: string) {
  for (const compartment of state.compartments) {
    if (compartment.id === targetCompartmentId || !compartment.isInteractable) continue;
    for (const cell of compartment.front) {
      if (cell.product?.skuId === skuId) {
        return { compartmentId: compartment.id, cellIndex: cell.cellIndex };
      }
    }
  }
  return null;
}

function greedySolve(start: BoardState, nodeLimit: number): SolverResult {
  const state = cloneBoard(start);
  const path: LegalMove[] = [];
  let nodes = 0;
  while (!isWin(state) && nodes < nodeLimit) {
    nodes += 1;
    const moves = generateLegalMoves(state).sort((a, b) => scoreMoveHeuristic(state, b) - scoreMoveHeuristic(state, a));
    const best = moves[0];
    if (!best) {
      return { status: "unsolved", nodes, minSolutionMoves: path.length, path };
    }
    applyMoveAndResolve(state, { ...best, timestamp: nodes });
    path.push(best);
  }
  return {
    status: isWin(state) ? "solved" : "timeout_unknown",
    nodes,
    minSolutionMoves: path.length,
    path
  };
}

function beamSolve(start: BoardState, nodeLimit: number): SolverResult {
  const queue: Array<{ state: BoardState; path: LegalMove[]; priority: number }> = [
    { state: start, path: [], priority: heuristic(start) }
  ];
  const visited = new Set<string>();
  let nodes = 0;
  const beamWidth = 14;

  while (queue.length > 0 && nodes < nodeLimit) {
    queue.sort((a, b) => b.priority - a.priority);
    const current = queue.shift()!;
    const hash = hashBoard(current.state);
    if (visited.has(hash)) continue;
    visited.add(hash);
    nodes += 1;
    if (isWin(current.state)) {
      return { status: "solved", nodes, minSolutionMoves: current.path.length, path: current.path };
    }
    const moves = generateLegalMoves(current.state)
      .sort((a, b) => scoreMoveHeuristic(current.state, b) - scoreMoveHeuristic(current.state, a))
      .slice(0, beamWidth);
    for (const move of moves) {
      const next = cloneBoard(current.state);
      applyMoveAndResolve(next, { ...move, timestamp: nodes });
      if (next.levelEnd && next.levelEnd !== "win") continue;
      queue.push({
        state: next,
        path: [...current.path, move],
        priority: heuristic(next) + scoreMoveHeuristic(current.state, move)
      });
    }
  }

  return { status: nodes >= nodeLimit ? "timeout_unknown" : "unsolved", nodes, minSolutionMoves: 0, path: [] };
}

function heuristic(state: BoardState): number {
  const visibleCounts = visibleProductCounts(state);
  let score = state.objective.clearedProducts * 20 + state.hiddenReveals * 10 - state.moves;
  for (const count of visibleCounts.values()) {
    if (count >= 3) score += 100;
    if (count === 2) score += 20;
  }
  for (const compartment of state.compartments) {
    const products = compartment.front.map((cell) => cell.product?.skuId).filter(Boolean);
    if (products.length === 3 && new Set(products).size === 1) score += 500;
    if (products.length === 0 && compartment.hiddenLayers.length > 0) score += 80;
  }
  return score;
}

export function hashBoard(state: BoardState): string {
  return state.compartments
    .map((compartment) => {
      const front = compartment.front.map((cell) => cell.product?.skuId ?? "_").join(",");
      const hidden = compartment.hiddenLayers
        .map((layer) => layer.map((cell) => cell.product?.skuId ?? "_").join(","))
        .join("|");
      return `${compartment.id}:${front}:${hidden}`;
    })
    .join(";");
}

export function validateLevelSchema(level: LevelConfig): string[] {
  const errors: string[] = [];
  if (level.schemaVersion !== 1) errors.push("schemaVersion must be 1");
  if (!level.levelId) errors.push("levelId required");
  if (!level.board || level.board.rows < 2 || level.board.columns < 2) errors.push("board rows/columns invalid");
  if (!Array.isArray(level.board.compartments) || level.board.compartments.length === 0) {
    errors.push("compartments required");
  }
  for (const compartment of level.board.compartments ?? []) {
    if (compartment.front.length !== 3) errors.push(`${compartment.id} front must have 3 cells`);
    for (const layer of compartment.hiddenLayers) {
      if (layer.length !== 3) errors.push(`${compartment.id} hidden layer must have 3 cells`);
    }
  }
  if (!level.availableBoosters?.length) errors.push("availableBoosters required");
  if (!level.tuning) errors.push("tuning required");
  if (
    level.objective.type !== "clear_all" &&
    level.objective.type !== "time_challenge" &&
    level.objective.targets.length === 0 &&
    level.objective.type !== "combo_target"
  ) {
    errors.push("objective targets required");
  }
  return errors;
}

export function validateProductCounts(level: LevelConfig): boolean {
  const counts = new Map<string, number>();
  for (const compartment of level.board.compartments) {
    for (const cell of compartment.front) {
      if (cell.skuId) counts.set(cell.skuId, (counts.get(cell.skuId) ?? 0) + 1);
    }
    for (const layer of compartment.hiddenLayers) {
      for (const cell of layer) {
        if (cell.skuId) counts.set(cell.skuId, (counts.get(cell.skuId) ?? 0) + 1);
      }
    }
  }
  return [...counts.values()].every((count) => count % 3 === 0);
}

function estimateDifficulty(level: LevelConfig, solver: SolverResult): number {
  const cells = level.board.compartments.length * 3;
  const hiddenLayers = level.board.compartments.reduce((sum, compartment) => sum + compartment.hiddenLayers.length, 0);
  const blockers = level.board.compartments.filter((compartment) => compartment.blocker).length;
  const tier = level.difficultyTier === "super_hard" ? 32 : level.difficultyTier === "hard" ? 18 : 6;
  return Math.round(tier + hiddenLayers * 3 + blockers * 6 + solver.minSolutionMoves * 0.8 + cells * 0.2);
}

function buildRiskFlags(
  level: LevelConfig,
  solver: SolverResult,
  productCountValid: boolean,
  metrics: {
    autoClearRisk: number;
    averageReservePressure: number;
    hiddenInformationRatio: number;
    readabilityRisk: number;
    botWinRate: number;
  }
): string[] {
  const flags: string[] = [];
  const emptyCells = level.board.compartments.flatMap((compartment) => compartment.front).filter((cell) => !cell.skuId).length;
  if (!productCountValid) flags.push("invalid_product_counts");
  if (solver.status !== "solved") flags.push(`solver_${solver.status}`);
  if (metrics.botWinRate <= 0) flags.push("secondary_solver_failed");
  if (emptyCells < 3) flags.push("low_reserve_space");
  if (level.timerSec / Math.max(1, solver.minSolutionMoves) < 2.2) flags.push("tight_timer");
  if (metrics.autoClearRisk > 0.1) flags.push("auto_clear_risk");
  if (metrics.readabilityRisk > 0.2) flags.push("readability_risk");
  if (metrics.averageReservePressure > 0.72 && level.difficultyTier !== "hard" && level.difficultyTier !== "super_hard") {
    flags.push("reserve_pressure_high");
  }
  if (metrics.hiddenInformationRatio > 0.55 && level.difficultyTier === "normal") flags.push("hidden_info_high");
  return flags;
}

function estimateBotWinRate(level: LevelConfig, solver: SolverResult, difficultyScore: number): number {
  if (solver.status !== "solved") return 0;
  const tierBase = level.difficultyTier === "super_hard" ? 0.34 : level.difficultyTier === "hard" ? 0.52 : 0.74;
  const adjustment = Math.max(-0.2, Math.min(0.12, (70 - difficultyScore) / 220));
  return Number(Math.max(0.18, Math.min(0.88, tierBase + adjustment)).toFixed(2));
}

function simulateBots(level: LevelConfig, solver: SolverResult): {
  botWinRate: number;
  averageBotMoves: number;
  deadEndProbability: number;
} {
  if (solver.status !== "solved") return { botWinRate: 0, averageBotMoves: 0, deadEndProbability: 1 };
  const botScores = [
    collectionSolve(createBoardState(level), Math.max(1000, solver.nodes + 300)),
    collectionSolve(createBoardState(level), Math.max(1000, solver.nodes + 300), true),
    greedySolve(createBoardState(level), Math.max(1000, solver.nodes + 600))
  ];
  const wins = botScores.filter((result) => result.status === "solved");
  const averageBotMoves = wins.length
    ? wins.reduce((sum, result) => sum + result.minSolutionMoves, 0) / wins.length
    : solver.minSolutionMoves;
  return {
    botWinRate: Number((wins.length / botScores.length).toFixed(2)),
    averageBotMoves: Number(averageBotMoves.toFixed(1)),
    deadEndProbability: Number(((botScores.length - wins.length) / botScores.length).toFixed(2))
  };
}

function calculateAutoClearRisk(level: LevelConfig): number {
  const hiddenLayers = level.board.compartments.flatMap((compartment) => compartment.hiddenLayers);
  if (hiddenLayers.length === 0) return 0;
  const tripleLayers = hiddenLayers.filter((layer) => {
    const skus = layer.map((cell) => cell.skuId).filter(Boolean);
    return skus.length === 3 && new Set(skus).size === 1;
  }).length;
  return Number((tripleLayers / hiddenLayers.length).toFixed(2));
}

function calculateReservePressure(level: LevelConfig): number {
  const emptyFront = level.board.compartments.flatMap((compartment) => compartment.front).filter((cell) => !cell.skuId && !cell.blocker).length;
  const totalFront = level.board.compartments.length * 3;
  return Number((1 - emptyFront / Math.max(1, totalFront)).toFixed(2));
}

function calculateHiddenInformationRatio(level: LevelConfig): number {
  const hiddenLayers = level.board.compartments.flatMap((compartment) => compartment.hiddenLayers);
  if (hiddenLayers.length === 0) return 0;
  const unclear = level.board.compartments
    .filter((compartment) => compartment.hiddenLayers.length > 0)
    .filter((compartment) => compartment.previewMode === "silhouette" || compartment.previewMode === "mystery").length;
  return Number((unclear / hiddenLayers.length).toFixed(2));
}

function calculateReadabilityRisk(level: LevelConfig): number {
  const skuColors = new Map<string, Set<string>>();
  for (const compartment of level.board.compartments) {
    for (const cell of [...compartment.front, ...compartment.hiddenLayers.flat()]) {
      if (!cell.skuId) continue;
      const color = cell.skuId.split("_").at(-2) ?? "unknown";
      const bucket = skuColors.get(color) ?? new Set<string>();
      bucket.add(cell.skuId);
      skuColors.set(color, bucket);
    }
  }
  const riskyBuckets = [...skuColors.values()].filter((set) => set.size > 4).length;
  return Number((riskyBuckets / Math.max(1, skuColors.size)).toFixed(2));
}

function countHiddenLayers(level: LevelConfig): number {
  return level.board.compartments.reduce((sum, compartment) => sum + compartment.hiddenLayers.length, 0);
}
