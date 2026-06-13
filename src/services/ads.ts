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
    return _placementId.length > 0;
  }

  async showRewarded(placementId: string, context: string, reward: Record<string, unknown>): Promise<boolean> {
    const ready = this.isRewardedReady(placementId);
    this.analytics.track("rewarded_ad_offer", { placement: placementId, context, reward, ready });
    if (!ready) {
      this.analytics.track("rewarded_ad_complete", {
        placement: placementId,
        context,
        rewardGranted: false,
        failureReason: "no_fill"
      });
      return false;
    }
    this.analytics.track("rewarded_ad_start", { placement: placementId, context, reward });
    const completed = await waitWithTimeout(650, 2500);
    if (!completed) {
      this.analytics.track("rewarded_ad_complete", {
        placement: placementId,
        context,
        rewardGranted: false,
        failureReason: "timeout"
      });
      return false;
    }
    this.lastRewardedAt = Date.now();
    this.analytics.track("rewarded_ad_complete", {
      network: "sandbox",
      placement: placementId,
      context,
      rewardGranted: true,
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
    await wait(450);
    this.lastInterstitialAt = Date.now();
    this.analytics.track("interstitial_impression", {
      network: "sandbox",
      placement: placementId,
      context,
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

async function waitWithTimeout(delayMs: number, timeoutMs: number): Promise<boolean> {
  const result = await Promise.race([wait(delayMs).then(() => true), wait(timeoutMs).then(() => false)]);
  return result;
}
