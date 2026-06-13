import "./styles.css";
import { loadContent } from "./data/loaders";
import { GameApp } from "./app/GameApp";
import { appUrl, rewriteAppUrls } from "./services/paths";

async function bootstrap(): Promise<void> {
  const root = document.querySelector<HTMLElement>("#app");
  if (!root) throw new Error("Missing #app root.");
  root.innerHTML = rewriteAppUrls(`
    <main class="loading">
      <strong>Shelf Sort 3D</strong>
      <div class="loading-icons" aria-hidden="true">
        <img src="/assets/skus/chips_blue.svg" alt="">
        <img src="/assets/skus/soda_blue.svg" alt="">
        <img src="/assets/skus/apple_red.svg" alt="">
      </div>
      <span>Stocking shelves...</span>
      <i class="loading-bar" aria-hidden="true"></i>
    </main>
  `);
  const content = await loadContent();
  const app = new GameApp(content, root);
  app.start();
  registerServiceWorker();
}

function registerServiceWorker(): void {
  if (!("serviceWorker" in navigator) || !import.meta.env.PROD) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(appUrl("sw.js")).catch((error: unknown) => {
      console.warn("Service worker registration failed.", error);
    });
  });
}

bootstrap().catch((error) => {
  const root = document.querySelector<HTMLElement>("#app");
  if (root) {
    root.innerHTML = `<main class="loading error"><strong>Load failed</strong><span>${String(error)}</span></main>`;
  }
  throw error;
});
