import type { EconomyConfig, LevelConfig, ProductCatalog, RemoteConfig } from "../domain/types";
import { appUrl } from "../services/paths";

export interface ContentBundle {
  catalog: ProductCatalog;
  launchLevels: LevelConfig[];
  backlogLevels: LevelConfig[];
  economy: EconomyConfig;
  remote: RemoteConfig;
  themes: ThemeConfig[];
  events: EventConfig[];
}

export interface ThemeConfig {
  id: string;
  name: string;
  shelfColor: string;
  wallColor: string;
  accentColor: string;
  unlockLevel: number;
}

export interface EventConfig {
  id: string;
  name: string;
  durationHours: number;
  mechanic: string;
  reward: string;
}

export async function loadContent(): Promise<ContentBundle> {
  const [catalog, launch, backlog, economy, remote, themes, events] = await Promise.all([
    loadJson<ProductCatalog>(appUrl("data/product_catalog.json")),
    loadJson<{ schemaVersion: 1; levels: LevelConfig[] }>(appUrl("data/levels_launch.json")),
    loadJson<{ schemaVersion: 1; levels: LevelConfig[] }>(appUrl("data/levels_backlog.json")),
    loadJson<EconomyConfig>(appUrl("data/economy_config.json")),
    loadJson<RemoteConfig>(appUrl("data/remote_config.json")),
    loadJson<{ schemaVersion: 1; themes: ThemeConfig[] }>(appUrl("data/themes.json")),
    loadJson<{ schemaVersion: 1; events: EventConfig[] }>(appUrl("data/events.json"))
  ]);
  return {
    catalog,
    launchLevels: launch.levels,
    backlogLevels: backlog.levels,
    economy,
    remote,
    themes: themes.themes,
    events: events.events
  };
}

async function loadJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load ${url}: ${response.status}`);
  return (await response.json()) as T;
}
