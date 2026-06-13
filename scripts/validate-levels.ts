import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { validateLevel } from "../src/domain/solver";
import type { LevelConfig, ProductCatalog } from "../src/domain/types";

const dataDir = join(process.cwd(), "public", "data");
const publicDir = join(process.cwd(), "public");

const launchBundle = readJson<{ schemaVersion: 1; contentVersion: string; levels: LevelConfig[] }>("levels_launch.json");
const backlogBundle = readJson<{ schemaVersion: 1; contentVersion: string; levels: LevelConfig[] }>("levels_backlog.json");
const catalog = readJson<ProductCatalog>("product_catalog.json");
const source = readJson<{ schemaVersion: 1; source: Array<{ levelId: string; humanReview: unknown }> }>("level_sources.json");

const errors: string[] = [];
const warnings: string[] = [];

if (catalog.products.length !== 40) errors.push(`V2 vertical slice requires exactly 40 reviewed SKUs; found ${catalog.products.length}.`);
if (launchBundle.levels.length !== 30) errors.push(`V2 vertical slice requires exactly 30 authored launch levels; found ${launchBundle.levels.length}.`);
if (backlogBundle.levels.length !== 0) errors.push("V2 backlog must stay empty until the 30-level slice is validated.");
if (source.source.length !== launchBundle.levels.length) errors.push("Every launch level needs source authoring metadata.");

for (const product of catalog.products) {
  const assetPath = join(publicDir, product.assetAddress);
  if (!existsSync(assetPath)) errors.push(`Missing SKU asset ${product.assetAddress}`);
  if (!product.readability.smallScreenPass || !product.readability.colorblindSafe || !product.readability.hiddenPreviewPass) {
    errors.push(`SKU readability review failed for ${product.skuId}`);
  }
  if (product.readabilityScore < 5) warnings.push(`SKU ${product.skuId} has readability score below V2 target.`);
}

const report = [];
for (const level of launchBundle.levels) {
  const validation = validateLevel(level, 16000);
  level.validation = {
    solverStatus: validation.status,
    secondarySolverStatus: validation.secondarySolverStatus,
    solverNodes: validation.nodes,
    minSolutionMoves: validation.minSolutionMoves,
    averageBotMoves: validation.averageBotMoves,
    botWinRate: validation.botWinRate,
    deadEndProbability: validation.deadEndProbability,
    averageReservePressure: validation.averageReservePressure,
    revealCount: validation.revealCount,
    hiddenInformationRatio: validation.hiddenInformationRatio,
    timePressureRatio: validation.timePressureRatio,
    boosterFreeWinProbability: validation.boosterFreeWinProbability,
    autoClearRisk: validation.autoClearRisk,
    readabilityRisk: validation.readabilityRisk,
    humanReviewGrade: level.humanReview.grade,
    riskFlags: validation.riskFlags,
    lastValidatedAt: new Date().toISOString()
  };
  report.push({ levelId: level.levelId, ...level.validation });

  if (!validation.schemaValid) errors.push(`${level.levelId}: schema invalid`);
  if (!validation.productCountValid) errors.push(`${level.levelId}: product counts invalid`);
  if (validation.status !== "solved") errors.push(`${level.levelId}: primary solver ${validation.status}`);
  if (validation.secondarySolverStatus !== "solved") errors.push(`${level.levelId}: secondary solver ${validation.secondarySolverStatus}`);
  if (validation.autoClearRisk > 0.1) errors.push(`${level.levelId}: hidden queue auto-clear risk ${validation.autoClearRisk}`);
  if (validation.readabilityRisk > 0.2) errors.push(`${level.levelId}: readability risk ${validation.readabilityRisk}`);
  if (validation.botWinRate <= 0) errors.push(`${level.levelId}: no bot strategy completed`);
  if (level.humanReview.grade === "D" || level.humanReview.grade === "F") errors.push(`${level.levelId}: human review grade ${level.humanReview.grade}`);
}

writeJson("levels_launch.json", launchBundle);
writeJson("validation_report.json", { generatedAt: new Date().toISOString(), warnings, report });
writeFileSync(join(dataDir, "difficulty_dashboard.csv"), toCsv(report));

if (errors.length > 0) {
  console.error(errors.slice(0, 40).join("\n"));
  if (errors.length > 40) console.error(`...and ${errors.length - 40} more errors`);
  process.exit(1);
}

console.log(`Validated V2 vertical slice: ${launchBundle.levels.length} levels, ${catalog.products.length} SKUs, ${warnings.length} warnings.`);

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(join(dataDir, file), "utf8")) as T;
}

function writeJson(file: string, value: unknown): void {
  writeFileSync(join(dataDir, file), `${JSON.stringify(value, null, 2)}\n`);
}

function toCsv(rows: Array<Record<string, unknown>>): string {
  const header = [
    "levelId",
    "difficultyTier",
    "solverStatus",
    "secondarySolverStatus",
    "minSolutionMoves",
    "averageBotMoves",
    "botWinRate",
    "deadEndProbability",
    "averageReservePressure",
    "revealCount",
    "hiddenInformationRatio",
    "timePressureRatio",
    "boosterFreeWinProbability",
    "autoClearRisk",
    "readabilityRisk",
    "humanReviewGrade",
    "riskFlags"
  ];
  return `${header.join(",")}\n${rows
    .map((row) =>
      header
        .map((key) => {
          const value = row[key];
          return Array.isArray(value) ? `"${value.join("|")}"` : String(value ?? "");
        })
        .join(",")
    )
    .join("\n")}\n`;
}
