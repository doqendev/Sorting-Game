import { expect, test } from "@playwright/test";
import { PNG } from "pngjs";

test("loads a playable nonblank board with stable HUD", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Shelf Sort 3D")).not.toBeVisible({ timeout: 10000 }).catch(() => undefined);
  await expect(page.locator("canvas")).toHaveCount(1);
  const allow = page.getByRole("button", { name: "Allow" });
  if (await allow.isVisible().catch(() => false)) {
    await allow.click();
  }
  await expect(page.getByText("Clear all goods")).toBeVisible();
  await expect(page.getByText("Shop")).toBeVisible();
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
      bottomBelowBoard: bottom.top >= boardRect.bottom - 1,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight
    };
  });
  expect(hudOverlap.topAboveBoard).toBe(true);
  expect(hudOverlap.bottomBelowBoard).toBe(true);
});

test("can complete the first authored level through real game resolution", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Clear all goods")).toBeVisible();
  await waitForNonBlankCanvas(page);

  const moves = [
    ["c_0_0", 0, "c_1_0", 0],
    ["c_0_1", 0, "c_1_0", 1],
    ["c_0_2", 0, "c_1_0", 2],
    ["c_0_0", 1, "c_1_1", 0],
    ["c_0_1", 1, "c_1_1", 1],
    ["c_0_2", 1, "c_1_1", 2],
    ["c_0_0", 2, "c_1_2", 0],
    ["c_0_1", 2, "c_1_2", 1],
    ["c_0_2", 2, "c_1_2", 2]
  ] as const;

  for (const [sourceCompartmentId, sourceCellIndex, targetCompartmentId, targetCellIndex] of moves) {
    await page.evaluate(
      (move) => window.__SHELF_SORT_TEST__?.move(move),
      { sourceCompartmentId, sourceCellIndex, targetCompartmentId, targetCellIndex }
    );
  }

  await expect(page.getByText("Level Complete")).toBeVisible();
  const state = await page.evaluate(() => window.__SHELF_SORT_TEST__?.state());
  expect(state?.levelEnd).toBe("win");
  expect(state?.objective.clearedProducts).toBe(9);
});

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
