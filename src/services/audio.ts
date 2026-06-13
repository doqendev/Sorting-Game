export type SoundCue =
  | "select"
  | "move"
  | "snap"
  | "pair"
  | "clear"
  | "combo"
  | "reveal"
  | "booster"
  | "invalid"
  | "warning"
  | "drawer"
  | "star"
  | "coin"
  | "win"
  | "loss";

type SettingsProvider = () => { sfx: boolean; music: boolean };

const CUE_FREQUENCIES: Record<SoundCue, [number, number?]> = {
  select: [420],
  move: [360, 440],
  snap: [520],
  pair: [560, 660],
  clear: [620, 820],
  combo: [760, 980],
  reveal: [480, 720],
  booster: [520, 390],
  invalid: [170, 140],
  warning: [260, 220],
  drawer: [300, 520],
  star: [860],
  coin: [740, 920],
  win: [680, 980],
  loss: [170, 120]
};

export class AudioService {
  private context: AudioContext | null = null;
  private unlocked = false;
  private variation = 0;

  constructor(private settingsProvider: SettingsProvider) {}

  unlock(): void {
    const context = this.getContext();
    if (!context) return;
    void context.resume();
    this.unlocked = true;
  }

  play(cue: SoundCue, intensity = 1): void {
    if (!this.settingsProvider().sfx) return;
    const context = this.getContext();
    if (!context) return;
    if (context.state === "suspended" && this.unlocked) void context.resume();
    const [base, second] = CUE_FREQUENCIES[cue];
    this.playTone(context, base + this.pitchVariation(), 0.055, intensity);
    if (second) {
      window.setTimeout(() => this.playTone(context, second + this.pitchVariation(), 0.06, intensity * 0.86), 58);
    }
  }

  private getContext(): AudioContext | null {
    if (this.context) return this.context;
    const AudioContextClass =
      window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    this.context = new AudioContextClass();
    return this.context;
  }

  private playTone(context: AudioContext, frequency: number, duration: number, intensity: number): void {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(80, frequency * 0.94), context.currentTime + duration);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(Math.min(0.045, 0.022 * intensity), context.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration + 0.02);
  }

  private pitchVariation(): number {
    this.variation = (this.variation + 1) % 7;
    return (this.variation - 3) * 5;
  }
}

