# Shelf Density Competitor Audit & Dev Instructions

_Date: 2026-06-14_  
_Repo: `doqendev/Sorting-Game`_  
_Audience: gameplay, level design, rendering, UI/UX, QA, product_

---

## Executive verdict

The latest build has made meaningful progress on feel: tactile move/snap effects, triple-clear particles, hidden reveal beats, booster effects, icon-based HUD, audio/haptics, a Puzzle Complete Drawer, expanded telemetry, visual tests, and PWA packaging. The next blocker is no longer only juice. The next blocker is **board density**.

The first levels still feel too empty for this genre. Popular shelf/goods sorting games usually show a dense wall of shelves, racks, compartments, and products on the same puzzle. Shelf Sort 3D currently shows a small tutorial board with too few active shelves, too few visible products, and too much empty reserve space.

The fix is not simply to add more hidden layers. Hidden layers increase total content, but they do not solve the immediate visual impression: the player opens the game and sees a sparse board. The fix is to increase the number of **visible active shelf compartments** while preserving readability, tap accuracy, and performance.

North star:

> The board should look like a full toy-supermarket shelf wall, not a small set of isolated shelves.

---

## Current-version progress acknowledged

The current version is much stronger than the earlier prototype. The README now lists 30 handcrafted launch levels, 40 readable SKU assets, tactile move/snap effects, triple-clear particles, hidden reveal beats, booster effects, a Puzzle Complete Drawer, centralized audio/haptics, expanded telemetry, visual verification, 320 px layout coverage, and PWA packaging.

The dev team should **not** restart the appeal pass. Keep the new systems. The next pass should focus on board density, level structure, renderer scalability, and density validation.

---

## Competitive benchmark findings

### What similar games show

Shelf/goods sorting and 3D matching games rely heavily on visual abundance. Their screens communicate:

1. A lot of objects to organize.
2. A dense shelf, rack, warehouse, or clutter field.
3. Many possible moves and visual targets.
4. A satisfying transformation from messy/full to cleared/tidy.
5. Rapid dopamine hits through many small clears.

Competitive references reviewed include:

- `Shelf Sort Puzzle Game`, which uses dense shelf screenshots and is actively updated in the app ecosystem.
- `Goods Sort` / supermarket shelf-sort style games, which frequently show shelf walls with many cubbies and dozens of visible goods.
- `Triple Match 3D`, which positions itself around sorting, matching, clearing clutter, hidden objects, boosters, events, and frequent updates.
- `Royal Match`, not a direct shelf-sort game, but a benchmark for reward density, chests, events, boosters, and polished mobile puzzle UI.

The important genre lesson is:

> A sparse shelf-sort board looks like a tutorial or prototype. A dense shelf-sort board looks like a real puzzle game.

---

## Current implementation evidence

### 1. The appeal layer improved

`README.md` says the latest version includes tactile move/snap effects, triple-clear particles, hidden reveal beats, booster effects, HUD, Puzzle Complete Drawer, and fail-reason-specific loss panels. That is the right direction.

### 2. The board generator still creates sparse layouts

The current content generator uses:

```js
const sourceRows = spec.options.sourceRows ?? 1;
const rows = sourceRows + 1;
const columns = 3;
```

This means:

- default levels are `2 rows x 3 columns = 6 compartments`;
- `sourceRows: 2` levels are `3 rows x 3 columns = 9 compartments`;
- the last row is always reserve;
- normal shelf fronts are generated from the same `spec.visible` array.

The early plans mostly pass exactly three visible SKUs. So the board is not just low-density; it also often repeats the same front pattern across multiple normal shelves.

### 3. Level 1 confirms the density issue

`public/data/levels_launch.json` shows `level_0001` as:

```json
"board": {
  "rows": 2,
  "columns": 3,
  "compartments": [...]
}
```

That is only **6 compartments** and **18 front cells**. Several cells are empty. The validation says the minimum solution is 3 moves. This is good for a first tutorial clear, but it is too small as the player-facing impression of the game.

### 4. The renderer is not ready for dense boards yet

`ThreeBoardView.ts` still uses fixed spacing and camera sizing:

```ts
const CELL_GAP = 1.08;
const COMPARTMENT_GAP_X = 3.9;
const COMPARTMENT_GAP_Y = 2.15;
```

The resize logic uses a fixed vertical camera size. Simply changing `columns` to 4 or 5 will either overflow, shrink too much, or make tap targeting unreliable unless the board layout system is refactored.

### 5. The domain model can support this

The domain `LevelConfig` already supports `board.rows`, `board.columns`, and an arbitrary list of compartments. `FRONT_CAPACITY = 3` should stay. The genre expects a shelf to complete when three matching goods are together. The change should be **more compartments**, not more cells per shelf.

---

## The core problem

The game currently has a strong moment-to-moment feel layer sitting on top of a board that is too small.

That creates four product problems:

1. **Low visual richness** — the board does not immediately communicate abundance.
2. **Low puzzle legitimacy** — six compartments and three-move solutions feel like onboarding exercises.
3. **Weak genre match** — players coming from shelf/goods sorting competitors expect fuller racks.
4. **Reduced dopamine frequency** — more visible shelves enable more pairs, near-triples, hidden reveals, combo opportunities, and mini-decisions.

---

## Density targets

### Hard rules

- Keep each shelf compartment at **3 front cells**.
- Increase the number of **visible shelf compartments**.
- Do not solve density only with hidden layers.
- Do not make everything tiny just to fit more shelves.
- Tap target overlays must remain generous.
- Visual density must increase gradually, but quickly.

### Level density ladder

| Level range | Target visible compartments | Suggested layout | Occupied front products | SKU/multiset guidance |
|---:|---:|---|---:|---|
| Level 1 | 8-9 | `2x4` or `3x3` | 12-15 | 3-4 SKUs, one guaranteed first clear |
| Level 2 | 9 | `3x3` | 15-18 | 4-5 SKUs, one obvious pair/triple setup |
| Level 3 | 9-12 | `3x3` or `3x4` | 18-24 | 5-6 SKUs, less empty reserve space |
| Levels 4-6 | 12 | `3x4` | 24-30 | 5-7 SKUs, reserve taught without sparse board |
| Levels 7-10 | 12-16 | `3x4` or `4x4` | 27-36 | hidden reveal, blockers, combo objectives |
| Levels 11-20 | 15-16 | `3x5` or `4x4` | 30-45 | full core-game density |
| Levels 21-30 | 16-20 if readable | `4x4`, compact `4x5`, or themed dense rack | 36-54 | hard objectives, hidden layers, blockers |

### Minimum acceptance thresholds

| Rule | Requirement |
|---|---|
| Post-level-5 shelf count | No ordinary level after level 5 should have fewer than 9 visible compartments. |
| Post-level-10 shelf count | No ordinary level after level 10 should have fewer than 12 visible compartments. |
| Post-level-15 shelf count | Normal/hard levels should target 15-16 visible compartments. |
| Empty front ratio, levels 1-5 | Maximum 35% empty front cells. |
| Empty front ratio, levels 6+ | Maximum 30% empty front cells unless the level is explicitly a reserve tutorial. |
| Duplicate shelf pattern ratio | After level 3, no more than one-third of normal shelves may share the exact same visible SKU pattern. |
| Tap target | Every product must have an invisible hit target equivalent to at least 44x44 CSS px on a 390 px wide phone. |
| Small phone readability | Dense levels must pass 320 px visual tests. |
| First clear | Level 1 should still produce a clear within the first 1-2 moves. |
| Visible spectacle | By level 5, a screenshot must look like a full shelf puzzle, not a mini tutorial. |

---

## Specific instruction: re-author the first 10 levels

The first 10 levels are the onboarding funnel. They should quickly teach the game while proving this is a real shelf sorter.

### Level 1

Current: 2x3, 6 compartments, 3-move solution.  
Target: 2x4 or 3x3, 8-9 compartments.

Requirements:

- Keep one guaranteed first-move clear.
- Show more shelves than the current build.
- Use 12-15 occupied products.
- Use 3-4 SKUs.
- Reserve/empty space should be visible but not dominate the board.
- If any shelf is decorative/locked, it should still visually contribute to a fuller shelf wall, but the preferred solution is real playable compartments.

### Level 2

Target: 3x3, 9 compartments.

Requirements:

- 15-18 occupied products.
- One obvious pair, one obvious near-triple.
- Teach moving to empty space without making half the board empty.

### Level 3

Target: 3x3 or 3x4.

Requirements:

- 18-24 occupied products.
- 5-6 SKUs.
- No identical row repetition.
- One clear within first 3 moves.

### Level 4

Target: 3x4.

Requirements:

- Teach reserve shelf use.
- At least 24 occupied products.
- Reserve should feel like a tool, not an empty bottom row.

### Level 5

Target: 3x4.

Requirements:

- First “real” puzzle impression.
- 24-30 occupied products.
- At least 6 SKUs.
- No repeated shelf-front template across all normal shelves.

### Level 6

Target: 3x4.

Requirements:

- First denser board with light pressure.
- Add hidden reveal or blocker, not both if it hurts clarity.
- Maintain at least 24 visible occupied products.

### Level 7

Target: 3x4.

Requirements:

- Hidden layer reveal should feel like discovery.
- 25-33% of normal shelves may have one hidden layer.
- Do not hide the main density behind the back layer.

### Level 8

Target: 3x4 or 4x4.

Requirements:

- Combo objective.
- Enough shelves to create meaningful combo planning.
- More than one possible near-triple on screen.

### Level 9

Target: 4x4 if renderer supports it; otherwise 3x4.

Requirements:

- First light blocker.
- The blocker should live inside a dense board, not reduce density.

### Level 10

Target: 4x4 or compact 3x5.

Requirements:

- First hard-level ceremony.
- 30+ visible occupied products.
- A memorable clear/reveal/combo sequence before the Puzzle Complete Drawer.

---

## Content-generator instructions

### Replace the fixed layout

Current:

```js
const sourceRows = spec.options.sourceRows ?? 1;
const rows = sourceRows + 1;
const columns = 3;
```

Target:

```js
const density = densityProfileFor(spec.level, spec.options);
const rows = density.rows;
const columns = density.columns;
const reserveSlots = density.reserveCompartments;
const occupiedFrontTarget = density.occupiedFrontTarget;
```

Suggested density profile:

```js
function densityProfileFor(level, options = {}) {
  if (options.layout) return options.layout;

  if (level === 1) {
    return {
      tier: "intro_fuller",
      rows: 2,
      columns: 4,
      reserveCompartments: 2,
      occupiedFrontTarget: 12,
      minUniqueSkus: 3,
      maxEmptyFrontRatio: 0.35
    };
  }

  if (level <= 3) {
    return {
      tier: "intro_dense",
      rows: 3,
      columns: 3,
      reserveCompartments: 2,
      occupiedFrontTarget: 18,
      minUniqueSkus: 4,
      maxEmptyFrontRatio: 0.35
    };
  }

  if (level <= 10) {
    return {
      tier: "standard",
      rows: 3,
      columns: 4,
      reserveCompartments: 3,
      occupiedFrontTarget: 27,
      minUniqueSkus: 6,
      maxEmptyFrontRatio: 0.30
    };
  }

  if (level <= 20) {
    return {
      tier: "full",
      rows: 4,
      columns: 4,
      reserveCompartments: 3,
      occupiedFrontTarget: 36,
      minUniqueSkus: 7,
      maxEmptyFrontRatio: 0.28
    };
  }

  return {
    tier: "hard_full",
    rows: 4,
    columns: 4,
    reserveCompartments: 2,
    occupiedFrontTarget: 42,
    minUniqueSkus: 8,
    maxEmptyFrontRatio: 0.25
  };
}
```

### Stop cloning the same front pattern into every normal shelf

Current normal shelf generation:

```js
front: isReserve ? reserveCells(spec, column) : spec.visible.map((skuId) => cell(skuId, spec))
```

This creates repeated fronts like `[A, B, C]`, `[A, B, C]`, `[A, B, C]`.

Replace this with authored/distributed shelf fronts.

Suggested approach:

1. Build a multiset of product instances in multiples of 3.
2. Place obvious tutorial pairs/triples first.
3. Distribute remaining singles/pairs across shelves.
4. Reserve a controlled number of empty cells.
5. Avoid duplicate shelf-front patterns.
6. Validate solvability and density.

Pseudo-API:

```js
function makeDenseBoard(spec, density) {
  const compartments = makeCompartmentGrid(density.rows, density.columns);
  markReserveCompartments(compartments, density.reserveCompartments, spec);
  const productPool = buildProductPool({
    skuIds: spec.skuPool,
    totalProducts: density.occupiedFrontTarget,
    multiplesOfThree: true
  });

  seedOpeningPattern(compartments, productPool, spec.openingPattern);
  distributeProducts(compartments, productPool, {
    maxDuplicateFrontPatterns: density.maxDuplicateFrontPatterns ?? 1,
    reserveEmptyBudget: density.reserveEmptyBudget,
    avoidImmediateAutoClearExceptTutorial: true
  });

  addHiddenLayers(compartments, spec, density);
  addBlockers(compartments, spec, density);

  return {
    rows: density.rows,
    columns: density.columns,
    compartments
  };
}
```

### Use SKU pools, not only 3 visible SKUs

Current level plans use `visible` as exactly 3 SKUs. For denser levels, use SKU pools and counts:

```js
plan(5, {
  intent: "First real shelf wall",
  layout: "standard_3x4",
  skuPool: ["cookie_pink", "milk_white", "banana_yellow", "wafer_teal", "smoothie_pink", "kiwi_brown"],
  productCounts: {
    cookie_pink: 6,
    milk_white: 6,
    banana_yellow: 3,
    wafer_teal: 3,
    smoothie_pink: 3,
    kiwi_brown: 3
  },
  reserveCompartments: 3,
  openingPattern: "one_near_triple_two_pairs",
  objectiveType: "clear_all"
});
```

---

## Renderer instructions

### Add a board layout system

Do not keep fixed constants as the only layout:

```ts
const CELL_GAP = 1.08;
const COMPARTMENT_GAP_X = 3.9;
const COMPARTMENT_GAP_Y = 2.15;
```

Create a layout calculator:

```ts
interface BoardLayoutMetrics {
  cellGap: number;
  compartmentGapX: number;
  compartmentGapY: number;
  productScale: number;
  shelfScale: number;
  cameraVertical: number;
  compactMode: "tutorial" | "standard" | "dense" | "ultra_dense";
}

function calculateBoardLayout(rows: number, columns: number, hostWidth: number, hostHeight: number): BoardLayoutMetrics {
  // Fit rows/columns while preserving 44px touch targets and SKU readability.
}
```

### Suggested layout tiers

| Tier | Compartments | Product scale | Visual treatment |
|---|---:|---:|---|
| `tutorial` | 6-9 | 1.00 | Current chunky shelves are acceptable. |
| `standard` | 10-12 | 0.86-0.92 | Smaller gaps, still individual shelves. |
| `dense` | 13-16 | 0.74-0.84 | Compact shelf wall, shared row/column frame. |
| `ultra_dense` | 17-20 | 0.66-0.76 | Only if 390/430 px screens pass readability. |

### Prefer a shelf wall over isolated mini-shelves

Competitor boards usually feel like a wall/rack, not isolated floating cubbies. For dense layouts:

- Render one large rack backing per board.
- Add horizontal shelf boards for each row.
- Add vertical dividers for columns.
- Treat compartments as cubbies inside the wall.
- Use individual target/product meshes inside each cubby.
- Keep reserve compartments visually distinct but integrated into the wall.

This allows more shelves without the board feeling cluttered with repeated wooden frames.

### Increase hit targets independently from visuals

The visible product can shrink in dense mode, but its raycast/target surface must not shrink equally.

Requirements:

- Add invisible hit planes per product/cell.
- Keep equivalent touch target at least 44x44 CSS px.
- Add Playwright checks for 320 px, 390 px, and 430 px widths.
- Track invalid/tap-miss rate by density tier.

---

## Validation instructions

Add density metrics to validation output and dashboard.

### New validation fields

```ts
interface DensityValidation {
  densityTier: string;
  rows: number;
  columns: number;
  compartmentCount: number;
  normalCompartmentCount: number;
  reserveCompartmentCount: number;
  frontCellCount: number;
  occupiedFrontCellCount: number;
  totalProductCount: number;
  uniqueSkuCount: number;
  emptyFrontRatio: number;
  hiddenLayerProductCount: number;
  duplicateFrontPatternRatio: number;
  visibleTriplesAtStart: number;
  nearTripleCountAtStart: number;
  firstClearExpectedMoves: number;
  densityGrade: "A" | "B" | "C" | "D" | "F";
}
```

### Density grade rules

| Grade | Meaning |
|---|---|
| A | Meets shelf count, product count, empty ratio, SKU variety, and readability thresholds. |
| B | Playable but slightly sparse or slightly repetitive. |
| C | Usable only for tutorial or special low-density mode. |
| D | Too sparse for normal gameplay. |
| F | Below genre expectations or unreadable. |

### Fail the build when

- Any non-tutorial level after level 5 has fewer than 9 compartments.
- Any non-tutorial level after level 10 has fewer than 12 compartments.
- Any normal/hard level after level 15 has fewer than 15 compartments unless explicitly exempted.
- Empty front ratio exceeds the threshold.
- Duplicate front pattern ratio exceeds threshold.
- Product tap-target tests fail at 320 px.
- Solver passes but density grade is D/F.

---

## Analytics instructions

Add these events/properties:

| Metric | Purpose |
|---|---|
| `board_density_profile` | Attach density tier to every level start and level complete. |
| `visible_compartment_count` | Correlate shelf count with retention and fail rate. |
| `occupied_front_cell_count` | Detect sparse boards. |
| `empty_front_ratio` | Detect too much reserve/empty space. |
| `duplicate_front_pattern_ratio` | Detect generated-looking boards. |
| `tap_miss_rate_by_density` | Ensure dense layouts remain playable. |
| `first_clear_seconds_by_density` | Ensure density does not slow onboarding too much. |
| `zoom_or_layout_tier` | Catch readability issues introduced by compact layout. |
| `density_grade` | Dashboard-level health signal. |

Add these to:

- `level_start`
- `level_complete`
- `level_fail`
- validation dashboard CSV/JSON
- visual QA report

---

## QA instructions

Create visual and interaction tests for each density tier.

### Required screenshot states

- Level 1 fuller intro board.
- 3x3 board.
- 3x4 board.
- 4x4 board.
- Dense board with hidden layers.
- Dense board with blocker.
- Dense board after selection.
- Dense board after triple clear.
- Dense board before Puzzle Complete Drawer.
- 320 px dense board.

### Manual review checklist

- Does the first screenshot look like a real shelf sorting game?
- Does the board feel full but not unreadable?
- Are products recognizable without zooming?
- Are valid targets obvious?
- Is reserve space useful but not visually dominant?
- Are there enough shelves for meaningful planning?
- Does the first clear happen quickly?
- Does the dense layout still support satisfying animations?
- Does the Puzzle Complete Drawer still feel like a reward after a larger puzzle?

---

## Implementation priority

### P0: Must do next

- [ ] Add density profiles to `scripts/generate-content.mjs`.
- [ ] Replace fixed `columns = 3` with per-level layout profiles.
- [ ] Re-author levels 1-10 with denser shelf counts.
- [ ] Stop repeating the same `spec.visible` front pattern across all normal shelves.
- [ ] Add density validation metrics and fail gates.
- [ ] Add dynamic board layout metrics to `ThreeBoardView.ts`.
- [ ] Test 3x3, 3x4, and 4x4 layouts at 320 px width.

### P1: Needed for genre parity

- [ ] Render dense layouts as a shared shelf wall/rack.
- [ ] Add compact/dense product scales with independent hit targets.
- [ ] Add density telemetry to level events.
- [ ] Add screenshot comparison page for density tiers.
- [ ] Rebalance timers and rewards after product count increases.
- [ ] Make reserve compartments feel integrated, not like a mostly empty bottom row.

### P2: Later polish

- [ ] Add themed dense shelf walls per chapter.
- [ ] Add cosmetic shelf skins.
- [ ] Add density-based event variants.
- [ ] Add player-facing “big shelf” milestone levels.
- [ ] Add optional camera micro-zoom on triple clear, not during normal play.

---

## Definition of done

This pass is complete when:

1. Level 1 no longer feels visually tiny.
2. By level 5, the board visibly resembles a genre-standard shelf sorting puzzle.
3. By level 10, the game has at least one dense 12-16 compartment puzzle that remains readable on mobile.
4. The renderer supports 3x3, 3x4, and 4x4 boards without clipping.
5. Density validation is part of `npm run check`.
6. The first 10 levels have explicit density profiles and authored product distributions.
7. QA screenshots prove the game looks dense, premium, and readable at 320 px.
8. User testing no longer produces the comment: “There are too few shelves.”

---

## Source notes

Reviewed current repo files:

- `README.md`
- `scripts/generate-content.mjs`
- `public/data/levels_launch.json`
- `src/presentation/ThreeBoardView.ts`
- `src/app/GameApp.ts`
- `src/domain/types.ts`
- `src/domain/board.ts`
- `src/styles.css`

External benchmark references:

- Shelf Sort Puzzle Game app listing and screenshot set.
- Goods Sort / goods shelf sorting screenshot references.
- Triple Match 3D app listings.
- Royal Match app listing for reward, event, and meta expectations.
