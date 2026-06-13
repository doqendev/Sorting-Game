import { applyMoveAndResolve, calculateStars, createBoardState, createsPair, tickTimer } from "../domain/board";
import { createBooster, findHint } from "../domain/boosters";
import type {
  BoardState,
  BoosterId,
  FailReason,
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
import { ThreeBoardView } from "../presentation/ThreeBoardView";

declare global {
  interface Window {
    __SHELF_SORT_TEST__?: {
      move: (move: LegalMove) => void;
      state: () => BoardState;
      analytics: () => ReturnType<AnalyticsService["all"]>;
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
  private save: PlayerSave;
  private state!: BoardState;
  private currentLevel!: LevelConfig;
  private selected: { compartmentId: string; cellIndex: number } | null = null;
  private activeHint: ReturnType<typeof findHint> | null = null;
  private timerHandle = 0;
  private lastTick = performance.now();
  private timerWarningPlayed = false;
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
  }

  start(): void {
    this.renderShell();
    this.boardHost = this.root.querySelector<HTMLElement>("#board")!;
    this.boardView = new ThreeBoardView(this.boardHost, this.content.catalog.products, {
      onMove: (move) => this.handleMove(move),
      onInvalid: (reason) => this.invalidMove(reason),
      onSelect: (selection) => {
        this.selected = selection;
        this.updateHud();
      }
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
    });
    this.installLocalTestHooks();
    localStorage.setItem("shelf-sort-sessions", String(Number(localStorage.getItem("shelf-sort-sessions") ?? 0) + 1));
  }

  private renderShell(): void {
    this.root.innerHTML = `
      <main class="game" aria-label="Shelf Sort 3D">
        <section class="top-hud" aria-label="Level status">
          <button class="icon-button" data-action="map" title="Chapter map" aria-label="Chapter map">M</button>
          <div class="level-pill"><span id="levelLabel">Level 1</span><small id="tierLabel">Normal</small></div>
          <div class="timer-wrap">
            <div id="timer" class="timer">0:00</div>
            <div id="combo" class="combo hidden">x1 Combo</div>
          </div>
          <div class="currency"><span id="coinLabel">0</span><small>coins</small></div>
          <div class="currency"><span id="starLabel">0</span><small>stars</small></div>
          <button class="icon-button" data-action="pause" title="Pause" aria-label="Pause">II</button>
        </section>

        <section class="objective-row" id="objectiveRow"></section>
        <section id="board" class="board-stage" aria-label="Interactive shelf board"></section>

        <section class="bottom-hud" aria-label="Boosters">
          <button class="booster" data-booster="hint" title="Hint"><span>?</span><small id="boost_hint">0</small></button>
          <button class="booster" data-booster="shuffle" title="Shuffle"><span>S</span><small id="boost_shuffle">0</small></button>
          <button class="booster" data-booster="hammer" title="Clear One"><span>H</span><small id="boost_hammer">0</small></button>
          <button class="booster" data-booster="freeze_time" title="Freeze Time"><span>F</span><small id="boost_freeze_time">0</small></button>
          <button class="booster" data-booster="extra_slot" title="Extra Shelf"><span>+</span><small id="boost_extra_slot">0</small></button>
          <button class="text-button" data-action="shop">Shop</button>
        </section>

        <section id="banner" class="ad-banner hidden">Sandbox adaptive banner. Remove Ads disables forced banners.</section>

        <aside id="toast" class="toast hidden" role="status"></aside>

        <dialog id="modal" class="modal">
          <div id="modalContent"></div>
        </dialog>
      </main>
    `;
  }

  private bindUi(): void {
    this.root.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;
      const boosterButton = target.closest<HTMLElement>("[data-booster]");
      if (boosterButton) {
        this.useBooster(boosterButton.dataset.booster as BoosterId);
        return;
      }
      const action = target.closest<HTMLElement>("[data-action]")?.dataset.action;
      if (!action) return;
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
        this.closeModal();
        this.startLevel(Math.min(this.content.launchLevels.length, this.save.progress.highestLevelCompleted + 1));
      }
      if (action === "retry") {
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

  private handleMove(move: LegalMove): void {
    const sourceCell = this.state.compartments
      .find((compartment) => compartment.id === move.sourceCompartmentId)
      ?.front.find((cell) => cell.cellIndex === move.sourceCellIndex);
    const pairCreated = createsPair(this.state, move);
    const result = applyMoveAndResolve(this.state, { ...move, timestamp: Date.now() });
    this.feedback(result.clearedTriples.length > 0 ? "clear" : "move");
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
    this.afterResolution(result);
  }

  private afterResolution(result: ResolutionResult): void {
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
      if (clear.combo > 1) this.feedback("combo");
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
    this.boardView.renderBoard(this.state);
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
      hiddenRevealCount: this.state.hiddenReveals
    });
    this.openWinPanel(coins, stars);
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
    this.openLosePanel(failReason);
  }

  private useBooster(boosterId: BoosterId): void {
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
    if (!executable) {
      this.toast(boosterId === "hammer" ? "Select a visible product first." : "That booster is not available now.");
      return;
    }
    if (!this.economy.spendBooster(boosterId, `level:${this.currentLevel.levelId}`)) {
      this.toast("Not enough boosters or coins.");
      this.openPanel("shop");
      return;
    }
    if (this.state.levelEnd && boosterId !== "hint") {
      this.state.levelEnd = null;
      this.state.failReason = null;
      if (this.state.timer.remainingSec <= 0) this.state.timer.remainingSec = 45;
      this.state.timer.running = true;
    }
    const result = command.execute(this.state, context);
    this.feedback("booster");
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
    if (!this.state.levelEnd) this.closeModal();
  }

  private invalidMove(reason: string): void {
    this.feedback("invalid");
    this.analytics.track("invalid_move", {
      reason,
      levelId: this.currentLevel.levelId,
      selected: this.selected
    });
    this.toast("That shelf spot is not valid.");
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
      this.root.querySelector(`#boost_${booster}`)!.textContent = String(this.save.boosters[booster]);
    }
    this.root.querySelector("#objectiveRow")!.innerHTML = this.renderObjective();
    this.root.querySelector("#banner")!.classList.toggle("hidden", !this.ads.shouldShowBanner());
  }

  private renderObjective(): string {
    if (this.state.objective.type === "clear_all" || this.state.objective.type === "time_challenge") {
      const remaining = this.state.objective.totalProducts - this.state.objective.clearedProducts;
      const timeChip =
        this.state.objective.type === "time_challenge"
          ? `<span class="objective-chip">Beat ${formatTime(this.state.objective.timeLimitSec ?? this.state.timer.totalSec)}</span>`
          : "";
      return `<span class="objective-chip">Clear all goods</span><span class="objective-chip">${Math.max(0, remaining)} left</span>${timeChip}`;
    }
    if (this.state.objective.type === "combo_target") {
      return `<span class="objective-chip">Combo ${this.state.combo.max}/${this.state.objective.targetCombo}</span><span class="objective-chip">Clear all goods</span>`;
    }
    return this.state.objective.targets
      .map((target) => {
        const label = target.label ?? target.skuId ?? target.category ?? target.flag ?? "Target";
        return `<span class="objective-chip">${title(label)}: ${target.cleared}/${target.count}</span>`;
      })
      .join("");
  }

  private openWinPanel(coins: number, stars: number): void {
    const completed = this.save.progress.highestLevelCompleted;
    const next = Math.min(this.content.launchLevels.length, completed + 1);
    const adReady = this.content.remote.economy.rewardedDoubleEnabled;
    const collectionProgress = this.collectionProgressLabel();
    const eventProgress = `${Math.min(5, this.save.progress.winStreak)}/5`;
    const consentCta = this.save.settings.consentGranted
      ? ""
      : `<button data-action="consent_panel">Allow tuning telemetry</button>`;
    this.openModal(`
      <div class="panel">
        <h2>Level Complete</h2>
        <div class="reward-grid">
          <div><strong>${coins}</strong><small>coins</small></div>
          <div><strong>${stars}</strong><small>stars</small></div>
          <div><strong>${this.save.progress.winStreak}</strong><small>streak</small></div>
        </div>
        <div class="reward-grid">
          <div><strong>${collectionProgress}</strong><small>album</small></div>
          <div><strong>${eventProgress}</strong><small>daily order</small></div>
          <div><strong>${this.save.progress.passXp}</strong><small>pass XP</small></div>
        </div>
        <div class="pass-track"><span style="width:${Math.min(100, this.save.progress.passXp % 100)}%"></span></div>
        <div class="button-row">
          ${adReady ? `<button class="primary" data-action="double_reward">Double coins</button>` : ""}
          <button class="primary" data-action="next">Next ${next}</button>
        </div>
        <div class="button-row subtle-row">
          <button data-action="collections">Album</button>
          <button data-action="events">Events</button>
          <button data-action="map">Map</button>
          ${consentCta}
        </div>
      </div>
    `);
    void this.ads.showInterstitial("post_win", "level_win");
  }

  private openLosePanel(reason: FailReason): void {
    const rescue = rescueForFailReason(reason, this.remainingObjectiveLabel());
    this.analytics.track("level_revive_offer", {
      levelId: this.currentLevel.levelId,
      failReason: reason,
      offers: rescue.offerIds
    });
    this.openModal(`
      <div class="panel">
        <h2>${rescue.title}</h2>
        <p class="panel-copy">${rescue.copy}</p>
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
    this.economy.grant(`double_${this.currentLevel.levelId}_${Date.now()}`, { coins: this.currentLevel.rewards.baseCoins }, "rewarded_ad");
    this.updateHud();
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
      .map((level) => `<button data-action="jump:${level}" ${level > this.save.progress.highestLevelCompleted + 1 ? "disabled" : ""}>${level}</button>`)
      .join("");
    this.openModal(`
      <div class="panel wide">
        <h2>Chapter Map</h2>
        <p class="panel-copy">${this.content.launchLevels.length} handcrafted vertical-slice levels, ${this.content.backlogLevels.length} backlog levels, ${this.content.themes.length} shelf themes.</p>
        <div class="button-row wrap">${levels}</div>
        <div class="button-row subtle-row">
          <button data-action="daily">Daily reward</button>
          <button data-action="events">Events</button>
          <button data-action="collections">Album</button>
          <button data-action="shop">Shop</button>
          <button data-action="settings">Settings</button>
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
        <div class="setting-line"><span>Telemetry</span><button data-action="consent_panel">${this.save.settings.consentGranted ? "On" : "Off"}</button></div>
        <button class="primary" data-action="close">Done</button>
      </div>
    `);
  }

  private openEvents(): void {
    const eventRows = this.content.events
      .map((event) => `<div class="event-row"><strong>${event.name}</strong><span>${event.durationHours}h</span><small>${event.mechanic}</small></div>`)
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
        return `<div class="album-page"><strong>${title(category)}</strong><span>${collected}/${total}</span></div>`;
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

  private openModal(html: string): void {
    window.clearInterval(this.timerHandle);
    const modal = this.root.querySelector<HTMLDialogElement>("#modal")!;
    this.root.querySelector("#modalContent")!.innerHTML = html;
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

  private feedback(kind: "move" | "clear" | "combo" | "booster" | "invalid" | "warning" | "win" | "loss"): void {
    if (this.save.settings.haptics && "vibrate" in navigator) {
      const patterns = {
        move: 8,
        clear: [12, 24, 12],
        combo: [10, 18, 10, 18, 10],
        booster: 18,
        invalid: [24, 18, 24],
        warning: [20, 30, 20],
        win: [16, 24, 16, 24, 28],
        loss: [40, 30, 40]
      } satisfies Record<typeof kind, VibratePattern>;
      navigator.vibrate(patterns[kind]);
    }
    if (!this.save.settings.sfx) return;
    try {
      const AudioContextClass =
        window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const context = new AudioContextClass();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const frequencies = {
        move: 380,
        clear: 620,
        combo: 760,
        booster: 520,
        invalid: 180,
        warning: 260,
        win: 880,
        loss: 150
      } satisfies Record<typeof kind, number>;
      oscillator.frequency.value = frequencies[kind];
      gain.gain.value = 0.025;
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.07);
    } catch {
      // Browser audio can be unavailable before user activation.
    }
  }

  private installLocalTestHooks(): void {
    if (!["127.0.0.1", "localhost"].includes(window.location.hostname)) return;
    window.__SHELF_SORT_TEST__ = {
      move: (moveToApply) => this.handleMove(moveToApply),
      state: () => structuredClone(this.state) as BoardState,
      analytics: () => this.analytics.all()
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

function rescueForFailReason(
  reason: FailReason,
  remainingTargets: string
): { title: string; copy: string; offerIds: string[]; buttons: string } {
  if (reason === "timeout" || reason === "objective_incomplete") {
    return {
      title: reason === "timeout" ? "Time Up" : "Order Still Open",
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
      copy: "Open one more reserve shelf or shuffle the visible goods to recover space.",
      offerIds: ["extra_slot", "shuffle"],
      buttons: `<button class="primary" data-booster="extra_slot">Extra shelf</button><button data-booster="shuffle">Shuffle</button>`
    };
  }
  if (reason === "blocker_remaining") {
    return {
      title: "Shelf Blocked",
      copy: "Clear a nearby match or use the hammer to break the blocker path.",
      offerIds: ["hammer", "shuffle"],
      buttons: `<button class="primary" data-booster="hammer">Hammer</button><button data-booster="shuffle">Shuffle</button>`
    };
  }
  return {
    title: "Target Remaining",
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

