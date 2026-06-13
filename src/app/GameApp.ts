import { applyMoveAndResolve, calculateStars, createBoardState, createsPair, tickTimer } from "../domain/board";
import { createBooster, findHint } from "../domain/boosters";
import type {
  BoardState,
  BoosterId,
  FailReason,
  InputMode,
  LevelConfig,
  LegalMove,
  PlayerSave,
  ProductSKU,
  RemoteConfig,
  ResolutionResult
} from "../domain/types";
import type { ContentBundle } from "../data/loaders";
import { AnalyticsService, installCrashReporting } from "../services/analytics";
import { SaveService } from "../services/save";
import { EconomyService } from "../services/economy";
import { AdsService } from "../services/ads";
import { AudioService, type SoundCue } from "../services/audio";
import { HapticsService } from "../services/haptics";
import { ThreeBoardView } from "../presentation/ThreeBoardView";
import { rewriteAppUrls } from "../services/paths";

declare global {
  interface Window {
    __SHELF_SORT_TEST__?: {
      move: (move: LegalMove) => Promise<void>;
      state: () => BoardState;
      analytics: () => ReturnType<AnalyticsService["all"]>;
      isAnimating: () => boolean;
      setReduceMotion: (enabled: boolean) => void;
      forceLoss: (reason?: FailReason) => void;
      select: (selection: { compartmentId: string; cellIndex: number } | null) => void;
      setInputMode: (inputMode: InputMode) => void;
      cellPoint: (compartmentId: string, cellIndex: number) => { x: number; y: number } | null;
      setConsent: (enabled: boolean) => void;
    };
  }
}

export class GameApp {
  private root: HTMLElement;
  private boardHost!: HTMLElement;
  private boardView!: ThreeBoardView;
  private saveService: SaveService;
  private analytics: AnalyticsService;
  private economy: EconomyService;
  private ads: AdsService;
  private audio: AudioService;
  private haptics: HapticsService;
  private save: PlayerSave;
  private state!: BoardState;
  private currentLevel!: LevelConfig;
  private selected: { compartmentId: string; cellIndex: number } | null = null;
  private activeHint: ReturnType<typeof findHint> | null = null;
  private timerHandle = 0;
  private lastTick = performance.now();
  private timerWarningPlayed = false;
  private isAnimating = false;
  private levelStartedAtMs = performance.now();
  private firstClearTracked = false;
  private invalidMoveCount = 0;
  private dragCancelCount = 0;
  private drawerOpenedAtMs = 0;
  private drawerReadyTimer = 0;
  private rewardBeatTimers: number[] = [];
  private catalogBySku: Map<string, ProductSKU>;

  constructor(private content: ContentBundle, root: HTMLElement) {
    this.root = root;
    this.catalogBySku = new Map(content.catalog.products.map((product) => [product.skuId, product]));
    this.saveService = new SaveService(content.economy);
    this.save = this.saveService.syncCloud(this.saveService.load());
    this.analytics = new AnalyticsService(() => this.save);
    installCrashReporting(this.analytics);
    this.economy = new EconomyService(
      content.economy,
      this.analytics,
      () => this.save,
      (save) => this.persistSave(save)
    );
    this.ads = new AdsService(content.remote, this.analytics, () => this.save);
    this.audio = new AudioService(() => this.save.settings);
    this.haptics = new HapticsService(() => this.save.settings);
  }

  start(): void {
    this.renderShell();
    this.boardHost = this.root.querySelector<HTMLElement>("#board")!;
    this.boardView = new ThreeBoardView(this.boardHost, this.content.catalog.products, {
      onMove: (move) => this.handleMove(move),
      onInvalid: (reason) => this.invalidMove(reason),
      onSelect: (selection) => {
        this.selected = selection;
        if (selection) this.feedback("select");
        this.updateHud();
      },
      onDragCancel: () => this.dragCancel(),
      onFeedback: (cue) => this.feedback(cue)
    });
    this.boardView.setInputMode(this.save.settings.inputMode);
    this.boardView.setReduceMotion(this.save.settings.reduceMotion);
    this.bindUi();
    this.startLevel(Math.max(1, this.save.progress.highestLevelCompleted + 1));
    this.analytics.track("app_open", { consentState: this.save.settings.consentGranted });
    this.analytics.track("session_start", { sessionNumber: Number(localStorage.getItem("shelf-sort-sessions") ?? 0) + 1 });
    window.addEventListener("beforeunload", () => {
      this.analytics.track("session_end", {
        levelId: this.currentLevel?.levelId,
        moves: this.state?.moves,
        result: this.state?.levelEnd ?? "in_progress"
      });
      if (this.isAnimating || this.boardView.isAnimating()) {
        this.analytics.track("level_quit_during_animation", {
          levelId: this.currentLevel?.levelId,
          moves: this.state?.moves
        });
      }
    });
    this.installLocalTestHooks();
    localStorage.setItem("shelf-sort-sessions", String(Number(localStorage.getItem("shelf-sort-sessions") ?? 0) + 1));
  }

  private renderShell(): void {
    this.root.innerHTML = rewriteAppUrls(`
      <main class="game" aria-label="Shelf Sort 3D">
        <section class="top-hud" aria-label="Level status">
          <button class="icon-button game-icon-button" data-action="map" title="Chapter map" aria-label="Chapter map">
            <img class="icon-img" src="/assets/ui/map.svg" alt="">
          </button>
          <div class="level-pill"><span id="levelLabel">Level 1</span><small id="tierLabel">Normal</small></div>
          <div class="timer-wrap">
            <span class="timer-icon" aria-hidden="true"><img class="icon-img" src="/assets/ui/timer.svg" alt=""></span>
            <div id="timer" class="timer">0:00</div>
            <div id="combo" class="combo hidden">x1 Combo</div>
          </div>
          <div class="currency"><img class="currency-icon" src="/assets/ui/coin.svg" alt=""><span id="coinLabel">0</span><small>coins</small></div>
          <div class="currency"><img class="currency-icon" src="/assets/ui/star.svg" alt=""><span id="starLabel">0</span><small>stars</small></div>
          <button class="icon-button game-icon-button" data-action="pause" title="Pause" aria-label="Pause">
            <img class="icon-img" src="/assets/ui/pause.svg" alt="">
          </button>
        </section>

        <section class="objective-row" id="objectiveRow"></section>
        <section id="board" class="board-stage" aria-label="Interactive shelf board"></section>

        <section class="bottom-hud" aria-label="Boosters">
          <button class="booster" data-booster="hint" title="Hint" aria-label="Hint booster"><img class="icon-img" src="/assets/ui/hint.svg" alt=""><small id="boost_hint">0</small></button>
          <button class="booster" data-booster="shuffle" title="Shuffle" aria-label="Shuffle booster"><img class="icon-img" src="/assets/ui/shuffle.svg" alt=""><small id="boost_shuffle">0</small></button>
          <button class="booster" data-booster="hammer" title="Clear One" aria-label="Hammer booster"><img class="icon-img" src="/assets/ui/hammer.svg" alt=""><small id="boost_hammer">0</small></button>
          <button class="booster" data-booster="freeze_time" title="Freeze Time" aria-label="Freeze Time booster"><img class="icon-img" src="/assets/ui/freeze.svg" alt=""><small id="boost_freeze_time">0</small></button>
          <button class="booster" data-booster="extra_slot" title="Extra Shelf" aria-label="Extra Shelf booster"><img class="icon-img" src="/assets/ui/extra-shelf.svg" alt=""><small id="boost_extra_slot">0</small></button>
          <button class="text-button shop-button" data-action="shop"><img class="icon-img" src="/assets/ui/shop.svg" alt=""><span>Shop</span></button>
        </section>

        <section id="banner" class="ad-banner hidden">Sandbox adaptive banner. Remove Ads disables forced banners.</section>

        <aside id="toast" class="toast hidden" role="status"></aside>

        <dialog id="modal" class="modal">
          <div id="modalContent"></div>
        </dialog>

        <section id="rewardOverlay" class="reward-overlay hidden" aria-live="polite"></section>
      </main>
    `);
  }

  private bindUi(): void {
    this.root.addEventListener("click", (event) => {
      this.audio.unlock();
      const target = event.target as HTMLElement;
      const boosterButton = target.closest<HTMLElement>("[data-booster]");
      if (boosterButton) {
        void this.useBooster(boosterButton.dataset.booster as BoosterId);
        return;
      }
      const action = target.closest<HTMLElement>("[data-action]")?.dataset.action;
      if (!action) return;
      if (["pause", "shop", "map", "settings", "events", "collections", "privacy", "consent_panel"].includes(action)) {
        this.closeRewardDrawer();
      }
      if (action === "pause") this.openPanel("pause");
      if (action === "shop") this.openPanel("shop");
      if (action === "map") this.openPanel("map");
      if (action === "close") this.closeModal();
      if (action === "settings") this.openPanel("settings");
      if (action === "events") this.openPanel("events");
      if (action === "collections") this.openPanel("collections");
      if (action === "privacy") this.openPanel("privacy");
      if (action === "daily") this.claimDailyReward();
      if (action === "next") {
        if (this.drawerOpenedAtMs) {
          this.analytics.track("win_drawer_next_tap_delay_ms", {
            levelId: this.currentLevel.levelId,
            delayMs: Math.round(performance.now() - this.drawerOpenedAtMs)
          });
        }
        this.closeRewardDrawer();
        this.closeModal();
        this.startLevel(Math.min(this.content.launchLevels.length, this.save.progress.highestLevelCompleted + 1));
      }
      if (action === "drawer_skip") this.skipRewardDrawer(true);
      if (action === "objective_info") {
        this.analytics.track("objective_chip_clicks", {
          levelId: this.currentLevel.levelId,
          objectiveType: this.state.objective.type,
          remaining: Math.max(0, this.state.objective.totalProducts - this.state.objective.clearedProducts)
        });
        this.toast(this.remainingObjectiveLabel());
      }
      if (action === "retry") {
        this.closeRewardDrawer();
        this.closeModal();
        this.startLevel(Number(this.currentLevel.levelId.split("_")[1]));
      }
      if (action === "revive_ad") this.reviveWithAd();
      if (action === "revive_coin") this.reviveWithCoins();
      if (action === "double_reward") this.doubleReward();
      if (action === "consent_accept") this.acceptConsent();
      if (action === "relax") this.toggleRelax();
      if (action === "input") this.toggleInputMode();
      if (action === "motion") this.toggleReduceMotion();
      if (action === "sfx") this.toggleSfx();
      if (action === "haptics") this.toggleHaptics();
      if (action === "music") this.toggleMusic();
      if (action === "consent_panel") this.openPanel("consent");
      if (action.startsWith("buy:")) this.buyProduct(action.slice(4));
      if (action.startsWith("jump:")) {
        this.closeModal();
        this.startLevel(Number(action.slice(5)));
      }
    });
  }

  private startLevel(levelNumber: number): void {
    const index = Math.max(0, Math.min(this.content.launchLevels.length - 1, levelNumber - 1));
    this.currentLevel = structuredClone(this.content.launchLevels[index]);
    if (this.save.settings.relaxModePreferred && this.content.remote.features.relaxModeEnabled) {
      this.currentLevel.timerSec = Math.max(this.currentLevel.timerSec * 4, 900);
      this.currentLevel.difficultyTier = "relax";
    } else {
      this.currentLevel.timerSec = Math.round(this.currentLevel.timerSec * timerMultiplier(this.currentLevel.difficultyTier, this.content.remote));
    }
    this.state = createBoardState(this.currentLevel);
    this.activeHint = null;
    this.selected = null;
    this.timerWarningPlayed = false;
    this.firstClearTracked = false;
    this.invalidMoveCount = 0;
    this.dragCancelCount = 0;
    this.levelStartedAtMs = performance.now();
    this.closeRewardDrawer();
    this.applyTheme();
    this.boardView.setSelected(null);
    this.boardView.setHint(null);
    this.boardView.renderBoard(this.state);
    this.applyTutorialHint(index + 1);
    this.analytics.track("level_start", {
      levelId: this.currentLevel.levelId,
      difficulty: this.currentLevel.difficultyTier,
      attempt: Number(sessionStorage.getItem(`attempt_${this.currentLevel.levelId}`) ?? 0) + 1,
      boostersSelected: []
    });
    sessionStorage.setItem(
      `attempt_${this.currentLevel.levelId}`,
      String(Number(sessionStorage.getItem(`attempt_${this.currentLevel.levelId}`) ?? 0) + 1)
    );
    window.clearInterval(this.timerHandle);
    this.lastTick = performance.now();
    this.timerHandle = window.setInterval(() => this.tick(), 250);
    this.root.querySelector("#timer")?.classList.remove("urgent");
    this.updateHud();
  }

  private applyTutorialHint(levelNumber: number): void {
    if (this.state.moves > 0 || levelNumber > 10) return;
    const shouldHint =
      levelNumber <= 2 ||
      (levelNumber >= 4 && levelNumber <= 5 && this.state.compartments.some((compartment) => compartment.type === "reserve")) ||
      (levelNumber >= 7 && this.state.compartments.some((compartment) => compartment.hiddenLayers.length > 0));
    if (!shouldHint) return;
    this.activeHint = findHint(this.state) ?? null;
    this.boardView.setHint(this.activeHint);
  }

  private async handleMove(move: LegalMove): Promise<void> {
    if (this.isAnimating || this.boardView.isAnimating()) return;
    const sourceCell = this.state.compartments
      .find((compartment) => compartment.id === move.sourceCompartmentId)
      ?.front.find((cell) => cell.cellIndex === move.sourceCellIndex);
    const before = cloneBoardState(this.state);
    const pairCreated = createsPair(this.state, move);
    const result = applyMoveAndResolve(this.state, { ...move, timestamp: Date.now() });
    this.isAnimating = true;
    this.feedback("move");
    this.analytics.track("level_move", {
      levelId: this.state.levelId,
      moveIndex: this.state.moves,
      source: `${move.sourceCompartmentId}:${move.sourceCellIndex}`,
      target: `${move.targetCompartmentId}:${move.targetCellIndex}`,
      sku: sourceCell?.product?.skuId ?? "unknown",
      category: sourceCell?.product?.category ?? "unknown",
      createsPair: pairCreated,
      createsTriple: result.clearedTriples.length > 0,
      moveQuality: result.moveQuality ?? "neutral"
    });
    const animationDurationMs = await this.boardView.playResolution(before, this.state, result, move);
    if (result.clearedTriples.length > 0) {
      const fpsBucket = animationDurationMs > 900 ? "slow" : "smooth";
      this.analytics.track("clear_animation_seen", {
        levelId: this.state.levelId,
        durationMs: Math.round(animationDurationMs),
        fpsBucket
      });
      this.analytics.track("clear_animation_fps_bucket", {
        levelId: this.state.levelId,
        fpsBucket,
        durationMs: Math.round(animationDurationMs)
      });
      if (!this.firstClearTracked) {
        this.firstClearTracked = true;
        const elapsedMs = Math.round(performance.now() - this.levelStartedAtMs);
        this.analytics.track("first_clear_time_ms", {
          levelId: this.state.levelId,
          elapsedMs
        });
        this.analytics.track("first_clear_seconds", {
          levelId: this.state.levelId,
          seconds: Number((elapsedMs / 1000).toFixed(2))
        });
      }
    }
    this.isAnimating = false;
    this.afterResolution(result, false);
  }

  private afterResolution(result: ResolutionResult, renderBoard = true): void {
    this.activeHint = null;
    this.boardView.setHint(null);
    for (const clear of result.clearedTriples) {
      this.analytics.track("triple_clear", {
        levelId: this.state.levelId,
        sku: clear.skuId,
        combo: clear.combo,
        timeRemaining: Math.round(this.state.timer.remainingSec),
        compartment: clear.compartmentId
      });
      if ([3, 5, 8, 10].includes(clear.combo)) {
        this.economy.grant(`combo_${this.state.levelId}_${this.state.moves}_${clear.combo}`, { coins: clear.combo * 2 }, "combo");
      }
      this.addCollectionCard(clear.skuId);
    }
    for (const reveal of result.revealedLayers) {
      this.analytics.track("hidden_layer_reveal", {
        levelId: this.state.levelId,
        compartmentId: reveal.compartmentId,
        hiddenDepthBefore: reveal.hiddenDepthBefore,
        hiddenDepthAfter: reveal.hiddenDepthAfter
      });
    }
    if (renderBoard) this.boardView.renderBoard(this.state);
    this.updateHud();
    if (this.state.levelEnd === "win") this.completeLevel();
    if (this.state.levelEnd === "loss_timeout" || this.state.levelEnd === "loss_stalemate") this.loseLevel(this.state.levelEnd);
  }

  private tick(): void {
    const now = performance.now();
    const delta = (now - this.lastTick) / 1000;
    this.lastTick = now;
    const before = this.state.levelEnd;
    tickTimer(this.state, delta, Date.now());
    if (this.state.timer.remainingSec / this.state.timer.totalSec <= 0.2 && this.state.timer.remainingSec > 0) {
      this.root.querySelector("#timer")?.classList.add("urgent");
      if (!this.timerWarningPlayed) {
        this.timerWarningPlayed = true;
        this.feedback("warning");
      }
    }
    if (!before && this.state.levelEnd === "loss_timeout") this.loseLevel("loss_timeout");
    this.updateHud();
  }

  private completeLevel(): void {
    window.clearInterval(this.timerHandle);
    const levelNumber = Number(this.currentLevel.levelId.split("_")[1]);
    const stars = calculateStars(this.state);
    const coins =
      Math.round((this.currentLevel.rewards.baseCoins + Math.min(this.state.combo.max * 2, 30)) * this.content.remote.economy.winCoinsMultiplier) +
      (sessionStorage.getItem(`won_${this.currentLevel.levelId}`) ? 0 : this.currentLevel.rewards.firstTryBonusCoins);
    this.save.progress.highestLevelCompleted = Math.max(this.save.progress.highestLevelCompleted, levelNumber);
    this.save.progress.winStreak += 1;
    this.save.progress.xp += 25 + levelNumber;
    this.economy.grant(
      `level_win_${this.currentLevel.levelId}_${stars}`,
      { coins, stars, passXp: this.currentLevel.rewards.passXp },
      "level_win"
    );
    if (this.save.progress.winStreak > 0 && this.save.progress.winStreak % 3 === 0) {
      this.economy.grant(`streak_${this.currentLevel.levelId}_${this.save.progress.winStreak}`, { coins: 75, shuffle: 1 }, "win_streak_chest");
    }
    sessionStorage.setItem(`won_${this.currentLevel.levelId}`, "1");
    this.persistSave(this.save);
    this.feedback("win");
    this.analytics.track("level_complete", {
      levelId: this.currentLevel.levelId,
      duration: this.currentLevel.timerSec - this.state.timer.remainingSec,
      moves: this.state.moves,
      remainingTime: this.state.timer.remainingSec,
      boostersUsed: this.state.boostersUsed.length,
      hiddenRevealCount: this.state.hiddenReveals,
      moveToClearRatio: resultRatio(this.state.moves, this.state.objective.clearedProducts / 3),
      move_to_clear_ratio: resultRatio(this.state.moves, this.state.objective.clearedProducts / 3),
      invalidMoveRate: resultRatio(this.invalidMoveCount, Math.max(1, this.state.moves + this.invalidMoveCount)),
      invalid_move_rate: resultRatio(this.invalidMoveCount, Math.max(1, this.state.moves + this.invalidMoveCount)),
      firstSessionLevelReached: levelNumber
    });
    this.analytics.track("move_to_clear_ratio", {
      levelId: this.currentLevel.levelId,
      ratio: resultRatio(this.state.moves, this.state.objective.clearedProducts / 3)
    });
    this.analytics.track("invalid_move_rate", {
      levelId: this.currentLevel.levelId,
      rate: resultRatio(this.invalidMoveCount, Math.max(1, this.state.moves + this.invalidMoveCount))
    });
    this.analytics.track("first_session_level_reached", {
      levelNumber
    });
    if (levelNumber <= 5) {
      this.analytics.track("level_1_to_5_completion_rate", {
        levelNumber,
        completed: true
      });
    }
    this.openRewardDrawer(coins, stars);
  }

  private loseLevel(reason: string): void {
    window.clearInterval(this.timerHandle);
    this.save.progress.winStreak = 0;
    this.persistSave(this.save);
    this.feedback("loss");
    const failReason = this.state.failReason ?? normalizeFailReason(reason);
    this.analytics.track("level_fail", {
      levelId: this.currentLevel.levelId,
      failReason,
      levelEnd: reason,
      duration: this.currentLevel.timerSec - this.state.timer.remainingSec,
      moves: this.state.moves,
      remainingTime: this.state.timer.remainingSec,
      boostersUsed: this.state.boostersUsed.length,
      hiddenRevealCount: this.state.hiddenReveals
    });
    this.analytics.track("loss_reason_distribution", {
      levelId: this.currentLevel.levelId,
      failReason
    });
    this.openLosePanel(failReason);
  }

  private async useBooster(boosterId: BoosterId): Promise<void> {
    if (this.isAnimating || this.boardView.isAnimating()) return;
    const command = createBooster(boosterId);
    const context = {
      nowMs: Date.now(),
      selected: this.selected ?? undefined,
      seed: this.state.seed + this.state.moves * 31
    };
    const executable = command.canExecute(this.state, context);
    this.analytics.track("booster_offer", {
      boosterId,
      levelId: this.currentLevel.levelId,
      executable,
      inventory: this.save.boosters[boosterId],
      coinFallbackCost: this.content.economy.boosterCosts[boosterId].coins
    });
    const promptedByFailReason = this.state.levelEnd ? this.state.failReason ?? normalizeFailReason(this.state.levelEnd) : null;
    if (boosterId === "hint" && this.invalidMoveCount > 0) {
      this.analytics.track("hint_after_invalid_rate", {
        levelId: this.currentLevel.levelId,
        invalidMoveCount: this.invalidMoveCount,
        moves: this.state.moves
      });
    }
    if (!executable) {
      this.toast(boosterId === "hammer" ? "Select a visible product first." : "That booster is not available now.");
      return;
    }
    if (!this.economy.spendBooster(boosterId, `level:${this.currentLevel.levelId}`)) {
      this.toast("Not enough boosters or coins.");
      this.openPanel("shop");
      return;
    }
    if (promptedByFailReason) {
      this.analytics.track("booster_prompt_accept_rate", {
        boosterId,
        levelId: this.currentLevel.levelId,
        failReason: promptedByFailReason,
        accepted: true
      });
    }
    this.isAnimating = true;
    if (this.state.levelEnd && boosterId !== "hint") {
      this.state.levelEnd = null;
      this.state.failReason = null;
      if (this.state.timer.remainingSec <= 0) this.state.timer.remainingSec = 45;
      this.state.timer.running = true;
    }
    const result = command.execute(this.state, context);
    await this.boardView.playBoosterEffect(boosterId);
    this.analytics.track("booster_use", {
      boosterId,
      source: "inventory_or_coins",
      levelId: this.currentLevel.levelId,
      timeRemaining: this.state.timer.remainingSec,
      ...command.analyticsPayload(context)
    });
    if (boosterId === "hint" && result.hint) {
      this.activeHint = result.hint;
      this.boardView.setHint(result.hint);
      this.toast(command.preview(this.state, context));
    } else {
      this.afterResolution(
        result.resolution ?? {
          movedProducts: [],
          clearedTriples: [],
          clearedProducts: [],
          revealedLayers: [],
          objectiveUpdates: [],
          comboChanged: false,
          scoreDelta: 0,
          levelEnd: this.state.levelEnd
        }
      );
    }
    this.isAnimating = false;
    if (!this.state.levelEnd) this.closeModal();
  }

  private invalidMove(reason: string): void {
    this.invalidMoveCount += 1;
    this.feedback("invalid");
    void this.boardView.playInvalid(reason);
    this.analytics.track("invalid_move", {
      reason,
      levelId: this.currentLevel.levelId,
      selected: this.selected
    });
    this.analytics.track("tap_miss_rate", {
      levelId: this.currentLevel.levelId,
      rate: resultRatio(this.invalidMoveCount, Math.max(1, this.state.moves + this.invalidMoveCount)),
      reason
    });
    this.analytics.track("invalid_reason_shown", {
      levelId: this.currentLevel.levelId,
      reason,
      invalidMoveCount: this.invalidMoveCount
    });
    this.toast(invalidMoveCopy(reason));
  }

  private dragCancel(): void {
    this.dragCancelCount += 1;
    this.analytics.track("drag_cancel_rate", {
      levelId: this.currentLevel.levelId,
      rate: resultRatio(this.dragCancelCount, Math.max(1, this.state.moves + this.invalidMoveCount + this.dragCancelCount))
    });
  }

  private applyTheme(): void {
    const theme = this.content.themes.find((candidate) => candidate.id === this.currentLevel.chapterId) ?? this.content.themes[0];
    const game = this.root.querySelector<HTMLElement>(".game");
    if (!game || !theme) return;
    game.style.setProperty("--theme-wall", theme.wallColor);
    game.style.setProperty("--theme-accent", theme.accentColor);
    game.style.setProperty("--theme-shelf", theme.shelfColor);
    game.dataset.theme = theme.id;
  }

  private updateHud(): void {
    this.root.querySelector("#levelLabel")!.textContent = `Level ${Number(this.currentLevel.levelId.split("_")[1])}`;
    this.root.querySelector("#tierLabel")!.textContent = labelTier(this.currentLevel.difficultyTier);
    this.root.querySelector("#timer")!.textContent = formatTime(this.state.timer.remainingSec);
    this.root.querySelector("#coinLabel")!.textContent = String(this.save.wallet.coins);
    this.root.querySelector("#starLabel")!.textContent = String(this.save.progress.stars);
    const combo = this.root.querySelector("#combo")!;
    combo.textContent = `x${Math.max(1, this.state.combo.value)} Combo`;
    combo.classList.toggle("hidden", this.state.combo.value <= 1);
    for (const booster of Object.keys(this.save.boosters) as BoosterId[]) {
      const count = this.save.boosters[booster];
      const button = this.root.querySelector<HTMLButtonElement>(`[data-booster="${booster}"]`);
      const cost = this.content.economy.boosterCosts[booster].coins;
      const soldOut = count <= 0 && this.save.wallet.coins < cost;
      this.root.querySelector(`#boost_${booster}`)!.textContent = String(count);
      button?.classList.toggle("sold-out", soldOut);
      button?.classList.toggle("recommended", (booster === "hint" && this.invalidMoveCount > 0) || (booster === "shuffle" && this.invalidMoveCount >= 3));
      button?.setAttribute("aria-label", `${title(booster)} booster, ${count} available`);
    }
    this.root.querySelector("#objectiveRow")!.innerHTML = rewriteAppUrls(this.renderObjective());
    this.root.querySelector("#banner")!.classList.toggle("hidden", !this.ads.shouldShowBanner());
  }

  private renderObjective(): string {
    const dailyOrder = this.renderDailyOrderCard();
    if (this.state.objective.type === "clear_all" || this.state.objective.type === "time_challenge") {
      const remaining = this.state.objective.totalProducts - this.state.objective.clearedProducts;
      const timeChip =
        this.state.objective.type === "time_challenge"
          ? `<button class="objective-chip objective-button" data-action="objective_info">Beat ${formatTime(this.state.objective.timeLimitSec ?? this.state.timer.totalSec)}</button>`
          : "";
      return `${dailyOrder}<button class="objective-chip objective-button" data-action="objective_info">Clear all goods · ${Math.max(0, remaining)} left</button>${timeChip}`;
    }
    if (this.state.objective.type === "combo_target") {
      return `${dailyOrder}<button class="objective-chip objective-button" data-action="objective_info">Combo ${this.state.combo.max}/${this.state.objective.targetCombo} · Clear all goods</button>`;
    }
    return `${dailyOrder}${this.state.objective.targets
      .map((target) => {
        const label = target.label ?? target.skuId ?? target.category ?? target.flag ?? "Target";
        return `<button class="objective-chip objective-button" data-action="objective_info">${title(label)}: ${target.cleared}/${target.count}</button>`;
      })
      .join("")}`;
  }

  private renderDailyOrderCard(): string {
    const clearedTriples = Math.min(3, Math.floor(this.state.objective.clearedProducts / 3));
    return `<button class="objective-chip objective-button daily-order-card" data-action="daily">
      <span>Daily order</span>
      <strong>${clearedTriples}/3 parcel</strong>
      <i style="width:${Math.round((clearedTriples / 3) * 100)}%"></i>
    </button>`;
  }

  private openRewardDrawer(coins: number, stars: number): void {
    const completed = this.save.progress.highestLevelCompleted;
    const next = Math.min(this.content.launchLevels.length, completed + 1);
    const adReady = this.content.remote.economy.rewardedDoubleEnabled;
    const collectionProgress = this.collectionProgressLabel();
    const eventProgress = `${Math.min(5, this.save.progress.winStreak)}/5`;
    const streakChestReady = this.save.progress.winStreak > 0 && this.save.progress.winStreak % 3 === 0;
    const consentCta = this.save.settings.consentGranted
      ? ""
      : `<button class="drawer-secondary" data-action="consent_panel">Allow tuning telemetry</button>`;
    const overlay = this.root.querySelector<HTMLElement>("#rewardOverlay")!;
    const albumReveal = this.lastCollectedCardLabel();
    this.drawerOpenedAtMs = performance.now();
    this.analytics.track("win_drawer_opened", {
      levelId: this.currentLevel.levelId,
      stars,
      coins,
      streak: this.save.progress.winStreak
    });
    if (adReady) {
      this.analytics.track("rewarded_double_impression_after_drawer", {
        levelId: this.currentLevel.levelId,
        coins
      });
    }
    if (streakChestReady) {
      this.analytics.track("streak_chest_ceremony", {
        levelId: this.currentLevel.levelId,
        streak: this.save.progress.winStreak
      });
    }
    window.clearTimeout(this.drawerReadyTimer);
    overlay.innerHTML = rewriteAppUrls(`
      <div class="reward-scrim" data-action="drawer_skip"></div>
      <div class="reward-drawer" role="dialog" aria-modal="true" aria-label="Puzzle complete rewards" data-action="drawer_skip">
        <div class="drawer-handle" aria-hidden="true"></div>
        <div class="drawer-title-row">
          <span class="drawer-stamp">Sorted</span>
          <h2>Puzzle Complete!</h2>
        </div>
        <div class="drawer-stars" aria-label="${stars} stars earned">
          ${[1, 2, 3].map((slot) => `<span class="drawer-star ${slot <= stars ? "earned" : ""}" style="--i:${slot}"><img src="/assets/ui/star.svg" alt=""></span>`).join("")}
        </div>
        <div class="drawer-reward-bin">
          <div class="drawer-reward coin-count"><img src="/assets/ui/coin.svg" alt=""><strong>${coins}</strong><small>coins</small></div>
          <div class="drawer-reward"><img src="/assets/ui/streak.svg" alt=""><strong>${this.save.progress.winStreak}</strong><small>streak</small></div>
          <div class="drawer-reward"><img src="/assets/ui/album.svg" alt=""><strong>${collectionProgress}</strong><small>album</small></div>
        </div>
        <div class="drawer-progress-grid">
          <div class="drawer-progress"><span>Daily order</span><strong>${eventProgress}</strong><i style="width:${Math.min(100, this.save.progress.winStreak * 20)}%"></i></div>
          <div class="drawer-progress"><span>Pass XP</span><strong>${this.save.progress.passXp}</strong><i style="width:${Math.min(100, this.save.progress.passXp % 100)}%"></i></div>
          <div class="drawer-progress"><span>${albumReveal}</span><strong>New</strong><i style="width:100%"></i></div>
        </div>
        <div class="drawer-chest ${streakChestReady ? "unlocked" : ""}">
          <img src="/assets/ui/shop.svg" alt="">
          <span>Streak chest ready</span>
        </div>
        <div class="drawer-actions">
          ${adReady ? `<button class="drawer-bonus" data-action="double_reward"><img src="/assets/ui/coin.svg" alt="">Double coins</button>` : ""}
          <button class="drawer-next" data-action="next" disabled>Next Level ${next}</button>
        </div>
        <div class="drawer-secondary-row">
          <button class="drawer-secondary" data-action="collections"><img src="/assets/ui/album.svg" alt="">Album</button>
          <button class="drawer-secondary" data-action="events"><img src="/assets/ui/event.svg" alt="">Events</button>
          <button class="drawer-secondary" data-action="map"><img src="/assets/ui/map.svg" alt="">Map</button>
          ${consentCta}
        </div>
      </div>
    `);
    overlay.classList.remove("hidden", "drawer-ready");
    overlay.classList.add("drawer-opening");
    this.feedback("drawer");
    this.rewardBeatTimers.forEach((timer) => window.clearTimeout(timer));
    this.rewardBeatTimers = [];
    const timingScale = this.save.settings.reduceMotion ? 0.2 : 1;
    for (let slot = 1; slot <= stars; slot += 1) {
      this.rewardBeatTimers.push(
        window.setTimeout(() => {
          if (!overlay.classList.contains("hidden")) this.feedback("star");
        }, (1050 + slot * 220) * timingScale)
      );
    }
    this.rewardBeatTimers.push(
      window.setTimeout(() => {
        if (!overlay.classList.contains("hidden")) this.feedback("coin");
      }, 1900 * timingScale)
    );
    if (streakChestReady) {
      this.rewardBeatTimers.push(
        window.setTimeout(() => {
          if (!overlay.classList.contains("hidden")) this.feedback("win");
        }, 2250 * timingScale)
      );
    }
    this.drawerReadyTimer = window.setTimeout(() => this.skipRewardDrawer(false), this.save.settings.reduceMotion ? 420 : 2100);
  }

  private openLosePanel(reason: FailReason): void {
    const rescue = rescueForFailReason(reason, this.remainingObjectiveLabel());
    this.analytics.track("level_revive_offer", {
      levelId: this.currentLevel.levelId,
      failReason: reason,
      offers: rescue.offerIds
    });
    this.analytics.track("booster_prompt_from_fail_reason", {
      levelId: this.currentLevel.levelId,
      failReason: reason,
      offers: rescue.offerIds
    });
    this.openModal(`
      <div class="panel">
        <h2>${rescue.title}</h2>
        <div class="rescue-card rescue-${reason ?? "unknown"}">
          <span class="rescue-icon">${rescue.icon}</span>
          <p class="panel-copy">${rescue.copy}</p>
          <strong>${this.remainingObjectiveLabel()}</strong>
        </div>
        <div class="button-row">${rescue.buttons}</div>
        <div class="button-row subtle-row">
          <button data-action="retry">Retry</button>
        </div>
      </div>
    `);
  }

  private async reviveWithAd(): Promise<void> {
    const ok = await this.ads.showRewarded("revive_plus_45", "loss_panel", { addSeconds: 45 });
    if (!ok) return;
    this.analytics.track("level_revive_accept", {
      levelId: this.currentLevel.levelId,
      failReason: this.state.failReason,
      method: "rewarded_ad"
    });
    this.state.timer.remainingSec = Math.max(this.state.timer.remainingSec, 45);
    this.state.levelEnd = null;
    this.state.failReason = null;
    this.state.timer.running = true;
    this.closeModal();
    this.updateHud();
  }

  private reviveWithCoins(): void {
    if (!this.economy.spendCoins(300, "coins_plus_45_sec", "revive")) {
      this.toast("Not enough coins.");
      return;
    }
    const failReason = this.state.failReason;
    this.state.timer.remainingSec = 45;
    this.state.levelEnd = null;
    this.state.failReason = null;
    this.state.timer.running = true;
    this.analytics.track("level_revive_accept", {
      levelId: this.currentLevel.levelId,
      failReason,
      method: "coins"
    });
    this.closeModal();
    this.updateHud();
  }

  private async doubleReward(): Promise<void> {
    const ok = await this.ads.showRewarded("double_win_reward", "win_panel", { multiplier: 2 });
    if (!ok) return;
    this.analytics.track("rewarded_double_accept_after_drawer", {
      levelId: this.currentLevel.levelId
    });
    this.economy.grant(`double_${this.currentLevel.levelId}_${Date.now()}`, { coins: this.currentLevel.rewards.baseCoins }, "rewarded_ad");
    this.updateHud();
    const coinCount = this.root.querySelector<HTMLElement>(".coin-count strong");
    if (coinCount) coinCount.textContent = String(Number(coinCount.textContent ?? 0) + this.currentLevel.rewards.baseCoins);
    this.feedback("coin");
    this.toast("Coins doubled.");
  }

  private openPanel(panel: string): void {
    if (panel === "pause") {
      window.clearInterval(this.timerHandle);
      this.openModal(`
        <div class="panel">
          <h2>Paused</h2>
          <div class="button-row">
            <button class="primary" data-action="close">Resume</button>
            <button data-action="settings">Settings</button>
            <button data-action="privacy">Privacy</button>
          </div>
        </div>
      `);
    }
    if (panel === "shop") this.openShop();
    if (panel === "map") this.openMap();
    if (panel === "settings") this.openSettings();
    if (panel === "events") this.openEvents();
    if (panel === "collections") this.openCollections();
    if (panel === "privacy") this.openPrivacy();
    if (panel === "consent") this.openConsent();
  }

  private openShop(): void {
    this.analytics.track("iap_offer_view", {
      productIds: this.content.economy.iapProducts.map((product) => product.id),
      placement: "shop"
    });
    const products = this.content.economy.iapProducts
      .map(
        (product) => `
          <button class="shop-item" data-action="buy:${product.id}">
            <span class="value-ribbon">${product.kind}</span>
            <img class="shop-pack-icon" src="/assets/ui/shop.svg" alt="">
            <strong>${title(product.id)}</strong>
            <span>${product.price}</span>
          </button>
        `
      )
      .join("");
    this.openModal(`
      <div class="panel wide">
        <h2>Shop</h2>
        <div class="shop-grid">${products}</div>
        <button data-action="close">Close</button>
      </div>
    `);
  }

  private openMap(): void {
    const levels = [1, 5, 10, 15, 20, 25, 30]
      .map((level, index) => {
        const locked = level > this.save.progress.highestLevelCompleted + 1;
        const hard = this.content.launchLevels[level - 1]?.difficultyTier === "hard";
        return `<button class="map-node ${hard ? "hard-node" : ""}" data-action="jump:${level}" style="--i:${index}" ${locked ? "disabled" : ""}>
          <span>${level}</span>
          ${hard ? `<small>Hard</small>` : ""}
        </button>`;
      })
      .join("");
    this.openModal(`
      <div class="panel wide">
        <h2>Chapter Map</h2>
        <p class="panel-copy">${this.content.launchLevels.length} handcrafted vertical-slice levels, ${this.content.backlogLevels.length} backlog levels, ${this.content.themes.length} shelf themes.</p>
        <div class="map-path">${levels}</div>
        <div class="button-row subtle-row">
          <button data-action="daily"><img class="icon-img" src="/assets/ui/coin.svg" alt="">Daily reward</button>
          <button data-action="events"><img class="icon-img" src="/assets/ui/event.svg" alt="">Events</button>
          <button data-action="collections"><img class="icon-img" src="/assets/ui/album.svg" alt="">Album</button>
          <button data-action="shop"><img class="icon-img" src="/assets/ui/shop.svg" alt="">Shop</button>
          <button data-action="settings"><img class="icon-img" src="/assets/ui/timer.svg" alt="">Settings</button>
        </div>
        <button data-action="close">Close</button>
      </div>
    `);
  }

  private openSettings(): void {
    this.openModal(`
      <div class="panel">
        <h2>Settings</h2>
        <div class="setting-line"><span>Input</span><button data-action="input">${this.save.settings.inputMode}</button></div>
        <div class="setting-line"><span>Relax timer</span><button data-action="relax">${this.save.settings.relaxModePreferred ? "On" : "Off"}</button></div>
        <div class="setting-line"><span>Reduce motion</span><button data-action="motion">${this.save.settings.reduceMotion ? "On" : "Off"}</button></div>
        <div class="setting-line"><span>SFX</span><button data-action="sfx">${this.save.settings.sfx ? "On" : "Off"}</button></div>
        <div class="setting-line"><span>Haptics</span><button data-action="haptics">${this.save.settings.haptics ? "On" : "Off"}</button></div>
        <div class="setting-line"><span>Music</span><button data-action="music">${this.save.settings.music ? "On" : "Off"}</button></div>
        <div class="setting-line"><span>Telemetry</span><button data-action="consent_panel">${this.save.settings.consentGranted ? "On" : "Off"}</button></div>
        <button class="primary" data-action="close">Done</button>
      </div>
    `);
  }

  private openEvents(): void {
    const eventRows = this.content.events
      .map((event) => `<div class="event-row">
        <img class="event-icon" src="/assets/ui/event.svg" alt="">
        <strong>${event.name}</strong>
        <span>${event.durationHours}h</span>
        <small>${event.mechanic}</small>
        <em>${event.reward}</em>
      </div>`)
      .join("");
    this.openModal(`
      <div class="panel wide">
        <h2>Events</h2>
        ${eventRows}
        <button data-action="close">Close</button>
      </div>
    `);
  }

  private openCollections(): void {
    const categories = [...new Set(this.content.catalog.products.map((product) => product.category))];
    const pages = categories
      .map((category) => {
        const collected = this.save.collections[category]?.length ?? 0;
        const total = this.content.catalog.products.filter((product) => product.category === category).length;
        const progress = Math.round((collected / Math.max(1, total)) * 100);
        return `<div class="album-page">
          <img class="album-icon" src="/assets/ui/album.svg" alt="">
          <strong>${title(category)}</strong>
          <span>${collected}/${total}</span>
          <i style="width:${progress}%"></i>
        </div>`;
      })
      .join("");
    this.openModal(`
      <div class="panel wide">
        <h2>Collection Album</h2>
        <div class="album-grid">${pages}</div>
        <button data-action="close">Close</button>
      </div>
    `);
  }

  private openPrivacy(): void {
    this.openModal(`
      <div class="panel wide">
        <h2>Privacy</h2>
        <p class="panel-copy">This local build stores gameplay progress, sandbox purchases, settings, and anonymous telemetry in browser storage. It does not collect personal data or send data to external services.</p>
        <p class="panel-copy">Production mobile builds must add regional consent, data deletion, platform privacy labels, compliant ad SDK settings, and server-side IAP validation before store submission.</p>
        <div class="button-row">${this.save.settings.consentGranted ? "" : `<button class="primary" data-action="consent_accept">Allow anonymous analytics</button>`}</div>
        <button data-action="close">Close</button>
      </div>
    `);
  }

  private openConsent(): void {
    this.openModal(`
      <div class="panel">
        <h2>Consent</h2>
        <p class="panel-copy">Allow anonymous gameplay analytics for level tuning, economy balancing, and crash diagnostics in this local build.</p>
        <div class="button-row">
          <button class="primary" data-action="consent_accept">Allow</button>
          <button data-action="privacy">Details</button>
        </div>
      </div>
    `);
  }

  private claimDailyReward(): void {
    const day = new Date().toISOString().slice(0, 10);
    const tx = `daily_${day}`;
    const claimed = this.economy.grant(tx, { coins: 100, hint: 1, passXp: 15 }, "daily_reward");
    this.toast(claimed ? "Daily reward claimed." : "Daily reward already claimed.");
    this.updateHud();
  }

  private buyProduct(productId: string): void {
    if (this.economy.buyMockProduct(productId)) {
      if (productId === "starter_pack") this.save.purchases.starterPackPurchased = true;
      this.persistSave(this.save);
      this.updateHud();
      this.toast("Sandbox purchase validated.");
    }
  }

  private acceptConsent(): void {
    this.save.settings.consentGranted = true;
    this.persistSave(this.save);
    this.analytics.track("consent_update", { consent: true });
    this.analytics.track("app_open", { consentState: true, source: "consent_accept" });
    this.closeModal();
  }

  private toggleRelax(): void {
    this.save.settings.relaxModePreferred = !this.save.settings.relaxModePreferred;
    this.persistSave(this.save);
    this.analytics.track("settings_change", { setting: "relaxModePreferred", value: this.save.settings.relaxModePreferred });
    this.closeModal();
    this.startLevel(Number(this.currentLevel.levelId.split("_")[1]));
  }

  private toggleInputMode(): void {
    this.save.settings.inputMode =
      this.save.settings.inputMode === "tap_and_drag" ? "tap" : this.save.settings.inputMode === "tap" ? "drag" : "tap_and_drag";
    this.persistSave(this.save);
    this.boardView.setInputMode(this.save.settings.inputMode);
    this.analytics.track("settings_change", { setting: "inputMode", value: this.save.settings.inputMode });
    this.openSettings();
  }

  private toggleReduceMotion(): void {
    this.save.settings.reduceMotion = !this.save.settings.reduceMotion;
    this.persistSave(this.save);
    this.boardView.setReduceMotion(this.save.settings.reduceMotion);
    this.analytics.track("settings_change", { setting: "reduceMotion", value: this.save.settings.reduceMotion });
    if (this.save.settings.reduceMotion) {
      this.analytics.track("settings_reduce_motion_enabled", {
        levelId: this.currentLevel.levelId
      });
    }
    this.openSettings();
  }

  private toggleSfx(): void {
    this.save.settings.sfx = !this.save.settings.sfx;
    this.persistSave(this.save);
    this.analytics.track("settings_change", { setting: "sfx", value: this.save.settings.sfx });
    this.openSettings();
  }

  private toggleHaptics(): void {
    this.save.settings.haptics = !this.save.settings.haptics;
    this.persistSave(this.save);
    this.analytics.track("settings_change", { setting: "haptics", value: this.save.settings.haptics });
    this.openSettings();
  }

  private toggleMusic(): void {
    this.save.settings.music = !this.save.settings.music;
    this.persistSave(this.save);
    this.analytics.track("settings_change", { setting: "music", value: this.save.settings.music });
    this.openSettings();
  }

  private addCollectionCard(skuId: string): void {
    const product = this.catalogBySku.get(skuId);
    if (!product) return;
    const category = product.category;
    const cards = new Set(this.save.collections[category] ?? []);
    const wasNew = !cards.has(skuId);
    cards.add(skuId);
    this.save.collections[category] = [...cards];
    if (wasNew) {
      this.analytics.track("collection_card_drop", {
        skuId,
        category,
        source: "triple_clear",
        collected: cards.size,
        categoryTotal: this.content.catalog.products.filter((candidate) => candidate.category === category).length
      });
      this.analytics.track("event_progress", { eventId: "collection_album", points: 1, source: skuId });
    }
  }

  private skipRewardDrawer(userInitiated: boolean): void {
    const overlay = this.root.querySelector<HTMLElement>("#rewardOverlay");
    if (!overlay || overlay.classList.contains("hidden") || overlay.classList.contains("drawer-ready")) return;
    overlay.classList.add("drawer-ready");
    overlay.classList.remove("drawer-opening");
    overlay.querySelector<HTMLButtonElement>(".drawer-next")?.removeAttribute("disabled");
    this.haptics.pulse("drawer_skip");
    if (userInitiated) {
      this.analytics.track("animation_skip_rate", {
        levelId: this.currentLevel.levelId,
        surface: "win_drawer",
        elapsedMs: Math.round(performance.now() - this.drawerOpenedAtMs)
      });
    }
  }

  private closeRewardDrawer(): void {
    window.clearTimeout(this.drawerReadyTimer);
    this.rewardBeatTimers.forEach((timer) => window.clearTimeout(timer));
    this.rewardBeatTimers = [];
    const overlay = this.root.querySelector<HTMLElement>("#rewardOverlay");
    if (!overlay) return;
    if (!overlay.classList.contains("hidden") && this.drawerOpenedAtMs) {
      this.analytics.track("drawer_dwell_seconds", {
        levelId: this.currentLevel.levelId,
        seconds: Number(((performance.now() - this.drawerOpenedAtMs) / 1000).toFixed(2)),
        ready: overlay.classList.contains("drawer-ready")
      });
      this.drawerOpenedAtMs = 0;
    }
    overlay.classList.add("hidden");
    overlay.classList.remove("drawer-ready", "drawer-opening");
    overlay.innerHTML = "";
  }

  private lastCollectedCardLabel(): string {
    const collected = Object.entries(this.save.collections)
      .flatMap(([category, cards]) => cards.map((skuId) => ({ category, skuId })))
      .at(-1);
    if (!collected) return "Album card";
    return `${title(collected.category)} card`;
  }

  private openModal(html: string): void {
    window.clearInterval(this.timerHandle);
    const modal = this.root.querySelector<HTMLDialogElement>("#modal")!;
    this.root.querySelector("#modalContent")!.innerHTML = rewriteAppUrls(html);
    if (!modal.open) modal.showModal();
  }

  private closeModal(): void {
    const modal = this.root.querySelector<HTMLDialogElement>("#modal")!;
    if (modal.open) modal.close();
    if (!this.state.levelEnd) {
      this.lastTick = performance.now();
      window.clearInterval(this.timerHandle);
      this.timerHandle = window.setInterval(() => this.tick(), 250);
    }
  }

  private toast(message: string): void {
    const toast = this.root.querySelector("#toast")!;
    toast.textContent = message;
    toast.classList.remove("hidden");
    window.setTimeout(() => toast.classList.add("hidden"), 1800);
  }

  private collectionProgressLabel(): string {
    const collected = new Set(Object.values(this.save.collections).flat()).size;
    return `${collected}/${this.content.catalog.products.length}`;
  }

  private remainingObjectiveLabel(): string {
    if (this.state.objective.targets.length === 0) {
      const remaining = Math.max(0, this.state.objective.totalProducts - this.state.objective.clearedProducts);
      return `${remaining} goods`;
    }
    return this.state.objective.targets
      .filter((target) => target.cleared < target.count)
      .map((target) => `${target.count - target.cleared} ${target.label ?? target.skuId ?? target.category ?? target.flag ?? "targets"}`)
      .join(", ");
  }

  private feedback(kind: SoundCue): void {
    this.audio.play(kind, kind === "combo" || kind === "win" ? 1.35 : 1);
    this.haptics.pulse(kind);
  }

  private installLocalTestHooks(): void {
    if (!["127.0.0.1", "localhost"].includes(window.location.hostname)) return;
    window.__SHELF_SORT_TEST__ = {
      move: (moveToApply) => this.handleMove(moveToApply),
      state: () => structuredClone(this.state) as BoardState,
      analytics: () => this.analytics.all(),
      isAnimating: () => this.isAnimating || this.boardView.isAnimating(),
      setReduceMotion: (enabled) => {
        this.save.settings.reduceMotion = enabled;
        this.boardView.setReduceMotion(enabled);
        this.persistSave(this.save);
      },
      forceLoss: (reason = "timeout") => {
        this.closeRewardDrawer();
        this.state.levelEnd = reason === "board_jammed" ? "loss_stalemate" : "loss_timeout";
        this.state.failReason = reason;
        if (reason === "timeout") this.state.timer.remainingSec = 0;
        this.loseLevel(this.state.levelEnd);
      },
      select: (selection) => this.boardView.setSelected(selection),
      setInputMode: (inputMode) => {
        this.save.settings.inputMode = inputMode;
        this.boardView.setInputMode(inputMode);
        this.persistSave(this.save);
      },
      cellPoint: (compartmentId, cellIndex) => this.boardView.debugCellPoint(compartmentId, cellIndex),
      setConsent: (enabled) => {
        this.save.settings.consentGranted = enabled;
        this.persistSave(this.save);
      }
    };
  }

  private persistSave(save: PlayerSave): void {
    this.save = save;
    this.saveService.save(save);
    this.saveService.syncCloud(save);
  }
}

function normalizeFailReason(reason: string): FailReason {
  if (reason === "loss_timeout") return "timeout";
  if (reason === "loss_stalemate") return "board_jammed";
  return "board_jammed";
}

function cloneBoardState(state: BoardState): BoardState {
  return structuredClone(state) as BoardState;
}

function resultRatio(numerator: number, denominator: number): number {
  return denominator <= 0 ? 0 : Number((numerator / denominator).toFixed(3));
}

function invalidMoveCopy(reason: string): string {
  if (reason === "target_occupied") return "That spot is full.";
  if (reason === "source_blocked") return "That product is blocked.";
  if (reason === "target_blocked") return "That shelf slot is blocked.";
  if (reason === "same_compartment") return "Pick a different shelf.";
  if (reason === "locked_compartment") return "Unlock that shelf first.";
  return "That shelf spot is not valid.";
}

function rescueForFailReason(
  reason: FailReason,
  remainingTargets: string
): { title: string; copy: string; icon: string; offerIds: string[]; buttons: string } {
  if (reason === "timeout" || reason === "objective_incomplete") {
    return {
      title: reason === "timeout" ? "Time Up" : "Order Still Open",
      icon: `<img src="/assets/ui/timer.svg" alt="">`,
      copy:
        reason === "timeout"
          ? "Add 45 seconds and keep the same board state."
          : `Still needed: ${remainingTargets || "target goods"}. A hint or more time can recover this run.`,
      offerIds: ["revive_plus_45", "coins_plus_45_sec", "hint"],
      buttons:
        `<button class="primary" data-action="revive_ad">Watch for +45s</button>` +
        `<button data-action="revive_coin">Use 300 coins</button>` +
        `<button data-booster="hint">Use hint</button>`
    };
  }
  if (reason === "reserve_mismanagement" || reason === "board_jammed") {
    return {
      title: "No Moves",
      icon: `<img src="/assets/ui/shuffle.svg" alt="">`,
      copy: "Open one more reserve shelf or shuffle the visible goods to recover space.",
      offerIds: ["extra_slot", "shuffle"],
      buttons: `<button class="primary" data-booster="extra_slot">Extra shelf</button><button data-booster="shuffle">Shuffle</button>`
    };
  }
  if (reason === "blocker_remaining") {
    return {
      title: "Shelf Blocked",
      icon: `<img src="/assets/ui/hammer.svg" alt="">`,
      copy: "Clear a nearby match or use the hammer to break the blocker path.",
      offerIds: ["hammer", "shuffle"],
      buttons: `<button class="primary" data-booster="hammer">Hammer</button><button data-booster="shuffle">Shuffle</button>`
    };
  }
  return {
    title: "Target Remaining",
    icon: `<img src="/assets/ui/hint.svg" alt="">`,
    copy: `Still needed: ${remainingTargets || "target goods"}. Use a hint or retry from the same fair starting board.`,
    offerIds: ["hint", "shuffle"],
    buttons: `<button class="primary" data-booster="hint">Use hint</button><button data-booster="shuffle">Shuffle</button>`
  };
}

function formatTime(seconds: number): string {
  const whole = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

function timerMultiplier(tier: LevelConfig["difficultyTier"], remote: RemoteConfig): number {
  if (tier === "hard") return remote.difficulty.timerMultiplierHard;
  if (tier === "super_hard") return remote.difficulty.timerMultiplierSuperHard;
  return remote.difficulty.timerMultiplierNormal;
}

function labelTier(tier: string): string {
  return tier === "super_hard" ? "Super Hard" : title(tier);
}

function title(value: string): string {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

