export type DifficultyTier = "normal" | "hard" | "super_hard" | "relax";
export type ObjectiveType = "clear_all" | "collect_orders" | "clear_special" | "combo_target" | "time_challenge";
export type PreviewMode = "dim_exact" | "silhouette" | "mystery";
export type BoosterId = "hint" | "shuffle" | "hammer" | "freeze_time" | "extra_slot";
export type InputMode = "tap" | "drag" | "tap_and_drag";
export type CompartmentType = "normal" | "reserve" | "locked" | "objective" | "event";
export type BlockerType = "tape" | "frost" | "mystery_bag" | "locked_shelf" | "crate";
export type LevelEnd = "win" | "loss_timeout" | "loss_stalemate" | "quit" | null;

export interface ProductSKU {
  skuId: string;
  displayNameKey: string;
  category: string;
  silhouetteClass: string;
  rarity: "common" | "uncommon" | "rare" | "seasonal";
  prefabAddress: string;
  iconAddress: string;
  unlockLevel: number;
  colorTags: string[];
  sizeClass: "small" | "medium" | "large";
  readabilityScore: number;
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
    targets: Array<{ skuId?: string; category?: string; count: number }>;
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
    solverNodes: number;
    minSolutionMoves: number;
    botWinRate: number;
    lastValidatedAt: string;
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
}

export interface ObjectiveState {
  type: ObjectiveType;
  targets: Array<{ skuId?: string; category?: string; count: number; cleared: number }>;
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
  revealedLayers: RevealedLayer[];
  objectiveUpdates: string[];
  comboChanged: boolean;
  scoreDelta: number;
  levelEnd: LevelEnd;
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
  ledger: Record<string, boolean>;
}

export interface AnalyticsEvent {
  name: string;
  timestamp: string;
  payload: Record<string, unknown>;
}
