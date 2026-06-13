import { beforeEach, describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  addTime,
  applyMoveAndResolve,
  calculateStars,
  createBoardState,
  generateLegalMoves,
  isLegalMove,
  tickTimer
} from "../src/domain/board";
import { createBooster, findHint } from "../src/domain/boosters";
import { exportReplay, playReplay } from "../src/domain/replay";
import { hashBoard, validateLevel, validateLevelSchema, validateProductCounts } from "../src/domain/solver";
import type { LevelConfig } from "../src/domain/types";
import { AnalyticsService } from "../src/services/analytics";
import { EconomyService } from "../src/services/economy";
import { checksum, SaveService } from "../src/services/save";

function sampleLevel(): LevelConfig {
  return {
    schemaVersion: 1,
    levelId: "level_0001",
    seed: 1,
    chapterId: "snack_aisle",
    difficultyTier: "normal",
    board: {
      rows: 2,
      columns: 3,
      compartments: [
        compartment("c_0_0", 0, 0, "normal", [
          cell("chips_blue", "snack"),
          cell("cola_red", "drink"),
          cell("apple_red", "fruit")
        ], [[cell("cookie_pink", "snack"), cell("milk_white", "drink"), cell("pear_green", "fruit")]]),
        compartment("c_0_1", 0, 1, "normal", [
          cell("chips_blue", "snack"),
          cell("cola_red", "drink"),
          cell("apple_red", "fruit")
        ]),
        compartment("c_0_2", 0, 2, "normal", [
          cell("chips_blue", "snack"),
          cell("cola_red", "drink"),
          cell("apple_red", "fruit")
        ]),
        compartment("c_1_0", 1, 0, "reserve", [empty(), empty(), empty()]),
        compartment("c_1_1", 1, 1, "reserve", [empty(), empty(), empty()]),
        compartment("c_1_2", 1, 2, "reserve", [empty(), empty(), empty()])
      ]
    },
    objective: { type: "clear_all", targets: [] },
    tuning: { comboWindowSec: 7, maxNonClearingMoves: 3 },
    timerSec: 240,
    starThresholds: { threeStarsRemainingSec: 80, twoStarsRemainingSec: 35 },
    availableBoosters: ["hint", "shuffle", "hammer", "freeze_time", "extra_slot"],
    rewards: { baseCoins: 20, firstTryBonusCoins: 10, passXp: 0 },
    validation: validation(),
    humanReview: { reviewer: "test", grade: "A", notes: "Fixture level." }
  };
}

describe("board domain", () => {
  it("allows visible products to move to empty front cells and rejects occupied targets", () => {
    const state = createBoardState(sampleLevel());
    expect(
      isLegalMove(state, {
        sourceCompartmentId: "c_0_0",
        sourceCellIndex: 0,
        targetCompartmentId: "c_1_0",
        targetCellIndex: 0,
        timestamp: 1
      }).ok
    ).toBe(true);
    expect(
      isLegalMove(state, {
        sourceCompartmentId: "c_0_0",
        sourceCellIndex: 0,
        targetCompartmentId: "c_0_1",
        targetCellIndex: 0,
        timestamp: 1
      }).ok
    ).toBe(false);
  });

  it("clears triples by SKU, records combo state, and reveals mixed hidden queues", () => {
    const state = createBoardState(sampleLevel());
    applyMoveAndResolve(state, move("c_0_0", 0, "c_1_0", 0), 1);
    applyMoveAndResolve(state, move("c_0_1", 0, "c_1_0", 1), 2);
    const result = applyMoveAndResolve(state, move("c_0_2", 0, "c_1_0", 2), 3);
    expect(result.clearedTriples).toHaveLength(1);
    expect(result.clearedTriples[0].skuId).toBe("chips_blue");
    expect(state.combo.value).toBe(1);

    for (let cellIndex = 0; cellIndex < 3; cellIndex += 1) {
      applyMoveAndResolve(state, move("c_0_0", cellIndex, "c_1_1", cellIndex), 10 + cellIndex);
    }
    expect(state.compartments[0].hiddenLayers).toHaveLength(0);
    expect(state.compartments[0].front.map((cellState) => cellState.product?.skuId)).toEqual([
      "cookie_pink",
      "milk_white",
      "pear_green"
    ]);
  });

  it("tracks category and special objectives when products clear", () => {
    const level = sampleLevel();
    level.objective = { type: "collect_orders", targets: [{ category: "snack", count: 3, label: "Snack order" }] };
    const state = createBoardState(level);
    applyMoveAndResolve(state, move("c_0_0", 0, "c_1_0", 0), 1);
    applyMoveAndResolve(state, move("c_0_1", 0, "c_1_0", 1), 2);
    applyMoveAndResolve(state, move("c_0_2", 0, "c_1_0", 2), 3);
    expect(state.objective.targets[0].cleared).toBe(3);
    expect(state.levelEnd).toBe("win");

    const specialLevel = sampleLevel();
    specialLevel.objective = { type: "clear_special", targets: [{ flag: "special", count: 3, label: "Ribbon goods" }] };
    for (const compartmentState of specialLevel.board.compartments.slice(0, 3)) {
      compartmentState.front[0].flags = ["special"];
    }
    const special = createBoardState(specialLevel);
    applyMoveAndResolve(special, move("c_0_0", 0, "c_1_0", 0), 1);
    applyMoveAndResolve(special, move("c_0_1", 0, "c_1_0", 1), 2);
    applyMoveAndResolve(special, move("c_0_2", 0, "c_1_0", 2), 3);
    expect(special.objective.targets[0].cleared).toBe(3);
    expect(special.levelEnd).toBe("win");
  });

  it("uses configured combo and star thresholds", () => {
    const level = sampleLevel();
    level.objective = { type: "combo_target", targets: [], targetCombo: 2 };
    level.tuning = { comboWindowSec: 1, maxNonClearingMoves: 0 };
    const state = createBoardState(level);
    applyMoveAndResolve(state, move("c_0_0", 0, "c_1_0", 0), 1);
    expect(state.combo.value).toBe(0);
    state.timer.remainingSec = 79;
    expect(calculateStars(state)).toBe(2);
  });

  it("handles timer loss and revive time boundaries", () => {
    const state = createBoardState(sampleLevel());
    tickTimer(state, 240);
    expect(state.levelEnd).toBe("loss_timeout");
    expect(state.failReason).toBe("objective_incomplete");
    addTime(state, 60);
    expect(state.levelEnd).toBe(null);
    expect(state.timer.remainingSec).toBe(60);
  });

  it("generates legal moves, a useful hint, and deterministic replay hashes", () => {
    const level = sampleLevel();
    const state = createBoardState(level);
    expect(generateLegalMoves(state).length).toBeGreaterThan(0);
    expect(findHint(state)).toBeTruthy();
    applyMoveAndResolve(state, move("c_0_0", 0, "c_1_0", 0), 1);
    const replayed = playReplay(level, exportReplay(state));
    expect(hashBoard(replayed)).toBe(hashBoard(state));
  });
});

describe("boosters", () => {
  it("hammer clears a selected visible product and updates objectives", () => {
    const level = sampleLevel();
    level.objective = { type: "collect_orders", targets: [{ category: "snack", count: 1, label: "Snack order" }] };
    const state = createBoardState(level);
    const booster = createBooster("hammer");
    const result = booster.execute(state, { nowMs: 1, selected: { compartmentId: "c_0_0", cellIndex: 0 } });
    expect(result.ok).toBe(true);
    expect(state.compartments[0].front[0].product).toBeNull();
    expect(state.objective.targets[0].cleared).toBe(1);
  });

  it("extra shelf adds a centered reserve compartment", () => {
    const state = createBoardState(sampleLevel());
    const count = state.compartments.length;
    createBooster("extra_slot").execute(state, { nowMs: 1 });
    expect(state.compartments).toHaveLength(count + 1);
    expect(state.compartments.at(-1)?.type).toBe("reserve");
    expect(state.compartments.at(-1)?.column).toBe(1);
  });

  it("shuffle preserves visible product count and avoids immediate no-move regression", () => {
    const state = createBoardState(sampleLevel());
    const before = visibleCount(state);
    createBooster("shuffle").execute(state, { nowMs: 1, seed: 42 });
    expect(visibleCount(state)).toBe(before);
    expect(generateLegalMoves(state).length).toBeGreaterThan(0);
  });
});

describe("services", () => {
  beforeEach(() => localStorage.clear());

  it("writes checksummed atomic saves and fills V2 defaults", () => {
    const economy = loadEconomy();
    const saveService = new SaveService(economy);
    const save = saveService.load();
    save.wallet.coins = 999;
    saveService.save(save);
    const raw = localStorage.getItem("shelf-sort-save-active-v1");
    const envelope = JSON.parse(raw ?? "{}") as { checksum: string; save: typeof save };
    expect(envelope.checksum).toBe(checksum(JSON.stringify(envelope.save)));
    const loaded = saveService.load();
    expect(loaded.wallet.coins).toBe(999);
    expect(loaded.renovation.marketStandLevel).toBe(1);
  });

  it("gates analytics until consent and records V2 economy events", () => {
    const economy = loadEconomy();
    const saveService = new SaveService(economy);
    let save = saveService.load();
    const analytics = new AnalyticsService(() => save);
    analytics.track("level_start", { levelId: "level_0001" });
    expect(analytics.all()).toHaveLength(0);
    save.settings.consentGranted = true;
    const service = new EconomyService(economy, analytics, () => save, (next) => {
      save = next;
    });
    expect(service.grant("tx_1", { coins: 100 }, "test")).toBe(true);
    expect(service.grant("tx_1", { coins: 100 }, "test")).toBe(false);
    expect(service.spendCoins(25, "test_sink", "test")).toBe(true);
    expect(analytics.all().map((event) => event.name)).toEqual(["economy_grant", "economy_spend"]);
  });
});

describe("content validation", () => {
  it("validates generated V2 vertical-slice content against source-of-truth counts", () => {
    const launch = loadJson<{ levels: LevelConfig[] }>("levels_launch.json");
    const backlog = loadJson<{ levels: LevelConfig[] }>("levels_backlog.json");
    const catalog = loadJson<{ products: Array<{ skuId: string; assetAddress: string; readability: { smallScreenPass: boolean } }> }>("product_catalog.json");
    const themes = loadJson<{ themes: unknown[] }>("themes.json");
    expect(launch.levels).toHaveLength(30);
    expect(backlog.levels).toHaveLength(0);
    expect(catalog.products).toHaveLength(40);
    expect(themes.themes.length).toBeGreaterThanOrEqual(5);

    for (const product of catalog.products) {
      expect(product.readability.smallScreenPass, product.skuId).toBe(true);
      expect(existsSync(join(process.cwd(), "public", product.assetAddress))).toBe(true);
    }
    for (const level of launch.levels) {
      expect(validateLevelSchema(level), level.levelId).toHaveLength(0);
      expect(validateProductCounts(level), level.levelId).toBe(true);
      const result = validateLevel(level, 5000);
      expect(result.status, level.levelId).toBe("solved");
      expect(level.validation.solverStatus, level.levelId).toBe("solved");
      expect(level.validation.secondarySolverStatus, level.levelId).toBe("solved");
      expect(level.validation.autoClearRisk, level.levelId).toBeLessThanOrEqual(0.1);
    }
  });
});

function compartment(
  id: string,
  row: number,
  column: number,
  type: LevelConfig["board"]["compartments"][number]["type"],
  front: LevelConfig["board"]["compartments"][number]["front"],
  hiddenLayers: LevelConfig["board"]["compartments"][number]["hiddenLayers"] = []
): LevelConfig["board"]["compartments"][number] {
  return { id, row, column, type, front, hiddenLayers, blocker: null, previewMode: "dim_exact" };
}

function cell(skuId: string, category: string): LevelConfig["board"]["compartments"][number]["front"][number] {
  return { skuId, category };
}

function empty(): LevelConfig["board"]["compartments"][number]["front"][number] {
  return { skuId: null };
}

function move(sourceCompartmentId: string, sourceCellIndex: number, targetCompartmentId: string, targetCellIndex: number) {
  return { sourceCompartmentId, sourceCellIndex, targetCompartmentId, targetCellIndex, timestamp: Date.now() };
}

function validation(): LevelConfig["validation"] {
  return {
    solverStatus: "solved",
    secondarySolverStatus: "solved",
    solverNodes: 12,
    minSolutionMoves: 12,
    averageBotMoves: 14,
    botWinRate: 0.8,
    deadEndProbability: 0,
    averageReservePressure: 0.2,
    revealCount: 1,
    hiddenInformationRatio: 0.2,
    timePressureRatio: 0.4,
    boosterFreeWinProbability: 0.8,
    autoClearRisk: 0,
    readabilityRisk: 0,
    humanReviewGrade: "A",
    riskFlags: [],
    lastValidatedAt: "2026-06-12T00:00:00Z"
  };
}

function visibleCount(state: ReturnType<typeof createBoardState>): number {
  return state.compartments.flatMap((compartmentState) => compartmentState.front).filter((cellState) => cellState.product).length;
}

function loadJson<T>(file: string): T {
  return JSON.parse(readFileSync(join(process.cwd(), "public", "data", file), "utf8")) as T;
}

function loadEconomy() {
  return loadJson<import("../src/domain/types").EconomyConfig>("economy_config.json");
}
