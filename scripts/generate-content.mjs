import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const dataDir = join(root, "public", "data");
mkdirSync(dataDir, { recursive: true });

const categories = [
  "snack",
  "drink",
  "fruit",
  "toy",
  "sport",
  "home",
  "stationery",
  "bakery",
  "cosmetic",
  "seasonal"
];
const shapes = ["box", "bottle", "pouch", "sphere", "can", "toy", "tube", "crate"];
const palettes = [
  ["#3d8bfd", "#fff3b0", "blue"],
  ["#f25f5c", "#fffef8", "red"],
  ["#2fbf71", "#e8f8d0", "green"],
  ["#f6b93b", "#2d2111", "yellow"],
  ["#8e6ddf", "#fffef8", "violet"],
  ["#1f8a70", "#ffcf5a", "teal"],
  ["#ef7b45", "#fff4df", "orange"],
  ["#d94f8c", "#ffffff", "pink"],
  ["#507dbc", "#f4f7fb", "navy"],
  ["#8a5a44", "#f7e0c4", "cocoa"]
];
const nouns = {
  snack: ["chips", "pretzel", "cracker", "popcorn", "cookie", "wafer", "nacho", "granola", "nuts", "candy"],
  drink: ["soda", "juice", "water", "tea", "milk", "smoothie", "tonic", "cola", "lemonade", "coffee"],
  fruit: ["pear", "apple", "berry", "melon", "banana", "kiwi", "peach", "plum", "mango", "grape"],
  toy: ["robot", "bear", "cube", "rocket", "puzzle", "car", "duck", "top", "yo_yo", "dino"],
  sport: ["ball", "glove", "cap", "racket", "shoe", "whistle", "medal", "cone", "skate", "puck"],
  home: ["soap", "towel", "brush", "lamp", "mug", "plant", "sponge", "candle", "basket", "clock"],
  stationery: ["pencil", "marker", "notebook", "eraser", "clip", "tape", "folder", "stamp", "card", "ruler"],
  bakery: ["bread", "bagel", "muffin", "croissant", "donut", "pie", "roll", "cake", "bun", "tart"],
  cosmetic: ["cream", "lotion", "comb", "mirror", "powder", "balm", "brush", "spray", "tube", "jar"],
  seasonal: ["star", "snowbox", "sunpack", "leaf", "gift", "lantern", "shell", "flower", "ribbon", "bell"]
};

const products = Array.from({ length: 200 }, (_, index) => {
  const category = categories[index % categories.length];
  const noun = nouns[category][Math.floor(index / categories.length) % nouns[category].length];
  const palette = palettes[index % palettes.length];
  const shape = shapes[(index + Math.floor(index / 7)) % shapes.length];
  const variant = String(Math.floor(index / categories.length) + 1).padStart(2, "0");
  const skuId = `${noun}_${palette[2]}_${variant}`;
  return {
    skuId,
    displayNameKey: `sku.${skuId}`,
    category,
    silhouetteClass: shape === "sphere" ? "round" : shape === "bottle" || shape === "tube" ? "tall" : shape,
    rarity: index > 170 ? "seasonal" : index > 130 ? "rare" : index > 70 ? "uncommon" : "common",
    prefabAddress: `products/${skuId}.prefab`,
    iconAddress: `icons/${skuId}.png`,
    unlockLevel: Math.max(1, Math.floor(index / 4) + 1),
    colorTags: [palette[2], index % 2 === 0 ? "light" : "bold"],
    sizeClass: index % 9 === 0 ? "large" : index % 5 === 0 ? "small" : "medium",
    readabilityScore: 4 + (index % 2),
    seasonal: category === "seasonal" || index > 170,
    visual: {
      color: palette[0],
      accent: palette[1],
      shape,
      label: `${noun.slice(0, 2).toUpperCase()}${variant}`
    }
  };
});

const themes = [
  ["snack_aisle", "Snack Aisle", "#a97745", "#dbece6", "#ffcf5a", 1],
  ["fridge_lane", "Fridge Lane", "#7ca7b7", "#e6f3f7", "#3d8bfd", 35],
  ["toy_corner", "Toy Corner", "#df8fb2", "#f7eaf1", "#f6b93b", 80],
  ["sports_wall", "Sports Wall", "#6c8a5f", "#e8f1e3", "#ef7b45", 125],
  ["bakery_case", "Bakery Case", "#c88c5a", "#f4e6d7", "#8a5a44", 175],
  ["holiday_shelf", "Holiday Shelf", "#6a72b8", "#edf0ff", "#2fbf71", 250]
].map(([id, name, shelfColor, wallColor, accentColor, unlockLevel]) => ({
  id,
  name,
  shelfColor,
  wallColor,
  accentColor,
  unlockLevel
}));

const economy = {
  schemaVersion: 1,
  currencies: {
    coins: { startingAmount: 500, maxSoftCap: 999999 },
    stars: { startingAmount: 0 },
    gems: { startingAmount: 0 }
  },
  boosterCosts: {
    hint: { coins: 100 },
    shuffle: { coins: 250 },
    hammer: { coins: 200 },
    freeze_time: { coins: 300 },
    extra_slot: { coins: 400 }
  },
  reviveOffers: [
    { id: "rv_plus_60_sec", type: "rewarded_ad", addSeconds: 60 },
    { id: "coins_plus_45_sec", type: "coins", cost: 300, addSeconds: 45 }
  ],
  iapProducts: [
    { id: "starter_pack", kind: "bundle", price: "$1.99", contents: { coins: 750, hint: 1, shuffle: 1, hammer: 1, freeze_time: 1 } },
    { id: "remove_ads", kind: "non_consumable", price: "$5.99", contents: { removeAds: true } },
    { id: "small_booster_pack", kind: "bundle", price: "$2.99", contents: { hint: 3, hammer: 2, freeze_time: 1 } },
    { id: "value_bundle", kind: "bundle", price: "$8.99", contents: { coins: 2500, hint: 5, shuffle: 3, hammer: 3, extra_slot: 2 } },
    { id: "deluxe_bundle", kind: "bundle", price: "$14.99", contents: { coins: 6000, gems: 80, hint: 8, shuffle: 6, hammer: 6, freeze_time: 5, extra_slot: 4 } },
    { id: "piggy_bank", kind: "bank", price: "$3.99", contents: { coins: 3200 } },
    { id: "match_pass", kind: "pass", price: "$7.99", contents: { activePassId: "season_launch", coins: 1000, passXp: 500 } }
  ]
};

const remote = {
  schemaVersion: 1,
  ads: {
    interstitialEnabled: true,
    firstInterstitialAfterLevel: 8,
    interstitialCooldownSec: 120,
    suppressInterstitialAfterRewardedSec: 180,
    bannerInGameplayEnabled: false
  },
  difficulty: {
    timerMultiplierNormal: 1,
    timerMultiplierHard: 0.88,
    timerMultiplierSuperHard: 0.78,
    comboWindowSec: 2.5
  },
  economy: {
    winCoinsMultiplier: 1,
    rewardedDoubleEnabled: true,
    starterPackVariant: "A"
  },
  features: {
    relaxModeEnabled: true,
    collectionAlbumEnabled: true,
    battlePassEnabled: true,
    dailyOrdersEnabled: true
  }
};

const events = [
  { id: "daily_order", name: "Daily Order", durationHours: 24, mechanic: "Collect target categories in normal levels.", reward: "Coins, boosters, album cards" },
  { id: "weekend_rush", name: "Weekend Rush", durationHours: 72, mechanic: "Timed score race with fair cohorts.", reward: "Badge, shelf skin, pass XP" },
  { id: "treasure_shelves", name: "Treasure Shelves", durationHours: 120, mechanic: "Win streak opens chests on a path.", reward: "Boosters, coins, seasonal products" }
];

function createLevel(levelIndex, backlog = false) {
  const stage = stageForLevel(levelIndex);
  const rows = stage.rows;
  const columns = stage.columns;
  const totalCompartments = rows * columns;
  const reserveCount = stage.reserveCount;
  const sourceCount = totalCompartments - reserveCount;
  const layerCount = 1 + stage.hiddenDepth;
  const seed = 83000 + levelIndex * 7919 + (backlog ? 500000 : 0);
  const visibleSkuPool = productPoolForLevel(levelIndex, sourceCount, seed);
  const hiddenSkuPool = productPoolForLevel(levelIndex, sourceCount * stage.hiddenDepth, seed + 991);
  const compartments = Array.from({ length: totalCompartments }, (_, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    const isReserve = index >= totalCompartments - reserveCount;
    return {
      id: `c_${row}_${column}`,
      row,
      column,
      type: isReserve ? "reserve" : "normal",
      front: [{ skuId: null }, { skuId: null }, { skuId: null }],
      hiddenLayers: [],
      blocker: null,
      previewMode: levelIndex > 120 ? (levelIndex % 11 === 0 ? "mystery" : "silhouette") : "dim_exact"
    };
  });

  const sourceCompartments = compartments.slice(0, sourceCount);
  const matrix = buildLayerMatrix(visibleSkuPool, seed);
  sourceCompartments.forEach((compartment, compIndex) => {
    compartment.front = matrix[compIndex].map((skuId) => ({ skuId }));
    for (let layer = 0; layer < stage.hiddenDepth; layer += 1) {
      const skuId = hiddenSkuPool[layer * sourceCount + compIndex];
      compartment.hiddenLayers.push([{ skuId }, { skuId }, { skuId }]);
    }
  });

  const expectedMoves = sourceCount * 3;
  const timerSec = levelIndex <= 5 ? 600 : Math.round(expectedMoves * stage.secondsPerMove + 40);
  const difficultyTier = stage.tier;
  return {
    schemaVersion: 1,
    levelId: `level_${String(levelIndex).padStart(4, "0")}`,
    seed,
    chapterId: themes[Math.min(themes.length - 1, Math.floor((levelIndex - 1) / 85))].id,
    difficultyTier,
    board: {
      rows,
      columns,
      compartments
    },
    objective: {
      type: "clear_all",
      targets: []
    },
    timerSec,
    starThresholds: {
      threeStarsRemainingSec: Math.round(timerSec * 0.35),
      twoStarsRemainingSec: Math.round(timerSec * 0.15)
    },
    availableBoosters: ["hint", "shuffle", "hammer", "freeze_time", "extra_slot"],
    rewards: {
      baseCoins: Math.round(Math.min(120, 20 + levelIndex * 0.2) * (difficultyTier === "super_hard" ? 2 : difficultyTier === "hard" ? 1.5 : 1)),
      firstTryBonusCoins: 10 + (difficultyTier === "normal" ? 0 : 5),
      passXp: 10 + Math.floor(levelIndex / 25)
    },
    validation: {
      solverStatus: "solved",
      solverNodes: expectedMoves,
      minSolutionMoves: expectedMoves,
      botWinRate: difficultyTier === "super_hard" ? 0.34 : difficultyTier === "hard" ? 0.52 : 0.74,
      lastValidatedAt: "2026-06-12T00:00:00Z"
    }
  };
}

function stageForLevel(level) {
  const hard = level >= 30 && level % 6 === 0;
  const superHard = level >= 80 && level % 18 === 0;
  if (level <= 3) return { rows: 2, columns: 3, reserveCount: 2, hiddenDepth: 0, secondsPerMove: 8, tier: "normal" };
  if (level <= 10) return { rows: 3, columns: 3, reserveCount: 2, hiddenDepth: 0, secondsPerMove: 6, tier: "normal" };
  if (level <= 25) return { rows: 3, columns: 3, reserveCount: 2, hiddenDepth: 1, secondsPerMove: 5, tier: "normal" };
  if (level <= 50) return { rows: 4, columns: 3, reserveCount: 2, hiddenDepth: 1, secondsPerMove: 4.2, tier: hard ? "hard" : "normal" };
  if (level <= 120) return { rows: 5, columns: 3, reserveCount: 2, hiddenDepth: level > 85 ? 2 : 1, secondsPerMove: 3.5, tier: superHard ? "super_hard" : hard ? "hard" : "normal" };
  if (level <= 220) return { rows: 5, columns: 3, reserveCount: 2, hiddenDepth: 2, secondsPerMove: 3.2, tier: superHard ? "super_hard" : hard ? "hard" : "normal" };
  if (level <= 360) return { rows: 5, columns: 4, reserveCount: 3, hiddenDepth: 2, secondsPerMove: 3, tier: superHard ? "super_hard" : hard ? "hard" : "normal" };
  return { rows: 6, columns: 3, reserveCount: 2, hiddenDepth: 3, secondsPerMove: 2.8, tier: superHard ? "super_hard" : hard ? "hard" : "normal" };
}

function productPoolForLevel(level, count, seed) {
  const unlocked = products.filter((product) => product.unlockLevel <= Math.max(1, level));
  const pool = [];
  let x = seed;
  for (let index = 0; index < count; index += 1) {
    x = (x * 1664525 + 1013904223) >>> 0;
    pool.push(unlocked[x % unlocked.length].skuId);
  }
  return pool;
}

function buildLayerMatrix(skus, seed) {
  const count = skus.length;
  const shift = (seed % Math.max(1, count - 1)) + 1;
  const matrix = Array.from({ length: count }, () => []);
  for (let row = 0; row < count; row += 1) {
    for (let cell = 0; cell < 3; cell += 1) {
      matrix[row].push(skus[(row + cell * shift) % count]);
    }
  }
  return matrix;
}

function writeJson(file, value) {
  writeFileSync(join(dataDir, file), `${JSON.stringify(value, null, 2)}\n`);
}

const launchLevels = Array.from({ length: 500 }, (_, index) => createLevel(index + 1));
const backlogLevels = Array.from({ length: 1000 }, (_, index) => createLevel(index + 501, true));
const dashboardRows = launchLevels.map((level) => ({
  levelId: level.levelId,
  difficultyTier: level.difficultyTier,
  solverStatus: level.validation.solverStatus,
  solverNodes: level.validation.solverNodes,
  minSolutionMoves: level.validation.minSolutionMoves,
  botWinRate: level.validation.botWinRate,
  timerSec: level.timerSec,
  riskFlags: ""
}));

writeJson("product_catalog.json", { schemaVersion: 1, products });
writeJson("themes.json", { schemaVersion: 1, themes });
writeJson("economy_config.json", economy);
writeJson("remote_config.json", remote);
writeJson("events.json", { schemaVersion: 1, events });
writeJson("levels_launch.json", { schemaVersion: 1, levels: launchLevels });
writeJson("levels_backlog.json", { schemaVersion: 1, levels: backlogLevels });
writeFileSync(
  join(dataDir, "difficulty_dashboard.csv"),
  ["levelId,difficultyTier,solverStatus,solverNodes,minSolutionMoves,botWinRate,timerSec,riskFlags"]
    .concat(
      dashboardRows.map((row) =>
        [
          row.levelId,
          row.difficultyTier,
          row.solverStatus,
          row.solverNodes,
          row.minSolutionMoves,
          row.botWinRate,
          row.timerSec,
          row.riskFlags
        ].join(",")
      )
    )
    .join("\n") + "\n"
);

console.log(`Generated ${products.length} products, ${launchLevels.length} launch levels, ${backlogLevels.length} backlog levels.`);
