import { animationMs, wait } from "./AnimationDirector";
import type { BoardEffectKind, CellPoint } from "./VisualEvents";

const EFFECT_COLORS: Record<BoardEffectKind, string[]> = {
  move: ["#8ee8ff", "#ffffff"],
  snap: ["#7ff0ae", "#ffffff"],
  pair: ["#9de2ff", "#ffef7a"],
  clear: ["#ffcf5a", "#ffffff", "#56d6ff"],
  combo: ["#ffcf5a", "#ff7d66", "#8b6cff"],
  reveal: ["#a8fff0", "#ffffff"],
  booster: ["#56d6ff", "#ffcf5a"],
  invalid: ["#ff6b6b", "#ffffff"],
  win: ["#ffcf5a", "#8b6cff", "#56d6ff", "#ffffff"]
};

export function burst(host: HTMLElement, point: CellPoint, kind: BoardEffectKind, reduceMotion: boolean): void {
  const count = reduceMotion ? 5 : kind === "combo" || kind === "win" ? 18 : 11;
  const colors = EFFECT_COLORS[kind];
  for (let index = 0; index < count; index += 1) {
    const particle = document.createElement("span");
    particle.className = `fx-particle fx-${kind}`;
    particle.style.left = `${point.x}px`;
    particle.style.top = `${point.y}px`;
    particle.style.background = colors[index % colors.length];
    const angle = (Math.PI * 2 * index) / count;
    const distance = reduceMotion ? 18 : 34 + (index % 4) * 9;
    particle.style.setProperty("--tx", `${Math.cos(angle) * distance}px`);
    particle.style.setProperty("--ty", `${Math.sin(angle) * distance}px`);
    particle.style.animationDuration = `${animationMs(620, reduceMotion)}ms`;
    host.appendChild(particle);
    window.setTimeout(() => particle.remove(), animationMs(680, reduceMotion));
  }
}

export async function rewardFlight(
  host: HTMLElement,
  from: CellPoint,
  to: CellPoint,
  label: string,
  reduceMotion: boolean
): Promise<void> {
  const token = document.createElement("span");
  token.className = "fx-reward-token";
  token.textContent = label;
  token.style.left = `${from.x}px`;
  token.style.top = `${from.y}px`;
  token.style.setProperty("--tx", `${to.x - from.x}px`);
  token.style.setProperty("--ty", `${to.y - from.y}px`);
  token.style.animationDuration = `${animationMs(720, reduceMotion)}ms`;
  host.appendChild(token);
  await wait(animationMs(720, reduceMotion));
  token.remove();
}

