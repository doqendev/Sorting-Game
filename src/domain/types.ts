export type DifficultyTier = "normal" | "hard" | "super_hard" | "relax";
export type ObjectiveType = "clear_all" | "collect_orders" | "clear_special" | "combo_target" | "time_challenge";
export type PreviewMode = "dim_exact" | "silhouette" | "mystery";
export type BoosterId = "hint" | "shuffle" | "hammer" | "freeze_time" | "extra_slot";
export type InputMode = "tap" | "drag" | "tap_and_drag";
export type CompartmentType = "normal" | "reserve" | "locked" | "objective" | "event";
export type BlockerType = "tape" | "frost" | "mystery_bag" | "locked_shelf" | "crate";
export type LevelEnd = "win" | "loss_timeout" | "loss_stalemate" | "quit" | null;
export type FailReason =
  | "timeout"
  | "board_jammed"
  | "reserve_mismanagement"
  | "objective_incomplete"
  | "blocker_remaining"
  | "unclear_target_remaining"
  | null;
export type MoveQuality = "match_ready" | "reveal_enabling" | "good" | "risky" | "neutral";

export interface ProductSKU {
  skuId: string;
  displayNameKey: string;
  category: string;
  silhouetteClass: string;
  rarity: "common" | "uncommon" | "rare" | "seasonal";
  prefabAddress: string;
  iconAddress: string;
  assetAddress: string;
  unlockLevel: number;
  colorTags: string[];
  similarityTags: string[];
  sizeClass: "small" | "medium" | "large";
  readabilityScore: number;
  readability: {
    smallScreenPass: boolean;
    colorblindSafe: boolean;
    hiddenPreviewPass: boolean;
    tapTargetPass: boolean;
    reviewNote: string;
  };
  seasonal: boolean;
  visual: {
    color: string;
    accent: string;
    shape: "box" | "bottle" | "pouch" | "sphere" | "can" | "toy" | "tube" | "crate";
    label: string;
  };
}

export interface ProductCatalog {
  schemaVersion: 1;
  products: ProductSKU[];
}

export interface CellConfig {
  skuId?: string | null;
  category?: string | null;
  flags?: string[];
  blocker?: BlockerType | null;
}

export interface LayerConfig extends Array<CellConfig> {}

export interface CompartmentConfig {
  id: string;
  row: number;
  column: number;
  type: CompartmentType;
  front: LayerConfig;
  hiddenLayers: LayerConfig[];
  blocker: BlockerType | null;
  previewMode: PreviewMode;
}

export interface LevelConfig {
  schemaVersion: 1;
  levelId: string;
  seed: number;
  chapterId: string;
  difficultyTier: DifficultyTier;
  board: {
    rows: number;
    columns: number;
    compartments: CompartmentConfig[];
  };
  objective: {
    type: ObjectiveType;
    targets: Array<{ skuId?: string; category?: string; flag?: string; count: number; label?: string }>;
    targetCombo?: number;
    timeLimitSec?: number;
  };
  tuning: {
    comboWindowSec: number;
    maxNonClearingMoves: number;
  };
  timerSec: number;
  starThresholds: {
    threeStarsRemainingSec: number;
    twoStarsRemainingSec: number;
  };
  availableBoosters: BoosterId[];
  rewards: {
    baseCoins: number;
    firstTryBonusCoins: number;
    passXp: number;
  };
  validation: {
    solverStatus: "solved" | "unsolved" | "timeout_unknown";
    secondarySolverStatus: "solved" | "unsolved" | "timeout_unknown";
    solverNodes: number;
    minSolutionMoves: number;
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
    humanReviewGrade: "A" | "B" | "C" | "D" | "F";
    riskFlags: string[];
    lastValidatedAt: string;
  };
  humanReview: {
    reviewer: string;
    grade: "A" | "B" | "C" | "D" | "F";
    notes: string;
  };
}

export interface CellState {
  cellIndex: number;
  product: ProductInstance | null;
  blocker: BlockerType | null;
}

export interface ProductInstance {
  instanceId: string;
  skuId: string;
  category: string | null;
  flags: string[];
}

export interface CompartmentState {
  id: string;
  row: number;
  column: number;
  type: CompartmentType;
  front: CellState[];
  hiddenLayers: CellState[][];
  blocker: BlockerType | null;
  previewMode: PreviewMode;
  isInteractable: boolean;
}

export interface TimerState {
  totalSec: number;
  remainingSec: number;
  running: boolean;
  frozenUntilMs: number;
}

export interface ComboState {
  value: number;
  max: number;
  lastClearAtMs: number;
  nonClearingMoves: number;
  windowSec: number;
  maxNonClearingMoves: number;
}

export interface ObjectiveState {
  type: ObjectiveType;
  targets: Array<{ skuId?: string; category?: string; flag?: string; count: number; cleared: number; label?: string }>;
  targetCombo: number;
  timeLimitSec?: number;
  clearedProducts: number;
  totalProducts: number;
  comboTargetMet: boolean;
}

export interface BoardState {
  levelId: string;
  seed: number;
  difficultyTier: DifficultyTier;
  timer: TimerState;
  compartments: CompartmentState[];
  objective: ObjectiveState;
  combo: ComboState;
  moveHistory: MoveAction[];
  moves: number;
  score: number;
  boostersUsed: BoosterId[];
  hiddenReveals: number;
  levelEnd: LevelEnd;
  failReason: FailReason;
  starThresholds: {
    threeStarsRemainingSec: number;
    twoStarsRemainingSec: number;
  };
}

export interface MoveAction {
  sourceCompartmentId: string;
  sourceCellIndex: number;
  targetCompartmentId: string;
  targetCellIndex: number;
  timestamp: number;
}

export interface ClearedTriple {
  compartmentId: string;
  skuId: string;
  combo: number;
}

export interface RevealedLayer {
  compartmentId: string;
  hiddenDepthBefore: number;
  hiddenDepthAfter: number;
}

export interface ResolutionResult {
  movedProducts: ProductInstance[];
  clearedTriples: ClearedTriple[];
  clearedProducts: ProductInstance[];
  revealedLayers: RevealedLayer[];
  objectiveUpdates: string[];
  comboChanged: boolean;
  scoreDelta: number;
  levelEnd: LevelEnd;
  moveQuality?: MoveQuality;
}

export interface LegalMove {
  sourceCompartmentId: string;
  sourceCellIndex: number;
  targetCompartmentId: string;
  targetCellIndex: number;
}

export interface EconomyConfig {
  schemaVersion: 1;
  currencies: {
    coins: { startingAmount: number; maxSoftCap: number };
    stars: { startingAmount: number };
    gems: { startingAmount: number };
  };
  boosterCosts: Record<BoosterId, { coins: number }>;
  reviveOffers: Array<{ id: string; type: "rewarded_ad" | "coins"; cost?: number; addSeconds: number }>;
  iapProducts: Array<{ id: string; kind: string; price: string; contents: Record<string, number | boolean | string> }>;
}

export interface RemoteConfig {
  schemaVersion: 1;
  ads: {
    interstitialEnabled: boolean;
    firstInterstitialAfterLevel: number;
    interstitialCooldownSec: number;
    suppressInterstitialAfterRewardedSec: number;
    bannerInGameplayEnabled: boolean;
  };
  difficulty: {
    timerMultiplierNormal: number;
    timerMultiplierHard: number;
    timerMultiplierSuperHard: number;
    comboWindowSec: number;
    maxNonClearingMoves: number;
  };
  economy: {
    winCoinsMultiplier: number;
    rewardedDoubleEnabled: boolean;
    starterPackVariant: string;
  };
  features: {
    relaxModeEnabled: boolean;
    collectionAlbumEnabled: boolean;
    battlePassEnabled: boolean;
    dailyOrdersEnabled: boolean;
    renovationEnabled: boolean;
  };
}

export interface PlayerSave {
  schemaVersion: 1;
  playerId: string;
  createdAt: string;
  lastSeenAt: string;
  progress: {
    highestLevelCompleted: number;
    currentChapterId: string;
    stars: number;
    xp: number;
    winStreak: number;
    passXp: number;
  };
  wallet: {
    coins: number;
    gems: number;
  };
  boosters: Record<BoosterId, number>;
  settings: {
    inputMode: InputMode;
    music: boolean;
    sfx: boolean;
    haptics: boolean;
    reduceMotion: boolean;
    relaxModePreferred: boolean;
    consentGranted: boolean;
  };
  purchases: {
    removeAds: boolean;
    activePassId: string | null;
    starterPackPurchased: boolean;
  };
  events: Record<string, unknown>;
  collections: Record<string, string[]>;
  renovation: {
    marketStandLevel: number;
    shelfLightingLevel: number;
    signageLevel: number;
  };
  ledger: Record<string, boolean>;
}

export interface AnalyticsEvent {
  name: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

export interface ReplayRecord {
  schemaVersion: 1;
  levelId: string;
  seed: number;
  moves: MoveAction[];
  boosters: Array<{ boosterId: BoosterId; timestamp: number; selected?: { compartmentId: string; cellIndex: number } }>;
  finalStateHash: string;
}
