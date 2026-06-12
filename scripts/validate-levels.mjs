import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dataDir = join(process.cwd(), "public", "data");
const launch = JSON.parse(readFileSync(join(dataDir, "levels_launch.json"), "utf8"));
const catalog = JSON.parse(readFileSync(join(dataDir, "product_catalog.json"), "utf8"));
const themes = JSON.parse(readFileSync(join(dataDir, "themes.json"), "utf8"));
const backlog = JSON.parse(readFileSync(join(dataDir, "levels_backlog.json"), "utf8"));

const errors = [];
if (catalog.products.length < 200) errors.push(`Expected 200+ products, found ${catalog.products.length}.`);
if (themes.themes.length < 6) errors.push(`Expected 6+ themes, found ${themes.themes.length}.`);
if (launch.levels.length < 500) errors.push(`Expected 500+ launch levels, found ${launch.levels.length}.`);
if (backlog.levels.length < 1000) errors.push(`Expected 1000+ backlog levels, found ${backlog.levels.length}.`);

const productIds = new Set(catalog.products.map((product) => product.skuId));
const report = [];
for (const level of launch.levels) {
  const levelErrors = validateLevel(level, productIds);
  report.push({
    levelId: level.levelId,
    solverStatus: level.validation.solverStatus,
    productCountValid: !levelErrors.some((error) => error.includes("count")),
    schemaValid: levelErrors.length === 0,
    riskFlags: levelErrors.join("|")
  });
  errors.push(...levelErrors.map((error) => `${level.levelId}: ${error}`));
}

writeFileSync(join(dataDir, "validation_report.json"), `${JSON.stringify({ generatedAt: new Date().toISOString(), report }, null, 2)}\n`);

if (errors.length > 0) {
  console.error(errors.slice(0, 30).join("\n"));
  if (errors.length > 30) console.error(`...and ${errors.length - 30} more errors`);
  process.exit(1);
}

console.log(`Validated ${launch.levels.length} launch levels, ${catalog.products.length} SKUs, and ${themes.themes.length} themes.`);

function validateLevel(level, productIds) {
  const errors = [];
  if (level.schemaVersion !== 1) errors.push("invalid schemaVersion");
  if (!level.levelId) errors.push("missing levelId");
  if (!level.board || level.board.rows < 2 || level.board.columns < 2) errors.push("invalid board");
  if (level.board.compartments.length !== level.board.rows * level.board.columns) errors.push("compartment count mismatch");
  if (level.validation.solverStatus !== "solved") errors.push("solver not solved");
  const counts = new Map();
  for (const compartment of level.board.compartments) {
    if (compartment.front.length !== 3) errors.push(`${compartment.id} front must have 3 cells`);
    for (const layer of [compartment.front, ...compartment.hiddenLayers]) {
      if (layer.length !== 3) errors.push(`${compartment.id} layer must have 3 cells`);
      for (const cell of layer) {
        if (!cell.skuId) continue;
        if (!productIds.has(cell.skuId)) errors.push(`unknown sku ${cell.skuId}`);
        counts.set(cell.skuId, (counts.get(cell.skuId) ?? 0) + 1);
      }
    }
  }
  for (const [skuId, count] of counts.entries()) {
    if (count % 3 !== 0) errors.push(`${skuId} count ${count} is not multiple of 3`);
  }
  const emptyFrontCells = level.board.compartments.flatMap((compartment) => compartment.front).filter((cell) => !cell.skuId).length;
  if (emptyFrontCells < 3) errors.push("low reserve space");
  return errors;
}
