# Density & Competitor Benchmark Roadmap

**Repo:** `doqendev/Sorting-Game`  
**Date:** 2026-06-14  
**Audience:** gameplay, level design, rendering, UI/UX, QA, product

---

## Executive verdict

The latest appeal pass made meaningful progress. The game now has icon HUD controls, tactile move/snap animation, triple-clear particles, audio/haptics services, animation telemetry, and a Puzzle Complete Drawer. That moves Shelf Sort 3D much closer to a modern mobile puzzle feel.

However, after playing the first levels and comparing the current board structure against popular shelf/goods sorting games, the biggest remaining issue is **board density**.

The current levels have too few visible shelves and too little visible item mass. The early game often feels like a toy demonstration of the mechanic rather than a full shelf-sorting puzzle. The genre expectation is a board filled with many compartments and many visible product decisions at once. Competitor screenshots commonly show 12-20+ shelf compartments in a single puzzle view, and some games show very high item-count objectives. Shelf Sort 3D currently generates boards around 6 or 9 visible compartments, with 3 columns hardcoded and many normal shelves sharing the same item pattern.

**The next dev pass should focus on making the puzzles look and feel like full supermarket shelf boards.** Add more shelves, more varied shelf layouts, more visible partial matches, more item volume, better spatial planning, and adaptive camera/layout support so the density remains readable on phones.

---

## Benchmark summary

### Shelf/goods sorting games

Visual references across shelf/goods sorting games show boards that are much denser than the current first levels:

- Several Goods Sort-style screenshots show tall supermarket-shelf grids with roughly 4-5 columns and 4-5 visible rows of compartments.
- Shelf Sort Puzzle-style screenshots show even early levels moving toward 3 columns by 4 rows, around 12 visible compartments.
- Goods Store / Goods Sort variants often show larger item goals and many objects on screen, with boards designed to feel like a packed store shelf rather than a small tutorial tray.

The most important takeaway is not that every level must use the same size. The takeaway is that the board must quickly graduate from a small tutorial into a dense, busy, satisfying shelf puzzle.

### 3D triple-match games

Triple Match 3D and Match Factory-style games are not shelf-grid games, but they teach the same market lesson: the player expects visual abundance. These games sell the appeal of sorting and clearing clutter, discovering hidden objects, using boosters, and completing a full board under time pressure. Shelf Sort 3D already added many of the right polish systems, but it still needs more visual problem space.

### Mainstream puzzle games

Royal Match and similar top mobile puzzle games demonstrate that players expect premium reward loops, chests, collections, events, and strong UI framing. Shelf Sort 3D has now made progress on the reward and UI layer. The board content must now catch up so the polished reward loop is attached to a puzzle that feels substantial.

---

## Current repo findings

### 1. The appeal pass is real progress

The current README states the build now includes tactile move/snap effects, triple-clear particles, hidden reveal beats, booster effects, a Puzzle Complete Drawer, centralized audio/haptics services, animation quality telemetry, and browser visual checks.

The current `GameApp.ts` also shows:

- icon-based map, pause, timer, currency, star, and booster buttons;
- `rewardOverlay` for the drawer flow;
- audio/haptics services;
- `isAnimating` and animation-safe move handling;
- analytics for first clear timing, move-to-clear ratio, invalid move rate, drawer dwell/skip, and animation quality.

The current `ThreeBoardView.ts` also shows:

- object registries by product/shelf/target;
- animation locking;
- `playResolution` for move, clear, reveal sequencing;
- triple clear chips, clear badges, burst particles, reward flights, reveal panels, and booster effects.

This is the right direction. Do not restart the feel pass. Build on it.

### 2. The visible board is structurally too small

The content generator currently creates levels with:

```js
const sourceRows = spec.options.sourceRows ?? 1;
const rows = sourceRows + 1;
const columns = 3;
```

That means:

- most early/default levels are `2 rows x 3 columns = 6 compartments`;
- levels with `sourceRows: 2` are `3 rows x 3 columns = 9 compartments`;
- hard levels still do not exceed 9 visible compartments;
- hidden layers add total products, but do not solve the lack of visible shelf density.

The generated level 1 file confirms `rows: 2` and `columns: 3`.

This is a major mismatch with the genre. A few sparse shelves can work for the first 1-2 tutorial levels, but the game needs to start looking like a real shelf puzzle very quickly.

### 3. The level generator repeats shelf patterns too much

Current normal shelf generation uses:

```js
front: isReserve ? reserveCells(spec, column) : spec.visible.map((skuId) => cell(skuId, spec))
```

This means normal shelves in the same row often start with the same three SKU pattern unless specifically modified. That makes the board feel artificial and shallow. Genre boards are usually dense mosaics of partial matches, blockers, empty spaces, and hidden opportunities.

### 4. Reserve shelves are too dominant relative to normal shelves

With a `2 x 3` level, one full row is reserve. That means 3 of 6 compartments are reserve shelves. In player perception, half the board can look like empty utility space instead of puzzle content. This is fine for a tutorial, but not for the normal loop.

### 5. The renderer can technically handle dynamic rows/columns, but the camera/layout is not yet tuned for dense boards

`ThreeBoardView` computes layout from the max row/column count, but the shelf gaps and orthographic camera settings are fixed. If the team simply raises rows/columns without layout work, shelves may become clipped, too small, or too hard to tap on phones.

Density requires a layout pass, not just a data pass.

---

## Required product direction

### New density target

The game should have a density curve like this:

| Level band | Visible compartments target | Board shape target | Purpose |
|---|---:|---|---|
| Level 1 | 6 | 2 x 3 | Teach the rule and first clear. |
| Level 2 | 6-9 | 2 x 3 or 3 x 3 | Confirm the rule and introduce empty movement. |
| Level 3 | 9 | 3 x 3 | First real puzzle board. |
| Levels 4-6 | 12 | 3 x 4 or 4 x 3 | Start looking like the genre. |
| Levels 7-10 | 12-15 | 3 x 4, 5 x 3, or irregular | Hidden reveal, reserve pressure, first blocker, first hard. |
| Levels 11-20 | 15-18 | 4 x 4, 3 x 5, irregular | Real shelf-sorting puzzle with multiple partial matches. |
| Levels 21-30 | 18-24 | 4 x 5, 5 x 4, irregular islands | Vertical-slice showcase and difficulty proof. |

These are visible compartments, not hidden layers. Hidden layers are valuable, but they cannot replace on-screen decision space.

### New item-count target

| Level band | Total product target | Clear target |
|---|---:|---:|
| Level 1 | 12-15 | 4-5 triples |
| Level 2 | 15-18 | 5-6 triples |
| Level 3 | 18-24 | 6-8 triples |
| Levels 4-6 | 24-36 | 8-12 triples |
| Levels 7-10 | 30-45 | 10-15 triples |
| Levels 11-20 | 42-60 | 14-20 triples |
| Levels 21-30 | 54-90 | 18-30 triples |

Current level 1 can remain short, but by level 4 the player should feel they are solving a real board, not clearing three small trays.

---

## Dev instructions

## P0 — Add board-density support to the content schema

Add explicit layout metadata instead of relying on `sourceRows` and hardcoded `columns = 3`.

### Add to level plan/spec

```ts
type BoardLayoutKind = "grid" | "pyramid" | "wide" | "islands" | "staggered";

interface DensityPlan {
  rows: number;
  columns: number;
  activeShelves: number;
  reserveShelves: number;
  emptySlots: number;
  hiddenDepth: number;
  layoutKind: BoardLayoutKind;
}
```

### Replace generator assumptions

Remove this as the primary layout model:

```js
const sourceRows = spec.options.sourceRows ?? 1;
const rows = sourceRows + 1;
const columns = 3;
```

Replace with:

```js
const density = densityForLevel(spec.level, spec.options.densityOverride);
const rows = density.rows;
const columns = density.columns;
const compartments = createCompartmentLayout(spec, density);
```

### Acceptance criteria

- Generator supports at least 6, 9, 12, 15, 16, 18, 20, and 24 visible compartments.
- Generator supports non-rectangular layouts by allowing inactive/null compartments.
- Level JSON explicitly records density metadata for QA and dashboards.
- Reserve shelves are configured by count/position, not automatically the entire last row.

---

## P0 — Stop repeating identical shelf fronts

Current repeated `spec.visible.map(...)` starts too many shelves with the same item sequence. Replace this with authored or generated distribution.

### Add shelf-pattern generation

Each level should build from a pool of triples, then distribute products across shelves with constraints.

Required constraints:

- no more than 2 identical items in a shelf at start unless intentionally creating an immediate clear/payoff;
- no shelf row should repeat the exact same SKU sequence unless the level intent says so;
- each SKU should appear in multiples of 3 across the full level;
- visible partial pairs should exist in multiple places;
- early levels should have one obvious first match, but later levels should have several competing options;
- reserve shelves should not visually dominate the board.

### Suggested function shape

```js
function createShelfContents(spec, density) {
  const triplePool = buildTriplePool(spec);
  const layout = createCompartmentLayout(spec, density);
  return distributeTriplesAcrossShelves(triplePool, layout, {
    immediateClearCount: spec.options.immediateClearCount ?? 1,
    pairCount: spec.options.pairCount ?? density.rows,
    emptySlotCount: density.emptySlots,
    blockerCount: spec.options.blockerCount ?? 0,
    avoidRepeatedFronts: true
  });
}
```

### Acceptance criteria

- Level 3+ has no duplicate normal-shelf front pattern unless explicitly annotated.
- QA report includes `duplicateFrontPatternCount`.
- QA report includes `visiblePairCount`, `visibleImmediateClearCount`, `emptySlotCount`, `reserveShelfRatio`, and `totalTriples`.

---

## P0 — Redesign the first 10 levels around density progression

The first 10 levels should be rebuilt, not simply padded.

| Level | Target board | Target purpose |
|---:|---|---|
| 1 | 2 x 3, 6 shelves | Very short tutorial, first-move clear, 4-5 triples. |
| 2 | 2 x 3 or 3 x 3 | More products, one reserve, still very readable. |
| 3 | 3 x 3 | First proper board; 6-8 triples. |
| 4 | 3 x 4 | Start genre-like density; introduce reserve planning. |
| 5 | 3 x 4 | Multiple pairs and competing moves. |
| 6 | 3 x 4 | First meaningful board with one blocker. |
| 7 | 3 x 4 or 4 x 3 | Hidden layer reveal with enough shelves to feel like discovery. |
| 8 | 4 x 4 | Combo objective with multiple clear paths. |
| 9 | 4 x 4 | Light blocker and reserve pressure. |
| 10 | 4 x 4 or 3 x 5 | First hard ceremony; 14-18 triples total. |

Do not make Level 1 hard. The issue is not tutorial simplicity; the issue is that the game does not graduate quickly enough from tutorial-board scale.

---

## P0 — Add adaptive board camera and shelf scaling

More shelves require the renderer to adapt.

### Required renderer work

- Derive camera bounds from rows, columns, shelf dimensions, and UI safe area.
- Scale shelf meshes slightly by density tier.
- Keep minimum tappable product target size on phones.
- Add per-density camera presets:
  - `small`: 6-9 compartments;
  - `medium`: 12-16 compartments;
  - `large`: 18-24 compartments.
- Add optional vertical board scroll only if tap readability cannot be preserved. Prefer fit-to-screen first.
- Add visual grouping for dense boards: aisle columns, shelf dividers, subtle row shadows.

### Suggested implementation direction

```ts
function cameraForBoard(rows: number, columns: number, viewport: { width: number; height: number }) {
  const boardWidth = (columns - 1) * COMPARTMENT_GAP_X + SHELF_WIDTH;
  const boardHeight = (rows - 1) * COMPARTMENT_GAP_Y + SHELF_HEIGHT;
  const aspect = viewport.width / viewport.height;
  const verticalFromHeight = boardHeight / 2 + SAFE_BOARD_MARGIN_Y;
  const verticalFromWidth = boardWidth / (2 * aspect) + SAFE_BOARD_MARGIN_X;
  return Math.max(verticalFromHeight, verticalFromWidth, MIN_VERTICAL);
}
```

### Acceptance criteria

- 3 x 4, 4 x 4, 3 x 5, 4 x 5, and 5 x 4 boards fit without clipping.
- Products remain readable on 320 px wide screens.
- Tap targets remain forgiving.
- Playwright screenshots cover at least 6, 12, 16, and 20 compartment layouts.

---

## P1 — Create irregular shelf silhouettes

Competitor boards often feel richer because the shelf shape is not just a tiny rectangular grid. Add variety while keeping rules simple.

Recommended layouts:

- `grid_3x4`
- `grid_4x4`
- `wide_5x3`
- `pyramid_1_3_5_3`
- `islands_left_right`
- `center_tower_with_side_reserves`
- `store_wall_4x5`

Inactive cells should still render as wall/background, not empty UI whitespace.

Acceptance criteria:

- At least 5 layout silhouettes are available by level 15.
- Layout silhouette is included in level metadata.
- QA screenshot sheet shows all layout families.

---

## P1 — Increase objective volume and visual mission pressure

The current UI and reward systems are now strong enough to support more substantial levels. Add objective volume to match denser boards.

Tasks:

- Introduce multi-target orders earlier.
- Show order cards with product icons and progress.
- Add dense-board objectives like:
  - collect 9 snacks;
  - clear 12 drinks;
  - clear 6 ribbon goods;
  - complete 3 shelf rows;
  - reveal 2 hidden shelf drawers;
  - achieve combo x3 on a dense board.

Acceptance criteria:

- Level 8+ should require at least 10 clears or a meaningful objective path.
- Level 15+ should usually require 14+ clears.
- Dense levels must still have solvable recovery space.

---

## P1 — Add density-specific boosters and UI affordances

With more shelves, boosters become more valuable and easier to understand.

Recommended changes:

- Hint: highlight the target pair/triple path across multiple shelves.
- Shuffle: animate across the whole shelf wall, not only a small center burst.
- Extra Shelf: add a visible side shelf or unlock a blocked reserve, not just internal space.
- Hammer: on dense boards, prioritize blocker/taped product clarity.
- Freeze Time: add a shelf-wide frost pulse so the player understands they gained planning time.

Acceptance criteria:

- Boosters visually scale to dense boards.
- Hint remains readable on 16+ shelf boards.
- Extra Shelf has obvious board impact.

---

## P1 — Update validation and dashboards

Add density-aware validation metrics.

Required fields:

```csv
levelId,rows,columns,activeShelves,normalShelves,reserveShelves,reserveShelfRatio,totalProducts,totalTriples,visibleProducts,hiddenProducts,visiblePairCount,visibleImmediateClearCount,duplicateFrontPatternCount,emptySlotCount,blockerCount,layoutKind,minTapTargetPx,estimatedBoardClutter,solverStatus,minSolutionMoves,averageBotMoves,botWinRate,deadEndProbability,humanReviewGrade,riskFlags
```

Rules:

- `reserveShelfRatio` should generally be below 35% after Level 3.
- `duplicateFrontPatternCount` should be 0 after Level 3 unless intentional.
- `visiblePairCount` should be at least 2 by Level 4, at least 4 by Level 8.
- `totalTriples` should follow the density curve.
- `minTapTargetPx` should remain above the agreed mobile threshold.

---

## P2 — Content roadmap after density pass

Only after density is fixed:

- Add more SKU families.
- Add seasonal shelves.
- Add themed shop/store skins.
- Add collection missions tied to dense boards.
- Add event boards with special layouts.
- Add more than 30 levels.

Do not create hundreds of sparse levels. Sparse levels will make the game feel like a prototype no matter how many exist.

---

## Dev acceptance checklist

Before the density pass is accepted:

- [ ] Level 1 is allowed to stay simple, but Level 3 has at least 9 visible compartments.
- [ ] Level 4 has at least 12 visible compartments.
- [ ] Level 8 has at least 16 visible compartments or a very strong 12-15 shelf irregular layout.
- [ ] Level 10 feels like a real dense puzzle, not a tutorial tray.
- [ ] No normal level after Level 3 has all normal shelves using the same front pattern.
- [ ] Reserve shelves are useful but do not visually dominate the board.
- [ ] 12, 16, 20, and 24 shelf layouts fit on mobile without clipping.
- [ ] Products remain readable at 320 px width.
- [ ] Tap targets remain forgiving on dense boards.
- [ ] Hidden layers are treated as bonus depth, not a replacement for visible shelves.
- [ ] QA dashboard includes density metrics.
- [ ] Playwright visual tests include dense-board screenshots.
- [ ] First-session playtesters describe the board as a full shelf puzzle by Level 4.

---

## Suggested implementation order

1. Add density metadata and layout generation.
2. Add adaptive camera/scale support for 12-24 compartments.
3. Rewrite first 10 level plans with density progression.
4. Replace repeated shelf-front generation with true distribution.
5. Add density validation metrics.
6. Add dense-board Playwright screenshots.
7. Tune early levels by playtest.
8. Add irregular layout silhouettes.
9. Expand objectives for denser boards.
10. Only then add more levels/content.

---

## Sources reviewed

- Current repo: `README.md`, `src/app/GameApp.ts`, `src/presentation/ThreeBoardView.ts`, `scripts/generate-content.mjs`, `public/data/levels_launch.json`, `src/styles.css`.
- Triple Match 3D on Google Play: https://play.google.com/store/apps/details?id=com.master.triple3d.find&hl=en
- Triple Match 3D on App Store: https://apps.apple.com/us/app/triple-match-3d/id1607122287
- Royal Match on App Store: https://apps.apple.com/us/app/royal-match/id1482155847
- Visual shelf-density references from public screenshots/search results for Goods Sort, Shelf Sort Puzzle, Goods Store, and Triple Goods-style games.
