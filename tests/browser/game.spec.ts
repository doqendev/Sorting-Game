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
  await page.waitForTimeout(600);

  const image = await page.locator("canvas").screenshot();
  const png = PNG.sync.read(image);
  const stats = samplePixels(png);
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
