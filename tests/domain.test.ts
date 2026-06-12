import { describe, expect, it, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  addTime,
  applyMoveAndResolve,
  createBoardState,
  evaluateLevelEnd,
  generateLegalMoves,
  isLegalMove,
  tickTimer
} from "../src/domain/board";
import { createBooster, findHint } from "../src/domain/boosters";
import { validateLevel, validateLevelSchema, validateProductCounts } from "../src/domain/solver";
import type { LevelConfig } from "../src/domain/types";
import { SaveService, checksum } from "../src/services/save";
import { EconomyService } from "../src/services/economy";
import { AnalyticsService } from "../src/services/analytics";

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
        {
          id: "c_0_0",
          row: 0,
          column: 0,
          type: "normal",
          front: [{ skuId: "chips_blue_01" }, { skuId: "soda_red_01" }, { skuId: "pear_green_01" }],
          hiddenLayers: [[{ skuId: "cookie_yellow_01" }, { skuId: "muffin_pink_01" }, { skuId: "tart_teal_01" }]],
          blocker: null,
          previewMode: "dim_exact"
        },
        {
          id: "c_0_1",
          row: 0,
          column: 1,
          type: "normal",
          front: [{ skuId: "chips_blue_01" }, { skuId: "soda_red_01" }, { skuId: "pear_green_01" }],
          hiddenLayers: [],
          blocker: null,
          previewMode: "dim_exact"
        },
        {
          id: "c_0_2",
          row: 0,
          column: 2,
          type: "normal",
          front: [{ skuId: "chips_blue_01" }, { skuId: "soda_red_01" }, { skuId: "pear_green_01" }],
          hiddenLayers: [],
          blocker: null,
          previewMode: "dim_exact"
        },
        {
          id: "c_1_0",
          row: 1,
          column: 0,
          type: "reserve",
          front: [{ skuId: null }, { skuId: null }, { skuId: null }],
          hiddenLayers: [],
          blocker: null,
          previewMode: "dim_exact"
        },
        {
          id: "c_1_1",
          row: 1,
          column: 1,
          type: "reserve",
          front: [{ skuId: null }, { skuId: null }, { skuId: null }],
          hiddenLayers: [],
          blocker: null,
          previewMode: "dim_exact"
        },
        {
          id: "c_1_2",
          row: 1,
          column: 2,
          type: "reserve",
          front: [{ skuId: null }, { skuId: null }, { skuId: null }],
          hiddenLayers: [],
          blocker: null,
          previewMode: "dim_exact"
        }
      ]
    },
    objective: { type: "clear_all", targets: [] },
    timerSec: 240,
    starThresholds: { threeStarsRemainingSec: 80, twoStarsRemainingSec: 35 },
    availableBoosters: ["hint", "shuffle", "hammer", "freeze_time", "extra_slot"],
    rewards: { baseCoins: 20, firstTryBonusCoins: 10, passXp: 10 },
    validation: {
      solverStatus: "solved",
      solverNodes: 12,
      minSolutionMoves: 12,
      botWinRate: 0.8,
      lastValidatedAt: "2026-06-12T00:00:00Z"
    }
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

  it("clears triples by SKU and records combo state", () => {
    const state = createBoardState(sampleLevel());
    applyMoveAndResolve(state, { sourceCompartmentId: "c_0_0", sourceCellIndex: 0, targetCompartmentId: "c_1_0", targetCellIndex: 0, timestamp: 1 }, 1);
    applyMoveAndResolve(state, { sourceCompartmentId: "c_0_1", sourceCellIndex: 0, targetCompartmentId: "c_1_0", targetCellIndex: 1, timestamp: 2 }, 2);
    const result = applyMoveAndResolve(
      state,
      { sourceCompartmentId: "c_0_2", sourceCellIndex: 0, targetCompartmentId: "c_1_0", targetCellIndex: 2, timestamp: 3 },
      3
    );
    expect(result.clearedTriples).toHaveLength(1);
    expect(result.clearedTriples[0].skuId).toBe("chips_blue_01");
    expect(state.combo.value).toBe(1);
  });

  it("reveals hidden layers when a front layer becomes empty", () => {
    const state = createBoardState(sampleLevel());
    for (let cell = 0; cell < 3; cell += 1) {
      applyMoveAndResolve(state, {
        sourceCompartmentId: "c_0_0",
        sourceCellIndex: cell,
        targetCompartmentId: "c_1_0",
        targetCellIndex: cell,
        timestamp: cell
      });
    }
    expect(state.compartments[0].hiddenLayers).toHaveLength(0);
    expect(state.compartments[0].front.map((cell) => cell.product?.skuId)).toEqual([
      "cookie_yellow_01",
      "muffin_pink_01",
      "tart_teal_01"
    ]);
  });

  it("chain-clears a revealed hidden triple", () => {
    const level = sampleLevel();
    level.board.compartments[0].hiddenLayers = [[{ skuId: "cookie_yellow_01" }, { skuId: "cookie_yellow_01" }, { skuId: "cookie_yellow_01" }]];
    const state = createBoardState(level);
    for (let cell = 0; cell < 3; cell += 1) {
      applyMoveAndResolve(state, {
        sourceCompartmentId: "c_0_0",
        sourceCellIndex: cell,
        targetCompartmentId: "c_1_0",
        targetCellIndex: cell,
        timestamp: cell
      });
    }
    expect(state.compartments[0].front.every((cell) => cell.product === null)).toBe(true);
    expect(state.objective.clearedProducts).toBe(3);
  });

  it("handles timer loss and revive time boundaries", () => {
    const state = createBoardState(sampleLevel());
    tickTimer(state, 240);
    expect(state.levelEnd).toBe("loss_timeout");
    addTime(state, 60);
    expect(state.levelEnd).toBe(null);
    expect(state.timer.remainingSec).toBe(60);
  });

  it("generates legal moves and a useful hint", () => {
    const state = createBoardState(sampleLevel());
    expect(generateLegalMoves(state).length).toBeGreaterThan(0);
    expect(findHint(state)).toBeTruthy();
  });
});

describe("boosters", () => {
  it("hammer clears a selected visible product", () => {
    const state = createBoardState(sampleLevel());
    const booster = createBooster("hammer");
    const result = booster.execute(state, { nowMs: 1, selected: { compartmentId: "c_0_0", cellIndex: 0 } });
    expect(result.ok).toBe(true);
    expect(state.compartments[0].front[0].product).toBeNull();
  });

  it("extra slot adds a reserve compartment", () => {
    const state = createBoardState(sampleLevel());
    const count = state.compartments.length;
    createBooster("extra_slot").execute(state, { nowMs: 1 });
    expect(state.compartments).toHaveLength(count + 1);
    expect(state.compartments.at(-1)?.type).toBe("reserve");
  });

  it("shuffle preserves visible product count", () => {
    const state = createBoardState(sampleLevel());
    const before = state.compartments.flatMap((compartment) => compartment.front).filter((cell) => cell.product).length;
    createBooster("shuffle").execute(state, { nowMs: 1, seed: 42 });
    const after = state.compartments.flatMap((compartment) => compartment.front).filter((cell) => cell.product).length;
    expect(after).toBe(before);
  });
});

describe("services", () => {
  beforeEach(() => localStorage.clear());

  it("writes checksummed atomic saves and migrates schema", () => {
    const economy = loadEconomy();
    const saveService = new SaveService(economy);
    const save = saveService.load();
    save.wallet.coins = 999;
    saveService.save(save);
    const raw = localStorage.getItem("shelf-sort-save-active-v1");
    const envelope = JSON.parse(raw ?? "{}") as { checksum: string; save: typeof save };
    expect(envelope.checksum).toBe(checksum(JSON.stringify(envelope.save)));
    expect(saveService.load().wallet.coins).toBe(999);
  });

  it("keeps economy grants idempotent by transaction id", () => {
    const economy = loadEconomy();
    const saveService = new SaveService(economy);
    let save = saveService.load();
    const analytics = new AnalyticsService(() => save);
    const service = new EconomyService(economy, analytics, () => save, (next) => {
      save = next;
    });
    expect(service.grant("tx_1", { coins: 100 }, "test")).toBe(true);
    expect(service.grant("tx_1", { coins: 100 }, "test")).toBe(false);
    expect(save.wallet.coins).toBe(economy.currencies.coins.startingAmount + 100);
  });
});

describe("content validation", () => {
  it("validates generated launch content against spec counts", () => {
    const launch = loadJson<{ levels: LevelConfig[] }>("levels_launch.json");
    const backlog = loadJson<{ levels: LevelConfig[] }>("levels_backlog.json");
    const catalog = loadJson<{ products: unknown[] }>("product_catalog.json");
    const themes = loadJson<{ themes: unknown[] }>("themes.json");
    expect(launch.levels.length).toBeGreaterThanOrEqual(500);
    expect(backlog.levels.length).toBeGreaterThanOrEqual(1000);
    expect(catalog.products.length).toBeGreaterThanOrEqual(200);
    expect(themes.themes.length).toBeGreaterThanOrEqual(6);
    for (const level of launch.levels.slice(0, 50)) {
      expect(validateLevelSchema(level)).toHaveLength(0);
      expect(validateProductCounts(level)).toBe(true);
      expect(validateLevel(level, 5000).status, level.levelId).toBe("solved");
    }
    expect(launch.levels.every((level) => level.validation.solverStatus === "solved")).toBe(true);
  });
});

function loadJson<T>(file: string): T {
  return JSON.parse(readFileSync(join(process.cwd(), "public", "data", file), "utf8")) as T;
}

function loadEconomy() {
  return loadJson<import("../src/domain/types").EconomyConfig>("economy_config.json");
}
