import type { EconomyConfig, PlayerSave } from "../domain/types";

const ACTIVE_KEY = "shelf-sort-save-active-v1";
const BACKUP_KEY = "shelf-sort-save-backup-v1";
const CLOUD_KEY = "shelf-sort-cloud-save-v1";
const DEFAULT_RENOVATION = {
  marketStandLevel: 1,
  shelfLightingLevel: 1,
  signageLevel: 1
};

export class SaveService {
  constructor(private economy: EconomyConfig) {}

  load(): PlayerSave {
    const active = this.readEnvelope(ACTIVE_KEY);
    if (active) return active;
    const backup = this.readEnvelope(BACKUP_KEY);
    if (backup) return backup;
    const now = new Date().toISOString();
    return {
      schemaVersion: 1,
      playerId: `anon_${crypto.randomUUID().slice(0, 8)}`,
      createdAt: now,
      lastSeenAt: now,
      progress: {
        highestLevelCompleted: 0,
        currentChapterId: "snack_aisle",
        stars: this.economy.currencies.stars.startingAmount,
        xp: 0,
        winStreak: 0,
        passXp: 0
      },
      wallet: {
        coins: this.economy.currencies.coins.startingAmount,
        gems: this.economy.currencies.gems.startingAmount
      },
      boosters: {
        hint: 3,
        shuffle: 1,
        hammer: 1,
        freeze_time: 1,
        extra_slot: 1
      },
      settings: {
        inputMode: "tap_and_drag",
        music: true,
        sfx: true,
        haptics: true,
        reduceMotion: false,
        relaxModePreferred: false,
        consentGranted: false
      },
      purchases: {
        removeAds: false,
        activePassId: null,
        starterPackPurchased: false
      },
      events: {},
      collections: {},
      renovation: { ...DEFAULT_RENOVATION },
      ledger: {}
    };
  }

  save(save: PlayerSave): void {
    const next = { ...save, lastSeenAt: new Date().toISOString() };
    const envelope = JSON.stringify({ checksum: checksum(JSON.stringify(next)), save: next });
    const previous = localStorage.getItem(ACTIVE_KEY);
    if (previous) localStorage.setItem(BACKUP_KEY, previous);
    localStorage.setItem(ACTIVE_KEY, envelope);
  }

  syncCloud(local: PlayerSave): PlayerSave {
    const cloud = this.readEnvelope(CLOUD_KEY);
    if (!cloud) {
      localStorage.setItem(CLOUD_KEY, JSON.stringify({ checksum: checksum(JSON.stringify(local)), save: local }));
      return local;
    }
    const merged = mergeSaves(local, cloud);
    this.save(merged);
    localStorage.setItem(CLOUD_KEY, JSON.stringify({ checksum: checksum(JSON.stringify(merged)), save: merged }));
    return merged;
  }

  private readEnvelope(key: string): PlayerSave | null {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const envelope = JSON.parse(raw) as { checksum: string; save: PlayerSave };
      const encoded = JSON.stringify(envelope.save);
      if (checksum(encoded) !== envelope.checksum) return null;
      return migrateSave(envelope.save);
    } catch {
      return null;
    }
  }
}

export function migrateSave(save: PlayerSave): PlayerSave {
  return {
    ...save,
    schemaVersion: 1,
    boosters: Object.assign({
      hint: 0,
      shuffle: 0,
      hammer: 0,
      freeze_time: 0,
      extra_slot: 0
    }, save.boosters),
    settings: Object.assign({
      inputMode: "tap_and_drag",
      music: true,
      sfx: true,
      haptics: true,
      reduceMotion: false,
      relaxModePreferred: false,
      consentGranted: false
    }, save.settings),
    collections: save.collections ?? {},
    events: save.events ?? {},
    renovation: {
      ...DEFAULT_RENOVATION,
      ...(save.renovation ?? {})
    },
    ledger: save.ledger ?? {}
  };
}

export function mergeSaves(local: PlayerSave, cloud: PlayerSave): PlayerSave {
  const localRenovation = local.renovation ?? DEFAULT_RENOVATION;
  const cloudRenovation = cloud.renovation ?? DEFAULT_RENOVATION;
  return {
    ...local,
    progress: {
      ...local.progress,
      highestLevelCompleted: Math.max(local.progress.highestLevelCompleted, cloud.progress.highestLevelCompleted),
      stars: Math.max(local.progress.stars, cloud.progress.stars),
      xp: Math.max(local.progress.xp, cloud.progress.xp),
      winStreak: Math.max(local.progress.winStreak, cloud.progress.winStreak),
      passXp: Math.max(local.progress.passXp, cloud.progress.passXp)
    },
    wallet: {
      coins: Math.max(local.wallet.coins, cloud.wallet.coins),
      gems: Math.max(local.wallet.gems, cloud.wallet.gems)
    },
    purchases: {
      removeAds: local.purchases.removeAds || cloud.purchases.removeAds,
      activePassId: local.purchases.activePassId ?? cloud.purchases.activePassId,
      starterPackPurchased: local.purchases.starterPackPurchased || cloud.purchases.starterPackPurchased
    },
    collections: mergeCollections(local.collections, cloud.collections),
    events: { ...cloud.events, ...local.events },
    renovation: {
      marketStandLevel: Math.max(localRenovation.marketStandLevel, cloudRenovation.marketStandLevel),
      shelfLightingLevel: Math.max(localRenovation.shelfLightingLevel, cloudRenovation.shelfLightingLevel),
      signageLevel: Math.max(localRenovation.signageLevel, cloudRenovation.signageLevel)
    },
    ledger: { ...cloud.ledger, ...local.ledger }
  };
}

function mergeCollections(local: Record<string, string[]>, cloud: Record<string, string[]>): Record<string, string[]> {
  const merged: Record<string, string[]> = {};
  for (const category of new Set([...Object.keys(cloud ?? {}), ...Object.keys(local ?? {})])) {
    merged[category] = [...new Set([...(cloud?.[category] ?? []), ...(local?.[category] ?? [])])];
  }
  return merged;
}

export function checksum(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}
