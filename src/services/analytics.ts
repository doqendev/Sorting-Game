import type { AnalyticsEvent, PlayerSave } from "../domain/types";

const ANALYTICS_KEY = "shelf-sort-analytics-v1";

export class AnalyticsService {
  private sessionId = crypto.randomUUID();
  private events: AnalyticsEvent[] = [];
  private context: Record<string, unknown>;

  constructor(private saveProvider: () => PlayerSave | null) {
    this.context = {
      appVersion: "1.0.0",
      buildNumber: "web-001",
      platform: "web",
      country: "unknown",
      installCohort: new Date().toISOString().slice(0, 10),
      abVariants: {
        firstTimer: "level_6",
        interstitialFirstShow: "after_level_8",
        removeAdsPrice: "$5.99",
        hiddenPreview: "exact_until_level_100"
      }
    };
    this.events = this.load();
  }

  track(name: string, payload: Record<string, unknown> = {}): void {
    const save = this.saveProvider();
    const event: AnalyticsEvent = {
      name,
      timestamp: new Date().toISOString(),
      payload: {
        playerId: save?.playerId ?? "anonymous",
        sessionId: this.sessionId,
        ...this.context,
        ...payload
      }
    };
    this.events.push(event);
    if (this.events.length > 1200) this.events = this.events.slice(-1200);
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(this.events));
  }

  all(): AnalyticsEvent[] {
    return [...this.events];
  }

  levelDashboard(): Array<Record<string, unknown>> {
    const starts = this.events.filter((event) => event.name === "level_start");
    const ends = this.events.filter((event) => event.name === "level_end");
    const byLevel = new Map<string, Record<string, number>>();
    for (const event of starts) {
      const id = String(event.payload.levelId);
      const row = byLevel.get(id) ?? { starts: 0, wins: 0, losses: 0, moves: 0, boosterUses: 0 };
      row.starts += 1;
      byLevel.set(id, row);
    }
    for (const event of ends) {
      const id = String(event.payload.levelId);
      const row = byLevel.get(id) ?? { starts: 0, wins: 0, losses: 0, moves: 0, boosterUses: 0 };
      if (event.payload.result === "win") row.wins += 1;
      else row.losses += 1;
      row.moves += Number(event.payload.moves ?? 0);
      row.boosterUses += Number(event.payload.boostersUsed ?? 0);
      byLevel.set(id, row);
    }
    return [...byLevel.entries()].map(([levelId, row]) => ({
      levelId,
      starts: row.starts,
      completionRate: row.starts ? row.wins / row.starts : 0,
      averageMoves: row.wins + row.losses ? row.moves / (row.wins + row.losses) : 0,
      boosterUsageRate: row.starts ? row.boosterUses / row.starts : 0,
      risk: row.starts > 0 && row.wins / row.starts < 0.55 ? "low_completion" : "none"
    }));
  }

  private load(): AnalyticsEvent[] {
    try {
      return JSON.parse(localStorage.getItem(ANALYTICS_KEY) ?? "[]") as AnalyticsEvent[];
    } catch {
      return [];
    }
  }
}

export function installCrashReporting(analytics: AnalyticsService): void {
  window.addEventListener("error", (event) => {
    analytics.track("crash", {
      build: "web-001",
      device: navigator.userAgent,
      message: event.message,
      stack: event.error?.stack ?? "unavailable"
    });
  });
  window.addEventListener("unhandledrejection", (event) => {
    analytics.track("crash", {
      build: "web-001",
      device: navigator.userAgent,
      message: String(event.reason),
      stack: event.reason?.stack ?? "unavailable"
    });
  });
}
