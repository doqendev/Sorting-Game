import type { SoundCue } from "./audio";

type HapticCue = SoundCue | "lift" | "drawer_skip";
type SettingsProvider = () => { haptics: boolean };

const PATTERNS: Record<HapticCue, VibratePattern> = {
  select: 7,
  lift: 8,
  move: 6,
  snap: 12,
  pair: [8, 18, 8],
  clear: [12, 24, 18],
  combo: [10, 18, 10, 18, 18],
  reveal: [8, 20, 12],
  booster: [18, 28, 18],
  invalid: [28, 20, 28],
  warning: [20, 30, 20],
  drawer: [12, 22, 16],
  drawer_skip: 10,
  star: 9,
  coin: 6,
  win: [16, 24, 16, 24, 28],
  loss: [40, 30, 40]
};

export class HapticsService {
  constructor(private settingsProvider: SettingsProvider) {}

  pulse(cue: HapticCue): void {
    if (!this.settingsProvider().haptics || !("vibrate" in navigator)) return;
    navigator.vibrate(PATTERNS[cue]);
  }
}

