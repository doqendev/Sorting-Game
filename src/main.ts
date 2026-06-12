import "./styles.css";
import { loadContent } from "./data/loaders";
import { GameApp } from "./app/GameApp";

async function bootstrap(): Promise<void> {
  const root = document.querySelector<HTMLElement>("#app");
  if (!root) throw new Error("Missing #app root.");
  root.innerHTML = `<main class="loading"><strong>Shelf Sort 3D</strong><span>Loading content...</span></main>`;
  const content = await loadContent();
  const app = new GameApp(content, root);
  app.start();
}

bootstrap().catch((error) => {
  const root = document.querySelector<HTMLElement>("#app");
  if (root) {
    root.innerHTML = `<main class="loading error"><strong>Load failed</strong><span>${String(error)}</span></main>`;
  }
  throw error;
});
