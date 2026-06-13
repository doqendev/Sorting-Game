import type { BoosterId, EconomyConfig, PlayerSave } from "../domain/types";
import { AnalyticsService } from "./analytics";

export class EconomyService {
  constructor(
    private config: EconomyConfig,
    private analytics: AnalyticsService,
    private saveProvider: () => PlayerSave,
    private persist: (save: PlayerSave) => void
  ) {}

  grant(transactionId: string, grants: Record<string, number | boolean | string>, source: string): boolean {
    const save = this.saveProvider();
    if (save.ledger[transactionId]) return false;
    save.ledger[transactionId] = true;
    for (const [item, amount] of Object.entries(grants)) {
      if (item === "coins" && typeof amount === "number") {
        save.wallet.coins = Math.min(this.config.currencies.coins.maxSoftCap, save.wallet.coins + amount);
      } else if (item === "gems" && typeof amount === "number") {
        save.wallet.gems += amount;
      } else if (item === "stars" && typeof amount === "number") {
        save.progress.stars += amount;
      } else if (item === "passXp" && typeof amount === "number") {
        save.progress.passXp += amount;
      } else if (item in save.boosters && typeof amount === "number") {
        save.boosters[item as BoosterId] += amount;
      } else if (item === "removeAds" && amount === true) {
        save.purchases.removeAds = true;
      } else if (item === "activePassId" && typeof amount === "string") {
        save.purchases.activePassId = amount;
      }
      this.analytics.track("economy_grant", {
        item,
        amount,
        source,
        balance: snapshotBalance(save, item),
        transactionIdHash: transactionId.slice(-8)
      });
    }
    this.persist(save);
    return true;
  }

  spendBooster(boosterId: BoosterId, source: string): boolean {
    const save = this.saveProvider();
    if (save.boosters[boosterId] > 0) {
      save.boosters[boosterId] -= 1;
      this.analytics.track("economy_spend", {
        item: boosterId,
        amount: 1,
        source,
        sink: "booster_use",
        balance: save.boosters[boosterId]
      });
      this.persist(save);
      return true;
    }
    const cost = this.config.boosterCosts[boosterId].coins;
    return this.spendCoins(cost, `buy_${boosterId}`, source);
  }

  spendCoins(amount: number, sink: string, source: string): boolean {
    const save = this.saveProvider();
    if (save.wallet.coins < amount) return false;
    save.wallet.coins -= amount;
    this.analytics.track("economy_spend", {
      item: "coins",
      amount,
      source,
      sink,
      balance: save.wallet.coins
    });
    this.persist(save);
    return true;
  }

  buyMockProduct(productId: string): boolean {
    const product = this.config.iapProducts.find((candidate) => candidate.id === productId);
    if (!product) return false;
    const transactionId = `sandbox_${productId}_${Date.now()}`;
    this.analytics.track("iap_start", { productId, price: product.price, currency: "USD" });
    const granted = this.grant(transactionId, product.contents, `iap:${productId}`);
    if (granted) {
      this.analytics.track("iap_complete", {
        productId,
        transactionIdHash: transactionId.slice(-8),
        revenue: product.price
      });
    }
    return granted;
  }
}

function snapshotBalance(save: PlayerSave, item: string): number | boolean | string | null {
  if (item === "coins") return save.wallet.coins;
  if (item === "gems") return save.wallet.gems;
  if (item === "stars") return save.progress.stars;
  if (item === "passXp") return save.progress.passXp;
  if (item in save.boosters) return save.boosters[item as BoosterId];
  if (item === "removeAds") return save.purchases.removeAds;
  if (item === "activePassId") return save.purchases.activePassId;
  return null;
}
