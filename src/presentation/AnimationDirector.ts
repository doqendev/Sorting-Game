export type EasingName = "snap" | "soft" | "linear";

export interface TweenOptions {
  durationMs: number;
  easing?: EasingName;
  reduceMotion?: boolean;
}

export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function sequence(steps: Array<() => Promise<void> | void>): Promise<void> {
  for (const step of steps) await step();
}

export async function parallel(steps: Array<() => Promise<void> | void>): Promise<void> {
  await Promise.all(steps.map((step) => step()));
}

export function animationMs(durationMs: number, reduceMotion: boolean): number {
  return reduceMotion ? Math.min(90, Math.max(40, Math.round(durationMs * 0.18))) : durationMs;
}

export function webEasing(easing: EasingName = "snap"): string {
  if (easing === "linear") return "linear";
  if (easing === "soft") return "cubic-bezier(.2,.8,.2,1)";
  return "cubic-bezier(.18,.9,.24,1.18)";
}

export function tweenElement(element: HTMLElement, keyframes: Keyframe[], options: TweenOptions): Promise<void> {
  const animation = element.animate(keyframes, {
    duration: animationMs(options.durationMs, options.reduceMotion ?? false),
    easing: webEasing(options.easing),
    fill: "forwards"
  });
  return animation.finished.then(() => undefined).catch(() => undefined);
}

