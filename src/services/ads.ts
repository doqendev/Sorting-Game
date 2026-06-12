import type { PlayerSave, RemoteConfig } from "../domain/types";
import { AnalyticsService } from "./analytics";

export class AdsService {
  private lastInterstitialAt = 0;
  private lastRewardedAt = 0;

  constructor(
    private remote: RemoteConfig,
    private analytics: AnalyticsService,
    private saveProvider: () => PlayerSave
  ) {}

  isRewardedReady(_placementId: string): boolean {
    return true;
  }

  async showRewarded(placementId: string, context: string, reward: Record<string, unknown>): Promise<boolean> {
    this.analytics.track("ad_opportunity", { placement: placementId, context, reward });
    await wait(650);
    this.lastRewardedAt = Date.now();
    this.analytics.track("ad_impression", {
      network: "sandbox",
      placement: placementId,
      format: "rewarded",
      revenue: 0.01
    });
    return true;
  }

  isInterstitialReady(placementId: string, completedLevel: number): boolean {
    const save = this.saveProvider();
    if (save.purchases.removeAds) return false;
    if (!this.remote.ads.interstitialEnabled) return false;
    if (completedLevel < this.remote.ads.firstInterstitialAfterLevel) return false;
    if (Date.now() - this.lastInterstitialAt < this.remote.ads.interstitialCooldownSec * 1000) return false;
    if (Date.now() - this.lastRewardedAt < this.remote.ads.suppressInterstitialAfterRewardedSec * 1000) return false;
    return placementId.length > 0;
  }

  async showInterstitial(placementId: string, context: string): Promise<boolean> {
    if (!this.isInterstitialReady(placementId, this.saveProvider().progress.highestLevelCompleted)) return false;
    this.analytics.track("ad_opportunity", { placement: placementId, context, reward: null });
    await wait(450);
    this.lastInterstitialAt = Date.now();
    this.analytics.track("ad_impression", {
      network: "sandbox",
      placement: placementId,
      format: "interstitial",
      revenue: 0.005
    });
    return true;
  }

  shouldShowBanner(): boolean {
    return this.remote.ads.bannerInGameplayEnabled && !this.saveProvider().purchases.removeAds;
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
