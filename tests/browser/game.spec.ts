import { expect, test } from "@playwright/test";
import { PNG } from "pngjs";

type TestMove = {
  sourceCompartmentId: string;
  sourceCellIndex: number;
  targetCompartmentId: string;
  targetCellIndex: number;
};

test("loads a playable nonblank board with stable game-native HUD", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("canvas")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Chapter map" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Hint booster" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Shop" })).toBeVisible();
  await expect(page.getByText("Clear all goods")).toBeVisible();
  await expect(page.locator("canvas")).toBeVisible();

  const stats = await waitForNonBlankCanvas(page);
  expect(stats.colored, `colored pixels: ${JSON.stringify(stats)}`).toBeGreaterThan(80);
  expect(stats.nonBackground, `non-background pixels: ${JSON.stringify(stats)}`).toBeGreaterThan(120);

  const hudOverlap = await page.evaluate(() => {
    const top = document.querySelector(".top-hud")!.getBoundingClientRect();
    const bottom = document.querySelector(".bottom-hud")!.getBoundingClientRect();
    const boardRect = document.querySelector("#board")!.getBoundingClientRect();
    return {
      topAboveBoard: top.bottom <= boardRect.top + 1,
      bottomBelowBoard: bottom.top >= boardRect.bottom - 1
    };
  });
  expect(hudOverlap.topAboveBoard).toBe(true);
  expect(hudOverlap.bottomBelowBoard).toBe(true);
});

test("exposes installable mobile PWA metadata", async ({ page, request, baseURL }) => {
  await page.goto("/");
  const appBase = baseURL ?? "http://127.0.0.1:5174";
  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute("href");
  expect(manifestHref).toBeTruthy();
  await expect(page.locator('meta[name="mobile-web-app-capable"]')).toHaveAttribute("content", "yes");

  const manifestResponse = await request.get(new URL(manifestHref!, appBase).toString());
  expect(manifestResponse.ok()).toBe(true);
  const manifest = (await manifestResponse.json()) as { display: string; icons: unknown[]; orientation: string };
  expect(manifest.display).toBe("standalone");
  expect(manifest.orientation).toBe("portrait");
  expect(manifest.icons.length).toBeGreaterThanOrEqual(2);

  const serviceWorkerResponse = await request.get(new URL("/sw.js", appBase).toString());
  expect(serviceWorkerResponse.ok()).toBe(true);
});

test("selects, clears, and completes the first authored level through the Puzzle Complete Drawer", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.__SHELF_SORT_TEST__?.setConsent(true));
  await page.evaluate(() => window.__SHELF_SORT_TEST__?.select({ compartmentId: "c_0_0", cellIndex: 0 }));
  await expect.poll(() => page.evaluate(() => window.__SHELF_SORT_TEST__?.isAnimating() ?? false)).toBe(false);

  await completeFirstLevel(page);

  await expect(page.getByRole("dialog", { name: "Puzzle complete rewards" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Puzzle Complete!" })).toBeVisible();
  const drawer = page.getByRole("dialog", { name: "Puzzle complete rewards" });
  await expect(drawer.getByText("Daily order")).toBeVisible();
  await expect(drawer.getByText("Pass XP")).toBeVisible();
  await expect(page.getByRole("button", { name: /Double coins/i })).toBeVisible();
  await page.getByRole("dialog", { name: "Puzzle complete rewards" }).click();
  await expect(page.getByRole("button", { name: /Next Level/i })).toBeEnabled();

  const state = await page.evaluate(() => window.__SHELF_SORT_TEST__?.state());
  expect(state?.levelEnd).toBe("win");
  expect(state?.objective.clearedProducts).toBe(9);

  const events = await page.evaluate(() => window.__SHELF_SORT_TEST__?.analytics().map((event) => event.name) ?? []);
  expect(events).toContain("first_clear_time_ms");
  expect(events).toContain("first_clear_seconds");
  expect(events).toContain("clear_animation_seen");
  expect(events).toContain("win_drawer_opened");
  expect(events).toContain("move_to_clear_ratio");
});

test("reduced motion still reaches a tappable completion drawer", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    window.__SHELF_SORT_TEST__?.setConsent(true);
    window.__SHELF_SORT_TEST__?.setReduceMotion(true);
  });

  await completeFirstLevel(page);

  const overlay = page.locator("#rewardOverlay");
  await expect(overlay).toHaveClass(/drawer-ready/);
  await expect(page.getByRole("button", { name: /Next Level/i })).toBeEnabled();
  const events = await page.evaluate(() => window.__SHELF_SORT_TEST__?.analytics().map((event) => event.name) ?? []);
  expect(events).toContain("win_drawer_opened");
});

test("loss, shop, map, and settings surfaces use game-styled panels", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.__SHELF_SORT_TEST__?.setConsent(true));
  await waitForNonBlankCanvas(page);

  await page.getByRole("button", { name: "Shop" }).click();
  await expect(page.getByRole("heading", { name: "Shop" })).toBeVisible();
  await expect(page.locator(".shop-item")).toHaveCount(5);
  await page.getByRole("button", { name: "Close" }).click();

  await page.getByRole("button", { name: "Chapter map" }).click();
  await expect(page.getByRole("heading", { name: "Chapter Map" })).toBeVisible();
  await expect(page.locator(".map-path")).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();

  await page.getByRole("button", { name: "Pause" }).click();
  await page.getByRole("button", { name: "Settings" }).click();
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  await expect(page.getByText("Reduce motion")).toBeVisible();
  await expect(page.getByText("SFX")).toBeVisible();
  await expect(page.getByText("Haptics")).toBeVisible();
  await page.getByRole("button", { name: "Done" }).click();

  await page.evaluate(() => window.__SHELF_SORT_TEST__?.forceLoss("timeout"));
  await expect(page.getByRole("heading", { name: "Time Up" })).toBeVisible();
  await expect(page.locator(".rescue-card")).toBeVisible();
  await expect(page.getByRole("button", { name: "Watch for +45s" })).toBeVisible();

  const events = await page.evaluate(() => window.__SHELF_SORT_TEST__?.analytics().map((event) => event.name) ?? []);
  expect(events).toContain("booster_prompt_from_fail_reason");
  expect(events).toContain("loss_reason_distribution");
});

test("drag mode product follows the pointer before resolving", async ({ page }) => {
  await page.goto("/");
  await waitForNonBlankCanvas(page);
  await page.evaluate(() => window.__SHELF_SORT_TEST__?.setInputMode("drag"));
  const points = await page.evaluate(() => {
    const source = window.__SHELF_SORT_TEST__?.cellPoint("c_0_0", 0);
    const target = window.__SHELF_SORT_TEST__?.cellPoint("c_1_0", 2);
    const board = document.querySelector("#board")!.getBoundingClientRect();
    return source && target
      ? {
          source: { x: board.left + source.x, y: board.top + source.y },
          mid: { x: board.left + (source.x + target.x) / 2, y: board.top + (source.y + target.y) / 2 },
          target: { x: board.left + target.x, y: board.top + target.y }
        }
      : null;
  });
  expect(points).toBeTruthy();
  await page.mouse.move(points!.source.x, points!.source.y);
  await page.mouse.down();
  await page.mouse.move(points!.mid.x, points!.mid.y, { steps: 4 });
  await expect(page.locator(".fx-drag-product")).toBeVisible();
  const ghostAtMid = await page.locator(".fx-drag-product").boundingBox();
  expect(ghostAtMid?.x).toBeGreaterThan(points!.source.x - 40);
  await page.mouse.move(points!.target.x, points!.target.y, { steps: 4 });
  await page.mouse.up();
  await waitForAnimations(page);
  await expect(page.locator(".fx-drag-product")).toHaveCount(0);
});

test("mobile width keeps the board readable and controls separated", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/");
  await waitForNonBlankCanvas(page);

  const layout = await page.evaluate(() => {
    const top = document.querySelector(".top-hud")!.getBoundingClientRect();
    const objective = document.querySelector(".objective-row")!.getBoundingClientRect();
    const board = document.querySelector("#board")!.getBoundingClientRect();
    const bottom = document.querySelector(".bottom-hud")!.getBoundingClientRect();
    return {
      topObjectiveSeparated: top.bottom <= objective.top + 2,
      objectiveBoardSeparated: objective.bottom <= board.top + 2,
      boardBottomSeparated: board.bottom <= bottom.top + 2,
      boosterHeight: bottom.height
    };
  });
  expect(layout.topObjectiveSeparated).toBe(true);
  expect(layout.objectiveBoardSeparated).toBe(true);
  expect(layout.boardBottomSeparated).toBe(true);
  expect(layout.boosterHeight).toBeLessThanOrEqual(76);
});

async function completeFirstLevel(page: import("@playwright/test").Page): Promise<void> {
  const moves: TestMove[] = [
    { sourceCompartmentId: "c_0_0", sourceCellIndex: 0, targetCompartmentId: "c_1_0", targetCellIndex: 2 },
    { sourceCompartmentId: "c_0_0", sourceCellIndex: 1, targetCompartmentId: "c_1_1", targetCellIndex: 0 },
    { sourceCompartmentId: "c_0_1", sourceCellIndex: 0, targetCompartmentId: "c_1_1", targetCellIndex: 1 },
    { sourceCompartmentId: "c_0_1", sourceCellIndex: 1, targetCompartmentId: "c_1_1", targetCellIndex: 2 },
    { sourceCompartmentId: "c_0_0", sourceCellIndex: 2, targetCompartmentId: "c_1_2", targetCellIndex: 0 },
    { sourceCompartmentId: "c_0_2", sourceCellIndex: 0, targetCompartmentId: "c_1_2", targetCellIndex: 1 },
    { sourceCompartmentId: "c_0_2", sourceCellIndex: 1, targetCompartmentId: "c_1_2", targetCellIndex: 2 }
  ];

  for (const move of moves) {
    await page.evaluate((moveToApply) => window.__SHELF_SORT_TEST__?.move(moveToApply), move);
    await waitForAnimations(page);
  }
}

async function waitForAnimations(page: import("@playwright/test").Page): Promise<void> {
  await expect
    .poll(() => page.evaluate(() => window.__SHELF_SORT_TEST__?.isAnimating() ?? false), {
      timeout: 6000,
      intervals: [100, 150, 250]
    })
    .toBe(false);
}

async function waitForNonBlankCanvas(page: import("@playwright/test").Page): Promise<{ samples: number; colored: number; nonBackground: number }> {
  const canvas = page.locator("canvas");
  let lastStats = { samples: 0, colored: 0, nonBackground: 0 };
  await expect
    .poll(
      async () => {
        const png = PNG.sync.read(await canvas.screenshot());
        lastStats = samplePixels(png);
        return lastStats.colored > 80 && lastStats.nonBackground > 120;
      },
      { timeout: 5000, intervals: [100, 250, 500] }
    )
    .toBe(true);
  return lastStats;
}

function samplePixels(png: PNG): { samples: number; colored: number; nonBackground: number } {
  let samples = 0;
  let colored = 0;
  let nonBackground = 0;
  const stepX = Math.max(1, Math.floor(png.width / 52));
  const stepY = Math.max(1, Math.floor(png.height / 52));
  for (let y = 0; y < png.height; y += stepY) {
    for (let x = 0; x < png.width; x += stepX) {
      const i = (y * png.width + x) * 4;
      const r = png.data[i];
      const g = png.data[i + 1];
      const b = png.data[i + 2];
      const a = png.data[i + 3];
      samples += 1;
      if (a > 0 && (Math.abs(r - g) > 8 || Math.abs(g - b) > 8 || Math.abs(r - b) > 8)) colored += 1;
      if (a > 0 && !(r > 220 && g > 220 && b > 220)) nonBackground += 1;
    }
  }
  return { samples, colored, nonBackground };
}
