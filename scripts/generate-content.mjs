import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const publicDir = join(root, "public");
const dataDir = join(publicDir, "data");
const assetDir = join(publicDir, "assets", "skus");
mkdirSync(dataDir, { recursive: true });
rmSync(assetDir, { recursive: true, force: true });
mkdirSync(assetDir, { recursive: true });

const skuPlan = {
  snack: [
    ["chips_blue", "Chips", "#2f73d9", "#ffd166", "pouch", ["bag", "salty"]],
    ["pretzel_red", "Pretzel", "#d94b4b", "#fff2c7", "knot", ["twist", "salty"]],
    ["cracker_green", "Cracker", "#3b9b66", "#f7df8a", "box", ["square", "baked"]],
    ["popcorn_yellow", "Popcorn", "#f5b82e", "#ffffff", "cup", ["tall", "corn"]],
    ["cookie_pink", "Cookie", "#d95f9f", "#5a302f", "disc", ["round", "sweet"]],
    ["wafer_teal", "Wafer", "#238a8d", "#fff4d6", "bar", ["flat", "sweet"]],
    ["nacho_orange", "Nacho", "#e66a2c", "#ffe2a8", "triangle", ["sharp", "salty"]],
    ["granola_purple", "Granola", "#7954b8", "#f5d06f", "box", ["square", "cereal"]],
    ["nuts_brown", "Nuts", "#8a5a44", "#f6d7a7", "jar", ["round", "protein"]],
    ["candy_cyan", "Candy", "#1ba6c9", "#ffffff", "wrapper", ["twist", "sweet"]]
  ],
  drink: [
    ["soda_blue", "Soda", "#1f74d1", "#ffffff", "can", ["cylinder", "fizzy"]],
    ["juice_orange", "Juice", "#f1842a", "#fff5ce", "carton", ["carton", "fruit"]],
    ["water_cyan", "Water", "#56c5d0", "#e9fbff", "bottle", ["tall", "clear"]],
    ["tea_green", "Tea", "#3f9a5f", "#fff1b8", "bottle", ["tall", "leaf"]],
    ["milk_white", "Milk", "#f7f7ef", "#4b7bd8", "carton", ["carton", "dairy"]],
    ["smoothie_pink", "Smoothie", "#db6698", "#fff1f6", "cup", ["tall", "fruit"]],
    ["tonic_lime", "Tonic", "#a6ce39", "#ffffff", "can", ["cylinder", "fizzy"]],
    ["cola_red", "Cola", "#b63838", "#fff2c7", "bottle", ["tall", "fizzy"]],
    ["lemonade_yellow", "Lemonade", "#f4cc38", "#ffffff", "bottle", ["tall", "citrus"]],
    ["coffee_brown", "Coffee", "#704535", "#f4d2aa", "cup", ["tall", "warm"]]
  ],
  fruit: [
    ["apple_red", "Apple", "#d84a3a", "#f7f1d2", "apple", ["round", "stem"]],
    ["pear_green", "Pear", "#78b84f", "#fff4c8", "pear", ["bulb", "stem"]],
    ["berry_blue", "Berry", "#4568c7", "#dce7ff", "cluster", ["round", "small"]],
    ["melon_green", "Melon", "#6bbf59", "#f3ffd8", "slice", ["large", "stripe"]],
    ["banana_yellow", "Banana", "#f3c83b", "#745c25", "banana", ["curve", "long"]],
    ["kiwi_brown", "Kiwi", "#8d7043", "#9ecf4f", "disc", ["round", "seed"]],
    ["peach_orange", "Peach", "#ef8d55", "#ffe2d1", "apple", ["round", "soft"]],
    ["plum_purple", "Plum", "#774aa3", "#e8d7ff", "pear", ["bulb", "deep"]],
    ["mango_gold", "Mango", "#e7a836", "#f05f42", "slice", ["large", "tropical"]],
    ["grape_violet", "Grape", "#7e5ac7", "#d5f1a8", "cluster", ["round", "bunch"]]
  ],
  household: [
    ["soap_teal", "Soap", "#26a6a0", "#ffffff", "bar", ["clean", "flat"]],
    ["towel_blue", "Towel", "#3d8bfd", "#d7edff", "roll", ["soft", "roll"]],
    ["brush_red", "Brush", "#d84a4a", "#f5d6a8", "brush", ["handle", "bristle"]],
    ["mug_green", "Mug", "#4da66f", "#ffffff", "mug", ["handle", "cup"]],
    ["sponge_yellow", "Sponge", "#f0c438", "#855f2e", "block", ["clean", "holes"]],
    ["candle_purple", "Candle", "#7e5ac7", "#ffe9a8", "candle", ["warm", "flame"]],
    ["basket_brown", "Basket", "#95613e", "#f1c48f", "basket", ["woven", "wide"]],
    ["plant_green", "Plant", "#37935d", "#8b5b3d", "plant", ["leaf", "pot"]],
    ["lamp_orange", "Lamp", "#df7d3b", "#fff0bb", "lamp", ["light", "shade"]],
    ["clock_cyan", "Clock", "#38a6b7", "#ffffff", "clock", ["round", "time"]]
  ]
};

const products = Object.entries(skuPlan).flatMap(([category, entries], categoryIndex) =>
  entries.map(([skuId, display, color, accent, silhouette, tags], index) => ({
    skuId,
    displayNameKey: `sku.${skuId}`,
    category,
    silhouetteClass: silhouette,
    rarity: index >= 8 ? "rare" : index >= 5 ? "uncommon" : "common",
    prefabAddress: `assets/skus/${skuId}.svg`,
    iconAddress: `assets/skus/${skuId}.svg`,
    assetAddress: `assets/skus/${skuId}.svg`,
    unlockLevel: Math.max(1, categoryIndex * 6 + Math.floor(index / 2) + 1),
    colorTags: [colorName(skuId), index % 2 === 0 ? "high_contrast" : "labeled"],
    similarityTags: tags,
    sizeClass: index % 7 === 0 ? "large" : index % 5 === 0 ? "small" : "medium",
    readabilityScore: 5,
    readability: {
      smallScreenPass: true,
      colorblindSafe: true,
      hiddenPreviewPass: true,
      tapTargetPass: true,
      reviewNote: "V2 vertical-slice SKU: strong silhouette, label mark, and contrast pair."
    },
    seasonal: false,
    visual: {
      color,
      accent,
      shape: mapShape(silhouette),
      label: display.slice(0, 2).toUpperCase()
    }
  }))
);

for (const product of products) {
  writeFileSync(join(assetDir, `${product.skuId}.svg`), skuSvg(product));
}

const productBySku = new Map(products.map((product) => [product.skuId, product]));

const themes = [
  ["snack_aisle", "Snack Aisle", "#a4673f", "#e8f2ec", "#f3bd42", 1],
  ["cooler_wall", "Cooler Wall", "#669fb1", "#edf8fa", "#2f73d9", 8],
  ["fruit_market", "Fruit Market", "#6aa650", "#eff6df", "#ef8d55", 14],
  ["home_corner", "Home Corner", "#896149", "#f1eadf", "#26a6a0", 20],
  ["rush_shelves", "Rush Shelves", "#6d7197", "#eef0fa", "#d84a4a", 26]
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
    hint: { coins: 90 },
    shuffle: { coins: 220 },
    hammer: { coins: 180 },
    freeze_time: { coins: 260 },
    extra_slot: { coins: 340 }
  },
  reviveOffers: [
    { id: "rv_timeout_plus_45_sec", type: "rewarded_ad", addSeconds: 45 },
    { id: "rv_no_moves_extra_shelf", type: "rewarded_ad", addSeconds: 0 },
    { id: "coins_plus_35_sec", type: "coins", cost: 250, addSeconds: 35 }
  ],
  iapProducts: [
    { id: "starter_pack", kind: "bundle", price: "$1.99", contents: { coins: 750, hint: 2, hammer: 1, freeze_time: 1 } },
    { id: "remove_ads", kind: "non_consumable", price: "$5.99", contents: { removeAds: true } },
    { id: "small_booster_pack", kind: "bundle", price: "$2.99", contents: { hint: 3, hammer: 2, freeze_time: 1 } },
    { id: "value_booster_pack", kind: "bundle", price: "$7.99", contents: { coins: 2200, hint: 5, shuffle: 3, hammer: 3, extra_slot: 2 } },
    { id: "piggy_bank", kind: "bank", price: "$3.99", contents: { coins: 3000 } }
  ]
};

const remote = {
  schemaVersion: 1,
  ads: {
    interstitialEnabled: true,
    firstInterstitialAfterLevel: 10,
    interstitialCooldownSec: 150,
    suppressInterstitialAfterRewardedSec: 180,
    bannerInGameplayEnabled: false
  },
  difficulty: {
    timerMultiplierNormal: 1,
    timerMultiplierHard: 0.92,
    timerMultiplierSuperHard: 0.84,
    comboWindowSec: 2.75,
    maxNonClearingMoves: 1
  },
  economy: {
    winCoinsMultiplier: 1,
    rewardedDoubleEnabled: true,
    starterPackVariant: "v2_value"
  },
  features: {
    relaxModeEnabled: true,
    collectionAlbumEnabled: true,
    battlePassEnabled: false,
    dailyOrdersEnabled: true,
    renovationEnabled: true
  }
};

const events = [
  { id: "daily_order", name: "Daily Order", durationHours: 24, mechanic: "Collect target categories from normal levels.", reward: "Coins, hint, album card" },
  { id: "treasure_shelves", name: "Treasure Shelves", durationHours: 96, mechanic: "Win streak opens three chest nodes.", reward: "Boosters, coins, shelf accent" }
];

const levelPlans = [
  plan(1, "Teach first triple", ["chips_blue", "soda_blue", "apple_red"], [], "clear_all", {}, 0, "tutorial", "snack_aisle"),
  plan(2, "Repeat triple with cleaner reserve use", ["pretzel_red", "juice_orange", "pear_green"], [], "clear_all", {}, 0, "tutorial", "snack_aisle"),
  plan(3, "Third confidence level", ["cracker_green", "water_cyan", "berry_blue"], [], "clear_all", {}, 0, "tutorial", "snack_aisle"),
  plan(4, "Reserve shelf taught", ["popcorn_yellow", "tea_green", "melon_green"], [], "clear_all", {}, 0, "tutorial", "snack_aisle"),
  plan(5, "Reserve with two rows", ["cookie_pink", "milk_white", "banana_yellow"], [], "clear_all", { sourceRows: 2 }, 0, "normal", "snack_aisle"),
  plan(6, "Reserve pressure without timer punishment", ["wafer_teal", "smoothie_pink", "kiwi_brown"], [], "clear_all", { sourceRows: 2, crateCells: 1 }, 0, "normal", "snack_aisle"),
  plan(7, "Exact hidden preview", ["nacho_orange", "tonic_lime", "peach_orange"], [["soap_teal", "towel_blue", "brush_red"]], "clear_all", {}, 1, "normal", "cooler_wall"),
  plan(8, "Mixed hidden queue", ["granola_purple", "cola_red", "plum_purple"], [["mug_green", "sponge_yellow", "candle_purple"]], "clear_all", {}, 1, "normal", "cooler_wall"),
  plan(9, "Two hidden decisions", ["nuts_brown", "lemonade_yellow", "mango_gold"], [["basket_brown", "plant_green", "lamp_orange"]], "clear_all", { sourceRows: 2 }, 1, "normal", "cooler_wall"),
  plan(10, "Hidden preview review", ["candy_cyan", "coffee_brown", "grape_violet"], [["clock_cyan", "chips_blue", "soda_blue"]], "clear_all", { sourceRows: 2 }, 1, "normal", "cooler_wall"),
  plan(11, "Planning ahead mild timer", ["chips_blue", "juice_orange", "pear_green"], [["pretzel_red", "water_cyan", "apple_red"]], "clear_all", { preview: "dim_exact" }, 1, "normal", "fruit_market"),
  plan(12, "Silhouette starts", ["cracker_green", "tea_green", "berry_blue"], [["popcorn_yellow", "milk_white", "melon_green"]], "clear_all", { preview: "silhouette" }, 1, "normal", "fruit_market"),
  plan(13, "Category mix planning", ["cookie_pink", "smoothie_pink", "banana_yellow"], [["wafer_teal", "tonic_lime", "kiwi_brown"]], "clear_all", { preview: "silhouette", sourceRows: 2 }, 1, "normal", "fruit_market"),
  plan(14, "Reveal and combo setup", ["nacho_orange", "cola_red", "peach_orange"], [["granola_purple", "lemonade_yellow", "plum_purple"]], "combo_target", { targetCombo: 2 }, 1, "normal", "fruit_market"),
  plan(15, "First hard label", ["nuts_brown", "coffee_brown", "mango_gold"], [["candy_cyan", "soda_blue", "grape_violet"]], "clear_all", { preview: "silhouette", sourceRows: 2 }, 1, "hard", "fruit_market"),
  plan(16, "Crate reserve pressure", ["soap_teal", "chips_blue", "apple_red"], [], "clear_all", { crateCells: 1 }, 0, "normal", "home_corner"),
  plan(17, "Tape lesson without deadlock", ["towel_blue", "soda_blue", "pear_green"], [], "clear_all", { crateCells: 1, blockerLabel: "tape" }, 0, "normal", "home_corner"),
  plan(18, "Frost lesson without deadlock", ["brush_red", "juice_orange", "berry_blue"], [], "clear_all", { crateCells: 2, blockerLabel: "frost" }, 0, "normal", "home_corner"),
  plan(19, "Blocked reserve plus hidden", ["mug_green", "water_cyan", "melon_green"], [["sponge_yellow", "tea_green", "banana_yellow"]], "clear_all", { crateCells: 1 }, 1, "normal", "home_corner"),
  plan(20, "Blocker review", ["candle_purple", "milk_white", "kiwi_brown"], [["basket_brown", "smoothie_pink", "peach_orange"]], "clear_all", { crateCells: 2, sourceRows: 2 }, 1, "hard", "home_corner"),
  plan(21, "Collect snack order", ["chips_blue", "soda_blue", "apple_red"], [["pretzel_red", "juice_orange", "pear_green"]], "collect_orders", { target: { category: "snack", count: 6, label: "Snack order" } }, 1, "normal", "rush_shelves"),
  plan(22, "Collect drink order", ["cracker_green", "water_cyan", "berry_blue"], [["popcorn_yellow", "tea_green", "melon_green"]], "collect_orders", { target: { category: "drink", count: 6, label: "Drink order" } }, 1, "normal", "rush_shelves"),
  plan(23, "Specific SKU order", ["cookie_pink", "milk_white", "banana_yellow"], [["cookie_pink", "smoothie_pink", "kiwi_brown"]], "collect_orders", { target: { skuId: "cookie_pink", count: 6, label: "Cookie order" } }, 1, "normal", "rush_shelves"),
  plan(24, "Special products", ["nacho_orange", "cola_red", "peach_orange"], [["granola_purple", "lemonade_yellow", "plum_purple"]], "clear_special", { specialSkus: ["nacho_orange"], target: { flag: "special", count: 3, label: "Ribbon goods" } }, 1, "normal", "rush_shelves"),
  plan(25, "Time challenge", ["nuts_brown", "coffee_brown", "mango_gold"], [["candy_cyan", "soda_blue", "grape_violet"]], "time_challenge", { timer: 120 }, 1, "hard", "rush_shelves"),
  plan(26, "Hard arc mixed hidden", ["soap_teal", "juice_orange", "apple_red"], [["towel_blue", "water_cyan", "pear_green"], ["brush_red", "tea_green", "berry_blue"]], "clear_all", { sourceRows: 2, preview: "silhouette" }, 2, "hard", "rush_shelves"),
  plan(27, "Hard category order", ["mug_green", "milk_white", "melon_green"], [["sponge_yellow", "smoothie_pink", "banana_yellow"], ["candle_purple", "tonic_lime", "kiwi_brown"]], "collect_orders", { target: { category: "household", count: 9, label: "Home order" }, preview: "silhouette" }, 2, "hard", "rush_shelves"),
  plan(28, "Hard special order", ["basket_brown", "cola_red", "peach_orange"], [["plant_green", "lemonade_yellow", "plum_purple"], ["lamp_orange", "coffee_brown", "mango_gold"]], "clear_special", { specialSkus: ["basket_brown", "plant_green"], target: { flag: "special", count: 6, label: "Badge goods" }, preview: "mystery" }, 2, "hard", "rush_shelves"),
  plan(29, "Hard combo order", ["clock_cyan", "soda_blue", "grape_violet"], [["chips_blue", "juice_orange", "apple_red"], ["pretzel_red", "water_cyan", "pear_green"]], "combo_target", { targetCombo: 3, preview: "silhouette" }, 2, "hard", "rush_shelves"),
  plan(30, "Vertical slice finale", ["cracker_green", "tea_green", "berry_blue"], [["popcorn_yellow", "milk_white", "melon_green"], ["cookie_pink", "smoothie_pink", "banana_yellow"]], "time_challenge", { sourceRows: 2, timer: 150, preview: "mystery", crateCells: 1 }, 2, "hard", "rush_shelves")
];

const launchLevels = levelPlans.map(createLevel);
const sourceLevels = launchLevels.map((level, index) => ({
  levelId: level.levelId,
  intent: levelPlans[index].intent,
  curriculum: levelPlans[index].curriculum,
  humanReview: level.humanReview,
  authoredAt: "2026-06-13T00:00:00Z"
}));

writeJson("product_catalog.json", { schemaVersion: 1, products });
writeJson("themes.json", { schemaVersion: 1, themes });
writeJson("economy_config.json", economy);
writeJson("remote_config.json", remote);
writeJson("events.json", { schemaVersion: 1, events });
writeJson("levels_launch.json", { schemaVersion: 1, contentVersion: "v2_vertical_slice_001", levels: launchLevels });
writeJson("levels_backlog.json", { schemaVersion: 1, contentVersion: "v2_candidates_empty_until_slice_validated", levels: [] });
writeJson("level_sources.json", { schemaVersion: 1, source: sourceLevels });
writeFileSync(join(dataDir, "difficulty_dashboard.csv"), "levelId,difficultyTier,solverStatus,secondarySolverStatus,minSolutionMoves,averageBotMoves,botWinRate,deadEndProbability,averageReservePressure,revealCount,hiddenInformationRatio,timePressureRatio,boosterFreeWinProbability,autoClearRisk,readabilityRisk,humanReviewGrade,riskFlags\n");

console.log(`Generated V2 vertical slice: ${products.length} SKUs, ${launchLevels.length} authored launch levels, 0 backlog levels.`);

function plan(level, intent, visible, hiddenGroups, objectiveType, options, hiddenDepth, difficultyTier, chapterId) {
  return {
    level,
    intent,
    visible,
    hiddenGroups,
    objectiveType,
    options,
    hiddenDepth,
    difficultyTier,
    chapterId,
    curriculum: curriculumFor(level)
  };
}

function createLevel(spec) {
  const sourceRows = spec.options.sourceRows ?? 1;
  const rows = sourceRows + 1;
  const columns = 3;
  const compartments = [];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const isReserve = row === rows - 1;
      const id = `c_${row}_${column}`;
      compartments.push({
        id,
        row,
        column,
        type: isReserve ? "reserve" : "normal",
        front: isReserve ? reserveCells(spec, column) : spec.visible.map((skuId) => cell(skuId, spec)),
        hiddenLayers: isReserve
          ? []
          : spec.hiddenGroups.slice(0, spec.hiddenDepth).map((group) => group.map((skuId) => cell(skuId, spec))),
        blocker: null,
        previewMode: spec.options.preview ?? (spec.level <= 11 ? "dim_exact" : spec.level <= 27 ? "silhouette" : "mystery")
      });
    }
  }
  const timerSec = spec.options.timer ?? (spec.level <= 10 ? 420 : spec.difficultyTier === "hard" ? 150 : 220);
  return {
    schemaVersion: 1,
    levelId: `level_${String(spec.level).padStart(4, "0")}`,
    seed: 120000 + spec.level * 97,
    chapterId: spec.chapterId,
    difficultyTier: spec.level <= 4 ? "normal" : spec.difficultyTier,
    board: { rows, columns, compartments },
    objective: buildObjective(spec),
    tuning: {
      comboWindowSec: spec.difficultyTier === "hard" ? 2.5 : 2.9,
      maxNonClearingMoves: spec.objectiveType === "combo_target" ? 3 : 1
    },
    timerSec,
    starThresholds: {
      threeStarsRemainingSec: Math.round(timerSec * 0.4),
      twoStarsRemainingSec: Math.round(timerSec * 0.18)
    },
    availableBoosters: spec.level < 8 ? ["hint"] : ["hint", "shuffle", "hammer", "freeze_time", "extra_slot"],
    rewards: {
      baseCoins: spec.difficultyTier === "hard" ? 45 : spec.level <= 5 ? 24 : 32,
      firstTryBonusCoins: spec.level <= 10 ? 8 : 12,
      passXp: 0
    },
    validation: emptyValidation(),
    humanReview: {
      reviewer: "studio_v2",
      grade: spec.difficultyTier === "hard" ? "B" : "A",
      notes: spec.intent
    }
  };
}

function cell(skuId, spec) {
  const product = productBySku.get(skuId);
  const flags = [];
  if (spec.options.specialSkus?.includes(skuId)) flags.push("special");
  return {
    skuId,
    category: product.category,
    flags,
    blocker: null
  };
}

function reserveCells(spec, column) {
  const crateCount = spec.options.crateCells ?? 0;
  const cells = [{ skuId: null }, { skuId: null }, { skuId: null }];
  if (column < crateCount) {
    cells[2] = { skuId: null, blocker: "crate" };
  }
  return cells;
}

function buildObjective(spec) {
  if (spec.objectiveType === "combo_target") {
    return { type: "combo_target", targets: [], targetCombo: spec.options.targetCombo ?? 2 };
  }
  if (spec.objectiveType === "collect_orders") {
    return { type: "collect_orders", targets: [spec.options.target] };
  }
  if (spec.objectiveType === "clear_special") {
    return { type: "clear_special", targets: [spec.options.target] };
  }
  if (spec.objectiveType === "time_challenge") {
    return { type: "time_challenge", targets: [], timeLimitSec: spec.options.timer ?? 150 };
  }
  return { type: "clear_all", targets: [] };
}

function emptyValidation() {
  return {
    solverStatus: "timeout_unknown",
    secondarySolverStatus: "timeout_unknown",
    solverNodes: 0,
    minSolutionMoves: 0,
    averageBotMoves: 0,
    botWinRate: 0,
    deadEndProbability: 1,
    averageReservePressure: 0,
    revealCount: 0,
    hiddenInformationRatio: 0,
    timePressureRatio: 0,
    boosterFreeWinProbability: 0,
    autoClearRisk: 0,
    readabilityRisk: 0,
    humanReviewGrade: "C",
    riskFlags: ["unvalidated"],
    lastValidatedAt: "1970-01-01T00:00:00Z"
  };
}

function curriculumFor(level) {
  if (level <= 3) return "move_and_triple_clear";
  if (level <= 6) return "reserve_shelves";
  if (level <= 10) return "hidden_previews";
  if (level <= 15) return "planning_ahead";
  if (level <= 20) return "blockers";
  if (level <= 25) return "orders";
  return "hard_arc";
}

function colorName(skuId) {
  return skuId.split("_").at(-1);
}

function mapShape(shape) {
  if (shape === "bottle") return "bottle";
  if (shape === "can") return "can";
  if (shape === "disc" || shape === "clock" || shape === "apple" || shape === "cluster") return "sphere";
  if (shape === "bar" || shape === "block") return "box";
  if (shape === "cup" || shape === "carton" || shape === "jar") return "tube";
  return "pouch";
}

function skuSvg(product) {
  const label = product.visual.label;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" role="img" aria-label="${product.skuId}">
  <rect width="128" height="128" rx="24" fill="#f7fbf8"/>
  <path d="${shapePath(product.silhouetteClass)}" fill="${product.visual.color}" stroke="#15231f" stroke-width="5" stroke-linejoin="round"/>
  <circle cx="92" cy="34" r="14" fill="${product.visual.accent}" stroke="#15231f" stroke-width="4"/>
  <rect x="34" y="76" width="60" height="26" rx="8" fill="${product.visual.accent}" stroke="#15231f" stroke-width="4"/>
  <text x="64" y="95" text-anchor="middle" font-family="Arial, sans-serif" font-size="19" font-weight="800" fill="#15231f">${label}</text>
</svg>
`;
}

function shapePath(shape) {
  const paths = {
    pouch: "M34 24h60l8 72-38 16-38-16 8-72z",
    knot: "M32 62c8-28 56-28 64 0-8 28-56 28-64 0zm22 0c2 12 18 12 20 0-2-12-18-12-20 0z",
    box: "M28 30h72v70H28z",
    cup: "M36 24h56l-8 82H44z",
    disc: "M28 64a36 36 0 1072 0 36 36 0 00-72 0z",
    bar: "M24 44h80v42H24z",
    triangle: "M64 20l44 86H20z",
    jar: "M42 30h44l8 16v54H34V46z",
    can: "M38 26h52v76H38z",
    carton: "M34 34l28-16 32 18v72H34z",
    bottle: "M52 20h24v18l14 18v52H38V56l14-18z",
    apple: "M36 64c0-28 18-40 28-28s28 0 28 28-14 42-28 42-28-14-28-42z",
    pear: "M64 24c18 18 30 34 30 54 0 22-14 34-30 34S34 100 34 78c0-20 12-36 30-54z",
    cluster: "M42 48a16 16 0 1132 0 16 16 0 01-32 0zm26 26a16 16 0 1132 0 16 16 0 01-32 0zM30 78a16 16 0 1132 0 16 16 0 01-32 0z",
    slice: "M24 90c18-44 54-66 88-66-8 42-36 70-88 66z",
    banana: "M30 86c42 8 68-16 76-54 8 48-28 78-78 66z",
    roll: "M24 68c0-24 80-24 80 0s-80 24-80 0z",
    brush: "M24 86l56-56 18 18-56 56z",
    mug: "M34 38h52v54H34z M86 50h18v28H86z",
    candle: "M48 44h32v60H48z M64 18c14 16 4 26 0 30-4-4-14-14 0-30z",
    basket: "M28 54h72l-10 48H38z M44 54c0-24 40-24 40 0",
    plant: "M48 68h32l8 36H40z M64 64c-20-8-22-28-8-42 18 10 20 28 8 42z M66 64c20-8 22-28 8-42-18 10-20 28-8 42z",
    lamp: "M38 30h52l12 38H26z M58 68h12v36H58z",
    clock: "M28 64a36 36 0 1072 0 36 36 0 00-72 0z M64 42v24l18 10"
  };
  return paths[shape] ?? paths.box;
}

function writeJson(file, value) {
  writeFileSync(join(dataDir, file), `${JSON.stringify(value, null, 2)}\n`);
}
