
---
title: "Shelf Sort 3D - Technical Product Specification"
subtitle: "A developer-ready blueprint for a modern mobile goods-sorting puzzle game"
author: "Prepared for Quim"
date: "2026-06-12"
version: "1.0"
---

# Shelf Sort 3D - Technical Product Specification

**Prepared for:** Quim  
**Document version:** 1.0  
**Date:** 2026-06-12  
**Primary deliverable:** A fully playable free-to-play mobile puzzle game inspired by the shelf/goods sorting genre, with original IP, data-driven live operations, scalable content production, fair monetization, and modern mobile retention systems.

> **Important legal/product position:** this project should use the genre pattern, not another game's assets, exact UI, exact level layouts, brand names, sounds, ad claims, or store copy. The goal is to build an original shelf-sorting puzzle with similar player appeal, not a clone.

---

## Contents

1. Executive summary
2. Research summary and competitive landscape
3. Product vision
4. Target audience and personas
5. Core gameplay specification
6. Boosters and power-ups
7. Level design and content system
8. Meta-game and progression
9. Economy and monetization
10. UX, UI, art, and audio specification
11. Technical architecture
12. Data schemas
13. Backend, services, and integrations
14. Analytics, telemetry, and A/B testing
15. Live operations plan
16. Production roadmap
17. Backlog epics and user stories
18. Performance and technical quality
19. QA plan
20. Compliance, privacy, and legal
21. Store, ASO, and user acquisition
22. Definition of done for a fully playable launch candidate
23. Immediate next steps for the development team
24. Reference links used for research
25. Appendices

---

## 1. Executive summary

The requested game is a portrait-mode mobile puzzle game where players rearrange 3D products on shelves until three identical visible products are grouped together and cleared. Each shelf compartment has a front layer of three interactable products and one or more hidden queue layers behind it. Hidden layers look disabled until the current front layer is moved or cleared; then the next layer slides forward and becomes playable. The screenshot reference shows the current meta clearly: timer pressure, level progression, combo multiplier, star currency, boosters, pause, and ad inventory.

The recommended product is a **hybrid-casual puzzle game** with a satisfying core loop, a light meta layer, extensive level content, rewarded ads, optional IAP bundles, seasonal events, and remote-configurable balancing. It should be built as a data-driven Unity project with a deterministic gameplay core, automated level validation, analytics instrumentation, remote configuration, and a content pipeline that lets designers produce and test hundreds of levels without engineering support.

Market evidence supports this direction. Goods Sort on Google Play currently presents the exact shelf/goods sorting loop, has 10M+ downloads, a 4.7-star rating, 496K reviews, ads, IAP, offline play, events/offers, combos, power-ups, thousands of levels, and a massive product collection. Match Factory! by Peak is a broader match-3D competitor with 10M+ downloads and 653K reviews on Google Play, using timed levels, boosters, offline play, events/offers, and optional IAP. Sensor Tower's 2025 mobile reports state that mobile gaming spend returned to growth, with strategy, puzzle, and action fueling the rebound, while its State of Gaming 2025 summary says IAP revenue, time spent, and sessions were up year over year and that hybrid-casual monetization adoption is rising. Unity's 2025 outlook also highlights hybrid-casual growth, rewarded video, and longer playable ad creatives as important mobile game trends. See the References section for all source links.

**Build target:** iOS and Android, portrait 9:16, short sessions, one-handed play, offline playable core, online for cloud save, events, ads, IAP, and remote configuration.

**Recommended engine:** Unity 6 LTS, C#, Addressables, URP, scriptable data assets, deterministic pure C# gameplay domain, Firebase/Unity Gaming Services/PlayFab-style backend services, ad mediation, and CI/CD.

**Launch target content:** 500 polished launch levels, 1,000+ total levels ready in pipeline, 200+ product SKUs, 6 shelf/room themes, 5 core boosters, 3 recurring events, daily reward, win streak, pass, piggy bank, starter/bundles, remove-ads pack, level analytics, difficulty analytics, crash reporting, and remote-tuned economy.

---

## 2. Research summary and competitive landscape

### 2.1 Genre definition

The genre is best described as **goods sorting / shelf sorting / triple-match 3D / organizing puzzle**. Its appeal comes from four overlapping fantasies:

1. **Tidying and organization satisfaction:** moving messy products into clean triples.
2. **Fast visual recognition:** spotting identical snacks, drinks, toys, fruit, cosmetics, tools, and household objects.
3. **Short strategic decisions:** using empty shelf space efficiently while anticipating hidden products.
4. **Light pressure:** timers, combos, streaks, and limited space convert a simple action into a repeatable challenge.

### 2.2 Competitor notes

| Competitor | Evidence from public listing | Practical design takeaways |
|---|---|---|
| **Goods Sort - Sorting Games** | Google Play lists 10M+ downloads, 4.7 rating, 496K reviews, ads, IAP, all-ages rating, offline play, events/offers, pair matching, supermarket theme, match-3 identical 3D items on shelves, combos, boosters, thousands of levels, product collection, stories, and seasonal content. | This is the closest reference. Core gameplay should include shelf compartments, triple clearing, hidden queue reveal, combos, boosters, seasonal updates, and offline play. The store page emphasizes both relaxation and challenge, so our design should balance zen satisfaction with timer tension. |
| **Match Factory!** | Google Play lists 10M+ downloads, 4.6 rating, 653K reviews, IAP, offline play, events/offers, timed levels, boosters, and 3D matching. | Strong proof that 3D object matching can scale. It is not shelf-specific, but it validates timed 3D object sorting, daily return language, booster use, and large-scale puzzle content. |
| **Sort Match: 3D Goods Puzzle** | App Store lists 4.8 rating, 8.5K ratings, free with IAP, age rating 4+, category Casual, supermarket match-3, 1,000+ levels, boosters/hints, online/offline, timed objectives, product unlocking, and IAP products such as bundles, coins, Rush Hour, and Match Pass. | Market meta includes pass products, small bundles, coins, time pressure, boosters, hints, unlockable products, and large level counts. The public review snippets show players appreciate rewarded ads more than forced ads. |
| **Goods Match 3D: Sorting Games** | App Store lists 4.6 rating, 5.3K ratings, IAP, timer, boosters/hints, skill card collections, missions, rewards, remove-ads pack, goods pass, gold packs, piggy bank-style product, and booster bundles. | Meta systems should include missions, collections, pass, remove ads, coin/gold packs, and booster bundles. The review snippets mention ad friction and timer difficulty spikes, so our design should use transparent ad frequency and fair level validation. |
| **Goods Match 3D - Sorting Games** | App Store listing describes shelves, common grocery items, putting three identical items on the same shelf so they disappear, clearing all shelves before the timer runs out, and strategic empty-space management. | This validates the exact front-of-shelf loop: move products, group triples, avoid running out of space, clear all items before the timer. It also highlights a possible accessibility gap: some players want less frantic or untimed play. |

### 2.3 Current mobile market implications

The product should be designed as **hybrid-casual**, not pure hyper-casual. Hyper-casual-style ads can still drive installs, but the game needs stronger retention and monetization depth: level progression, live events, economy, pass, collections, and IAP. Sensor Tower's public 2025 summaries state that mobile gaming spend climbed to $81B and grew 4% year over year, with strategy, puzzle, and action fueling the growth. Sensor Tower's State of Gaming 2025 summary says gaming IAP revenue grew 4%, time spent grew 7.9%, sessions grew 12%, casual games drove growth in the West, and hybrid-casual monetization adoption is rising. Liftoff's 2025 Casual Gaming Apps Report similarly notes that casual games now prioritize retention and sustainable revenue as much as scale, and that hybrid casual models are becoming more popular. Unity's 2025 perspective says hybrid-casual games are expected to dominate the mobile gaming ad landscape, with rewarded video and long-format playable creatives being especially relevant.

### 2.4 Player pain points observed in public review snippets

The genre has clear opportunities for differentiation:

- **Ad trust:** players dislike games that advertise no ads and later show forced ads. Use honest store copy, frequency caps, and a meaningful remove-ads purchase.
- **Timer accessibility:** timed pressure is engaging for many players but alienates others. Offer a Relax Mode, accessibility setting, or event variant that reduces or removes timer pressure while preserving monetization through optional rewards.
- **Glitch/unsolvable frustration:** no level should end with uneven item counts or impossible states. Every level must pass deterministic solver validation and bot simulation before release.
- **Input friction:** drag controls can be difficult on tablets, trackpads, or for players with motor challenges. Provide both drag-and-drop and tap-to-select/tap-to-place controls.

---

## 3. Product vision

### 3.1 Working title

**Shelf Sort 3D** is used as the internal working title. The final store title should be tested via ASO research and UA creative tests. Candidate positioning:

- Shelf Sort 3D: Goods Match
- Triple Shelf Sort
- Goods Shelf Quest
- SortMart 3D
- Tidy Aisles

Avoid names that are confusingly similar to existing products.

### 3.2 One-sentence pitch

A satisfying 3D goods-sorting puzzle where players organize supermarket shelves, clear triples, reveal hidden product batches, beat clever timed challenges, and unlock a growing world of stores, collections, boosters, and seasonal events.

### 3.3 Design pillars

**Pillar 1 - Instant readability**  
The player should understand every move opportunity within one second. Products must have strong silhouettes, clear category colors, and large tappable hit areas.

**Pillar 2 - Satisfying cleanup**  
Every match should feel good: snap, glow, bounce, pop, product vanish, coins/stars sparkle, haptic tap, combo feedback, and visible shelf order.

**Pillar 3 - Strategy through hidden queues**  
The disabled products behind the front layer create memory, planning, and tension. Players learn to clear front layers not only for current triples but also to expose useful future items.

**Pillar 4 - Fair challenge, not random punishment**  
Every level must be solvable without boosters. Timers and blockers may create pressure, but failures should feel caused by player decisions, not arbitrary generator output.

**Pillar 5 - Ethical retention**  
The game can be highly engaging without dark patterns. Use meaningful rewards, transparent ads, clear pricing, no fake scarcity, no fake multiplayer, and respectful push notifications.

---

## 4. Target audience and personas

### 4.1 Primary audience

- Mobile casual puzzle players aged 18-55.
- Players who like match-3, tile matching, sorting, hidden object, fridge-fill, closet organization, and ASMR cleanup games.
- Players who play in short breaks: commuting, waiting, pre-sleep, lunch breaks.
- Players comfortable with ads in free games if rewarded ads are useful and forced ads are not excessive.

### 4.2 Secondary audience

- Older casual players who like relaxing sorting but dislike high pressure.
- Players attracted by supermarket, shopping, home organization, and collection themes.
- Existing match-3D players looking for a shelf-based variant.

### 4.3 Personas

**The Fast Solver**  
Plays fast, wants timers, combos, streaks, hard levels, leaderboards, and meaningful booster decisions.

**The Relaxed Organizer**  
Enjoys tidying, product art, ASMR animations, and stress relief. Likely to churn if timer pressure or forced ads feel unfair.

**The Collector**  
Wants to unlock product sets, shelf themes, rooms, album cards, badges, and seasonal decorations.

**The Value Spender**  
Will buy remove ads, starter bundles, pass, piggy bank, and booster bundles if prices are clear and the game feels fair.

---

## 5. Core gameplay specification

### 5.1 Core loop

1. Player enters a level.
2. Board appears as a grid of shelf compartments.
3. Each compartment has three visible front cells and optional hidden layers behind them.
4. Player moves visible products between compartments to place three identical products into the same compartment.
5. Three identical products clear automatically.
6. Clearing or moving all three front products out of a compartment reveals the next hidden layer behind that compartment.
7. Player continues sorting until all required products are cleared or collected.
8. Player wins before the timer expires, earns rewards, and progresses to the next level/map node.
9. Player spends rewards on boosters, collections, pass progress, and meta renovations.

### 5.2 Reference screenshot decomposition

The provided screenshot shows these important elements:

- Portrait board with a wooden shelf theme.
- 5 rows x 3 shelf compartments visible, with one empty compartment used as strategic space.
- Each compartment contains up to three front products.
- Some products behind the front layer are disabled/previewed and only appear when the front three are moved.
- Top HUD includes level number, timer, star currency, pause, and combo multiplier.
- Bottom HUD includes boosters such as hammer, star/magic tool, time/freezing tool, and shuffle/refresh.
- Banner ad is visible below gameplay controls.

### 5.3 Terminology

| Term | Definition |
|---|---|
| **Board** | The full level play area, containing a grid of shelf compartments. |
| **Compartment** | One shelf cubby/slot that can hold a front layer of up to three products and a queue of hidden layers. |
| **Cell** | One of the three positions in a compartment's current front layer. |
| **Front layer** | The interactable set of three cells currently exposed in a compartment. |
| **Hidden layer / queue layer** | A future batch of products behind the front layer. It may be visually previewed but is disabled and not interactable. |
| **Product / SKU** | A matchable 3D item such as soda, chips, pear, toy, book, or household object. |
| **Triple** | Three identical products grouped in one compartment. A valid triple clears. |
| **Reserve space** | Empty cells or empty compartments used for maneuvering products. |
| **Booster** | A paid, earned, or ad-rewarded power-up that changes the board or timer. |
| **Combo** | Consecutive clears within a short window or without non-clearing moves, increasing score/reward feedback. |

### 5.4 Board model

The default board should use compartments arranged in a configurable grid. Launch progression should support at least these grid sizes:

| Stage | Grid | Front capacity | Hidden layers | Purpose |
|---|---:|---:|---:|---|
| Tutorial | 2x3 or 3x3 | 3 per compartment | 0 | Teach matching and movement. |
| Early | 3x3 or 4x3 | 3 per compartment | 0-1 | Teach empty-space planning and reveal. |
| Mid | 5x3 | 3 per compartment | 1-2 | Main gameplay similar to screenshot. |
| Late | 5x4 or 6x3 | 3 per compartment | 2-4 | High complexity, events, hard levels. |

Every compartment has:

```text
Compartment
- id: stable ID
- gridPosition: row, column
- frontCells[3]: cell states
- hiddenLayers[]: queue of product layers, each layer has 3 cells
- blocker: optional lock/frost/tape/crate/mystery state
- type: normal, reserve, locked, objective, event
```

### 5.5 Product model

A product is represented by a stable SKU ID. The visual prefab must not be used as gameplay identity because skins, seasonal variants, and localization can change.

```text
ProductSKU
- skuId: "chips_blue_01"
- displayNameKey: "sku.chips.blue"
- category: snack | drink | fruit | toy | household | sport | stationery | seasonal
- silhouetteClass: tall | round | flat | bottle | pouch | box | toy
- rarity: common | uncommon | rare | seasonal
- prefabAddress: Addressables key
- iconAddress: UI icon key
- unlockLevel: integer
- colorTags: [blue, yellow]
- sizeClass: small | medium | large
- readabilityScore: 1-5
```

### 5.6 Input modes

The game must support two input modes from day one.

**Drag mode**

- Press on an interactable visible product.
- Product lifts, scales up slightly, and casts a soft shadow.
- Valid target cells highlight.
- Release over target to move.
- Release outside target to snap back.

**Tap mode**

- Tap visible product to select.
- Valid targets highlight.
- Tap target cell or compartment to move.
- Tap selected product again to cancel.
- Optional smart target: if player taps a product and then taps a compartment with matching products and empty cells, the product auto-snaps into the best cell.

Tap mode is important for accessibility and for players using tablets, emulators, Mac App Store, or trackpads.

### 5.7 Movement rules

Baseline movement rules:

1. Only products in front layers are selectable.
2. Products in hidden layers are never selectable until revealed.
3. A product may move only to an empty front cell in an unlocked compartment.
4. The target compartment must not be full.
5. No direct swapping in the baseline mode; swaps can be introduced later as a booster or event mechanic.
6. After a move, run match detection on the source and target compartments.
7. If a front layer becomes empty and the compartment has hidden layers, reveal the next hidden layer.
8. Movement should not be allowed while match/reveal animations are resolving unless the game is explicitly designed for high-speed queueing.

Optional advanced movement rule for better feel:

- **Smart stacking:** if a target compartment already contains one or two products of the same SKU and at least one empty cell, dropping that SKU anywhere in the compartment auto-places it into the nearest empty cell.

### 5.8 Match detection

A compartment has a valid triple when all three front cells are occupied, none are blocked, and all three products share the same `skuId`.

```pseudo
function TryResolveCompartment(compartment):
    if compartment.blocker.preventsMatch:
        return false
    if any cell in compartment.frontCells is empty:
        return false
    sku = compartment.frontCells[0].skuId
    if all cells have skuId == sku:
        ResolveTriple(compartment, sku)
        return true
    return false
```

### 5.9 Match resolution sequence

Use a consistent animation sequence so the game feels polished and readable:

1. Lock input.
2. Products pulse and outline for 100-150 ms.
3. Products move toward center of compartment or pop upward.
4. Products vanish with particles and sound.
5. Score/coins/combo text spawns.
6. Front cells become empty.
7. If hidden queue exists, reveal next layer.
8. Re-check any affected objectives.
9. Unlock input.

Total target time: 350-650 ms. Advanced players should be able to tap through win panels, but core match feedback must not be skipped entirely.

### 5.10 Hidden queue/reveal system

This is the defining mechanic from the screenshot and must be implemented cleanly.

**Data behavior**

- Each compartment has a FIFO queue of hidden layers.
- Each hidden layer has exactly three cell entries by default, but future variants may allow blocked/empty cells.
- Only the first hidden layer should be previewed visually by default.
- The previewed layer is disabled and cannot be interacted with.
- When all three front cells are empty, pop the next layer from the queue and assign it as the new front layer.
- If more queue layers remain, update the disabled preview behind the new front layer.

**Visual behavior**

- Hidden preview opacity: 25%-45%.
- Hidden preview scale: 92%-96%.
- Hidden preview z-depth: behind the front cells.
- Hidden preview material: dimmed, grayscale, or soft shadowed.
- Hidden preview collider: disabled.
- Reveal animation: slide forward, brighten, scale to 100%, enable colliders after animation.

**Design behavior**

- Early levels show exact hidden previews.
- Later levels can use silhouette/mystery previews as a difficulty modifier.
- Hard levels can show only the first hidden item of the next layer or hide the layer until revealed.
- The player should never feel that hidden reveals are random. The game must teach that front clearing reveals the next batch.

### 5.11 Win and loss conditions

Default win condition:

- All required products are cleared or all shelf compartments and hidden queues are empty.

Default loss condition:

- Timer reaches zero before objectives are complete.

Optional loss/stalemate condition:

- No legal moves remain and no booster/revive can resolve the state. This should be rare. Prefer offering a shuffle or extra slot before declaring loss.

### 5.12 Timer and scoring

Timer should create pressure but not dominate the early experience.

| Level range | Timer behavior | Design intent |
|---|---|---|
| 1-5 | No timer or generous hidden timer | Teach without stress. |
| 6-20 | Visible timer, generous | Introduce urgency. |
| 21-100 | Timer based on expected move count | Main tension. |
| 100+ | Timer varies by difficulty tier | Monetization and mastery. |
| Hard/Super Hard | Tight timer with better rewards | Booster demand and replay challenge. |

Score can be secondary. In this genre, players care more about level progression, wins, combos, and rewards. Use scoring mainly for feedback, events, and leaderboards.

Suggested score formula:

```text
baseScore = clearedTriples * 100
comboBonus = sum(comboIndex * 20 per clear)
timeBonus = remainingSeconds * 10
boosterPenalty = boostersUsed * 50
finalScore = baseScore + comboBonus + timeBonus - boosterPenalty
```

### 5.13 Combo system

Combos create satisfying momentum and increase perceived skill.

Recommended combo rules:

- Combo starts at x1 after first clear.
- Combo increments when another triple clears within `comboWindowSec` or within `maxNonClearingMoves`.
- Initial values: `comboWindowSec = 2.5`, `maxNonClearingMoves = 1`.
- Combo resets on timeout, undo, shuffle, or incorrect/miscellaneous move.
- Combo UI appears under timer as in the screenshot.
- Combo milestones grant micro rewards at x3, x5, x8, x10.

### 5.14 Tutorial design

Tutorial should be playable, not text-heavy.

| Step | Level | Teaching moment | Required implementation |
|---|---:|---|---|
| 1 | 1 | Drag/tap a product to complete a visible triple. | Hand pointer, target highlight, input lock to tutorial action. |
| 2 | 2 | Use an empty compartment as reserve space. | Show one move that clears space. |
| 3 | 3 | Hidden layer appears after front layer empties. | Show disabled products behind; reveal animation. |
| 4 | 4 | Timer appears. | Explain quickly with one bubble. |
| 5 | 5 | Combo feedback. | Trigger easy chain. |
| 6 | 8 | Booster hint. | Give one free Hint. |
| 7 | 12 | Lose/revive. | Teach rewarded revive or coin revive after first natural fail. |

Tutorial copy should be minimal and localized. Avoid blocking the player with excessive pop-ups.

---

## 6. Boosters and power-ups

Boosters must solve real pain points, be easy to understand, and be integrated into level design. They should be earnable, purchasable, and sometimes ad-rewarded.

### 6.1 Launch boosters

| Booster | Player-facing name | Effect | Primary use case | Monetization role |
|---|---|---|---|---|
| Hint | Hint | Highlights a useful move based on solver heuristic. | Player is stuck. | Low-cost frequent booster; rewarded ad option. |
| Shuffle | Shuffle | Reassigns visible products while preserving solvability and hidden queues. | Board is messy or nearly stuck. | High-value booster; fail recovery. |
| Hammer | Clear One | Removes one selected visible product or sends it to matching collection. | One product blocks a match. | Tactical booster; bundle anchor. |
| Freeze Time | Freeze | Pauses timer for 10-15 seconds or adds 30-60 seconds. | Timer pressure. | Strong rewarded ad/revive placement. |
| Extra Slot | Extra Shelf | Adds a temporary empty compartment or cell for the level. | Space pressure. | Premium booster for hard levels. |

### 6.2 Future boosters

- **Magnet:** pulls matching products into one compartment if legal.
- **Vacuum:** clears all visible products of a chosen SKU if at least one triple exists in total.
- **Reveal:** temporarily makes hidden layers brighter or shows all next hidden layers.
- **Undo:** reverses the last move. Can be a basic free feature or a monetized assist depending on market tests.
- **Auto Sort:** resolves one guaranteed triple automatically.

### 6.3 Booster implementation details

Boosters should use command objects so they can be validated, animated, undone when appropriate, and recorded for analytics.

```pseudo
interface IBoosterCommand:
    CanExecute(BoardState state, BoosterContext context) -> bool
    Preview(BoardState state, BoosterContext context) -> BoosterPreview
    Execute(BoardState state, BoosterContext context) -> BoosterResult
    AnalyticsPayload() -> map
```

The game should distinguish between:

- **Pre-level boosters:** selected before level starts, e.g., +1 extra shelf, +15 seconds.
- **In-level boosters:** used during gameplay, e.g., Hint, Hammer, Shuffle, Freeze.
- **Revive boosters:** offered after failure, e.g., +60 seconds, clear blockers, extra shelf.

### 6.4 Booster economy safeguards

- Every level must be solvable without boosters.
- Booster use should reduce friction, not be mandatory.
- Avoid sudden difficulty spikes designed only to drain boosters.
- Monitor `booster_used_per_attempt`, `fail_without_booster_rate`, and `post_booster_win_rate` per level.

---

## 7. Level design and content system

### 7.1 Level objectives

Launch with these objective types:

1. **Clear All:** remove every product from front and hidden layers.
2. **Collect Orders:** collect a specified number of target SKUs or categories.
3. **Clear Special Products:** clear product SKUs with badges, ribbons, or frozen status.
4. **Combo Target:** achieve a combo milestone at least once.
5. **Time Challenge:** clear all with a tighter timer for bonus rewards.

Objective data:

```json
{
  "objectiveType": "clear_all",
  "targets": [],
  "timerSec": 180,
  "starThresholds": { "three": 60, "two": 25, "one": 0 }
}
```

### 7.2 Level difficulty levers

Use data-driven levers, not hard-coded difficulty.

| Lever | Easier | Harder |
|---|---|---|
| Board size | More empty cells, fewer compartments | Larger grid, fewer reserve cells |
| SKU count | Fewer distinct products | More visually similar SKUs |
| Hidden depth | No or one hidden layer | Multiple hidden layers |
| Preview clarity | Exact bright preview | Dim, silhouette, mystery preview |
| Timer | More seconds per expected move | Less time per expected move |
| Blockers | None | Locks, frost, tape, mystery products |
| Objective | Clear all | Target orders plus blockers |
| Product readability | Distinct colors/shapes | Similar shapes/colors |

### 7.3 Difficulty tiers

| Tier | Frequency | Expected unboosted win rate after tuning | Reward modifier | Use |
|---|---:|---:|---:|---|
| Normal | Most levels | 60%-80% | 1.0x | Main progression. |
| Hard | Every 5-7 levels after level 30 | 35%-55% | 1.5x | Booster and skill moments. |
| Super Hard | Every 15-20 levels after level 80 | 20%-35% | 2.0x | Event and pass progress spikes. |
| Relax | Optional mode/events | 80%+ | Lower rewards | Accessibility and stress-free play. |

These percentages are initial soft-launch targets, not universal truths. Replace them with observed data once test markets are live.

### 7.4 Level progression plan

| Level range | New content | Design goal |
|---|---|---|
| 1-10 | Basic triples, reserve space, no blockers | Teach core loop. |
| 11-25 | Hidden queue preview | Teach reveal planning. |
| 26-50 | Timer pressure, combo rewards | Establish main loop. |
| 51-80 | First blockers, missions | Add variety. |
| 81-120 | Hard/Super Hard badges | Introduce challenge spikes. |
| 121-200 | Collections, events, new shelves | Retention depth. |
| 201-500 | Mixed mechanics | Launch depth. |
| 501+ | Seasonal and generated/curated levels | Live service longevity. |

### 7.5 Obstacles and blockers

Launch blockers should be simple and readable.

| Blocker | Behavior | Tutorial note |
|---|---|---|
| Tape | Product cannot move until adjacent or same-compartment clear occurs. | "Clear nearby goods to remove tape." |
| Frost | Product is visible but disabled until thawed by match/booster. | "Frozen goods need help." |
| Mystery Bag | Product identity is hidden until moved or revealed by booster. | "Move it to discover." |
| Locked Shelf | Compartment disabled until a key product is cleared. | "Clear keys to unlock shelf." |
| Crate | Occupies one cell; Hammer or adjacent clear removes it. | "Break crate to free space." |

Do not introduce too many blockers at launch. The most important mechanic is hidden layer planning.

### 7.6 Level generator requirements

The level pipeline should support both handcrafted and generated levels. Designers should be able to hand-edit generated levels.

**Generator goals**

- Guarantee product counts are multiples of three unless objective rules explicitly allow otherwise.
- Guarantee every level is solvable without boosters.
- Guarantee hidden queues reveal in a valid order.
- Rate difficulty before designer review.
- Prevent visually confusing SKU clusters in early levels.
- Export deterministic JSON with a `seed` for reproducibility.

**Solution-first generation approach**

1. Choose a difficulty profile: board size, timer, SKU count, hidden depth, blockers, reserves.
2. Choose SKU pool from unlocked product catalog.
3. Generate a list of triple groups. Each group is three identical products.
4. Build a valid solution sequence forward from an empty or controlled board.
5. Reverse-scramble the sequence into an initial board state with hidden queues.
6. Validate with deterministic solver.
7. Run random bot simulations to estimate fail rate.
8. Save level if it meets difficulty targets; otherwise mutate and retry.

**Alternative pragmatic approach**

For the first 200 levels, handcraft or heavily curate levels using a visual editor. Use the generator mainly for suggestions and validation. This reduces early product risk because level feel matters more than raw volume.

### 7.7 Solver validation

The solver does not need to be as smart as a human, but it must find at least one valid completion path and detect impossible states.

Solver strategy:

- Represent board state compactly using SKU IDs, empty cells, blockers, and queue indexes.
- Generate legal moves from each visible product to each empty target cell.
- Prioritize moves that complete triples, create pairs, free front layers, and reveal helpful hidden layers.
- Use A* or beam search with a node limit.
- Hash states to avoid loops.
- Return `solved`, `unsolved`, or `timeout_unknown`.
- Levels with `timeout_unknown` should not ship unless manually reviewed and confirmed.

Pseudo-code:

```pseudo
function ValidateLevel(level):
    initial = BuildState(level)
    queue = PriorityQueue()
    queue.push(initial, priority=Heuristic(initial))
    visited = HashSet()
    nodes = 0

    while queue not empty and nodes < MAX_NODES:
        state = queue.pop()
        if IsWin(state):
            return Solved(path=state.path, nodes=nodes)
        if Hash(state) in visited:
            continue
        visited.add(Hash(state))
        moves = GenerateLegalMoves(state)
        moves.sortBy(MoveHeuristic)
        for move in moves.take(BEAM_WIDTH):
            next = ApplyMoveAndResolve(state, move)
            queue.push(next, priority=Heuristic(next))
        nodes += 1

    return UnknownOrUnsolved(nodes=nodes)
```

### 7.8 Level editor requirements

Designers need a visual editor inside Unity or as a lightweight web tool.

Minimum editor features:

- Create/edit grid dimensions.
- Add/remove compartments.
- Fill front layers and hidden layers from SKU palette.
- Toggle hidden preview style.
- Place blockers.
- Configure timer and objectives.
- Run solver validation.
- Run 100 random bot attempts.
- Display difficulty metrics.
- Show product count warnings.
- Export/import JSON.
- Capture level thumbnail for internal review.
- Batch validate selected levels.

Difficulty metrics shown in editor:

```text
- Product triples: 34
- Distinct SKUs: 16
- Hidden layers: 21
- Empty cells at start: 5
- Solver nodes: 4,822
- Minimum solution moves: 58
- Estimated average player moves: 92
- Timer seconds per expected move: 2.9
- Bot win rate: 46%
- Risk flags: Low reserve space, similar SKU cluster, late reveal dependency
```

---

## 8. Meta-game and progression

The core puzzle can retain users for a while, but modern mobile performance usually requires meta depth. Keep meta lightweight at first; do not overbuild RPG systems before validating the core.

### 8.1 Player progression

- Linear level map with chapters.
- Every chapter represents a store aisle or room: snacks, drinks, toys, sports, plants, bakery, cosmetics, tools, seasonal.
- Stars earned from levels unlock chapter milestones and cosmetic renovations.
- Player level increases with XP from level wins and events.
- New product categories unlock every 10-20 levels.

### 8.2 Collection album

A collection system fits the product/SKU fantasy.

**System:** players collect product cards or stickers by winning levels, opening chests, completing daily orders, events, and pass rewards.

**Album structure:**

- Product category pages: Snacks, Drinks, Fruit, Toys, Sports, Home, Seasonal.
- Each page has 9-12 collectible items.
- Completing a page grants coins, boosters, shelf skin, or profile frame.
- Seasonal albums reset or archive.

**Avoid:** paid randomized loot boxes that require odds disclosure and may complicate compliance. If randomness is monetized, disclose odds clearly and follow platform/country rules.

### 8.3 Store renovation meta

Use stars to renovate a store/home environment:

- Clean a messy supermarket.
- Rebuild aisles.
- Add shelves, decorations, signs, lighting, and product displays.
- Unlock small story beats with friendly characters.

Keep story optional and skippable. The target genre is puzzle-first.

### 8.4 Events

Launch with three recurring event types:

| Event | Duration | Core mechanic | Reward |
|---|---:|---|---|
| Daily Order | 24 hours | Collect target categories from normal levels. | Coins, boosters, album cards. |
| Weekend Rush | 48-72 hours | Timed score race with fair cohorts. | Badge, shelf skin, pass XP. |
| Treasure Shelves | 3-7 days | Win streak opens chests on a path. | Boosters, coins, seasonal products. |

Post-launch events:

- Seasonal shelf themes: soccer, summer, Halloween, winter, Lunar New Year.
- Team chest: players contribute wins.
- Limited-time hard challenge tower.
- Relax week: no-timer puzzles with lower rewards.

### 8.5 Daily reward and streaks

- 7-day calendar with escalating rewards.
- Day 7 chest includes booster choice.
- Win streak grants temporary pre-level boosters.
- Losing a level breaks streak unless player uses a revive. This should be tuned carefully to avoid feeling punitive.

### 8.6 Battle pass / Match pass

Competitors use pass-style IAP. Recommended implementation:

- Free and premium tracks.
- XP from level wins, daily orders, event tasks.
- Premium pass grants boosters, coins, exclusive shelf skin, seasonal product variants, and no forced interstitials during the pass period only if legally/store-policy safe and clearly stated.
- Initial pricing tests: $4.99 and $9.99 equivalent.
- Duration: 14 or 28 days.

### 8.7 Social and leaderboards

Do not build heavy social in MVP unless the team already has backend capacity. Start with:

- Anonymous profile.
- Friendless event cohorts.
- Country/global leaderboard for event points.
- Optional Apple Game Center / Google Play Games achievements.

Post-MVP:

- Teams/clubs.
- Team chest.
- Send/receive lives or boosters.

---

## 9. Economy and monetization

### 9.1 Currency model

| Currency | Earned from | Spent on | Notes |
|---|---|---|---|
| Coins | Level wins, chests, daily reward, ads, events | Boosters, revive, extra time | Primary soft currency. |
| Stars | Level performance, chapter milestones | Renovation, chapter unlocks | Prestige/progression currency. |
| Gems | IAP, rare event rewards | Premium boosters, pass skips, cosmetics | Optional hard currency; can be omitted for simpler MVP. |
| Pass XP | Level wins/events | Pass track progression | Reset per season. |
| Collection Cards | Chests/events/pass | Album completion | Avoid paid randomization unless odds are disclosed. |

### 9.2 Reward flow

Level win reward:

```text
baseCoins = 20 + levelIndex * 0.2 capped by tier
starReward = 1-3 based on remaining time / performance
comboBonusCoins = min(maxCombo * 2, 30)
firstTryBonus = 10 coins or pass XP
eventProgress = objective-dependent
```

Win panel options:

- Claim base rewards.
- Watch rewarded ad to double coins.
- Show pass progress.
- Show next renovation unlock if relevant.

### 9.3 Ad monetization

Use hybrid monetization. Ads should be technically robust, frequency-capped, and honest.

**Rewarded video placements**

- Continue after timer failure: +60 seconds.
- Double win rewards.
- Free daily booster in shop.
- Unlock one extra slot for a hard level attempt.
- Reveal hint when stuck.
- Claim event chest bonus.

**Interstitial placements**

- After level win, not before gameplay.
- After retry loop only with frequency cap.
- No interstitials during first 5-10 levels.
- Minimum 90-120 seconds between interstitials.
- Suppress interstitials after rewarded video within a cooldown window.
- Remove Ads purchase removes forced interstitials and banners, but not optional rewarded video.

**Banner placements**

- Menu, shop, map, and optionally below gameplay controls if safe.
- Avoid placing banners close to high-frequency touch targets.
- Use adaptive banners and safe-area padding.
- The screenshot reference has a bottom banner, but gameplay controls are close; test accidental click rate and retention impact.

### 9.4 IAP product catalog

Competitor App Store listings show common IAPs such as remove-ads pack, goods/match pass, piggy bank/gold products, coin packs, beginner bundles, advanced/deluxe bundles, and booster packages. Recommended launch catalog:

| Product | Price test | Contents | Purpose |
|---|---:|---|---|
| Starter Pack | $0.99-$1.99 | Coins, 1 each booster, no forced ads for 24h | First purchase conversion. |
| Remove Ads | $4.99-$6.99 | Removes banners/interstitials permanently | Trust/value anchor. |
| Small Booster Pack | $2.99 | 3 Hint, 2 Hammer, 1 Freeze | Low-friction purchase. |
| Value Bundle | $6.99-$9.99 | Mixed boosters, coins, event progress | Mid-tier ARPPU. |
| Deluxe Bundle | $12.99-$19.99 | Larger boosters, premium cosmetic | High-value purchase. |
| Piggy Bank | $2.99-$4.99 | Unlock accumulated coins | Common casual monetization. |
| Match Pass | $4.99-$9.99 | Premium track rewards | Recurring revenue. |

Do not launch with too many products. Use remote config to test price points and pack contents by region.

### 9.5 Economy balancing principles

- First purchase should happen because the game feels valuable, not because the player is trapped.
- Rewarded ads should feel optional and useful.
- Coins should be scarce enough to matter but not so scarce that every hard level feels paywalled.
- Boosters should be visible early, but the game should not require purchases in early progression.
- Remove Ads must be honored precisely.

### 9.6 Ethical monetization guardrails

- No fake discount timers.
- No misleading "no ads" promise if forced ads exist.
- No paid loot box without odds disclosure and legal review.
- No targeting children with personalized ads.
- No blocking core progression behind purchases.
- Always validate IAP server-side before granting durable goods.

---

## 10. UX, UI, art, and audio specification

### 10.1 Visual style

Recommended style: bright, toy-like, rounded, high-contrast 3D products with clean shelf environments. Products must be recognizable at small size. Avoid overly realistic grocery brands to prevent IP/trademark issues.

Art direction:

- Rounded low-poly or stylized 3D.
- Saturated but not noisy colors.
- No real brands or real product packaging.
- Clear silhouettes for similar colors.
- Consistent scale categories.
- Soft shadows and ambient occlusion.
- Shelf material variants: wood, pastel, metal, bakery, toy store, fridge, sports store, holiday.

### 10.2 Product readability rules

Each SKU must pass a readability review:

- Distinguishable at 64x64 icon size.
- Distinguishable in peripheral vision on a 6-inch phone.
- Not too similar to another SKU unlocked in the same level range.
- Uses shape + color + label/symbol; not color only.
- Avoid thin parts that alias on low-end devices.

### 10.3 UI layout

Portrait 9:16 layout:

```text
Top safe area
- Level badge
- Timer
- Currency / stars
- Pause/settings
- Combo badge below timer when active

Center
- Shelf board, scalable to device aspect ratio
- Optional objective chips above board

Bottom
- Booster bar with inventory badges
- Event/pass prompts outside active gameplay when possible
- Optional adaptive banner below controls with safe spacing
```

### 10.4 HUD details

- Timer should be large and centered.
- Timer turns urgent at 20% remaining with animation/sound/haptic.
- Level number on upper left.
- Currency on upper right.
- Pause button always available.
- Combo badge appears only when active.
- Objective chips show target products and counts when level objective is not clear-all.

### 10.5 Product interaction feedback

- On hover/drag: lift + outline + shadow.
- Valid target: soft glow on target compartment/cell.
- Invalid target: red shake or subtle rejection bounce.
- Move success: snap sound and haptic light.
- Triple clear: more satisfying pop, coins, particles, haptic medium.
- Reveal: soft slide, whoosh, brightness transition.

### 10.6 Audio

Audio should create ASMR satisfaction without becoming annoying.

Required sound categories:

- Product tap/lift.
- Product snap/place.
- Invalid move.
- Triple clear.
- Combo milestone.
- Hidden layer reveal.
- Booster activation.
- Timer warning.
- Win/lose.
- UI buttons.

Music should be light and loopable. Provide mute music, mute SFX, and mute haptics settings.

### 10.7 Accessibility

Accessibility features:

- Tap mode in addition to drag mode.
- Reduce motion toggle.
- Haptics toggle.
- Colorblind-safe product design; do not rely on color only.
- Larger touch targets.
- Pause and resume.
- Optional relaxed timer mode or no-timer event.
- Clear font sizes and high contrast.
- No important information hidden under ads or safe-area cutouts.

---

## 11. Technical architecture

### 11.1 Engine recommendation

Use **Unity 6 LTS** or the current supported Unity LTS at production lock. Unity is suitable because the game requires cross-platform 3D rendering, mobile input, ad/IAP SDK integrations, Addressables-based content delivery, and a mature developer pipeline. Unity's own LTS pages recommend LTS releases for live service games and creators locking production, and Unity Addressables documentation supports loading assets from local or remote content.

### 11.2 Architecture principles

- Keep gameplay rules deterministic and independent from Unity scene objects.
- Store levels, products, economy, events, and offers in data files.
- Use Unity views only for rendering, animation, input, and feedback.
- Use remote config for tuning timers, rewards, ad caps, offer prices, and event parameters.
- Use Addressables for product prefabs, themes, seasonal content, and remote downloadable bundles.
- Instrument analytics from day one.
- Build automated tests around the pure gameplay domain.

### 11.3 High-level architecture

The client should be layered so that gameplay rules can be tested independently from Unity scenes and third-party SDKs.

| Layer | Responsibilities | Notes |
|---|---|---|
| Presentation | Scenes, UI, animations, VFX, SFX, haptics, product views, shelf views, input. | Unity-specific. Should listen to domain/application events rather than owning rules. |
| Application | Game state machine, level flow, economy flow, reward flow, ads/IAP/analytics wrappers. | Coordinates services and transitions. |
| Domain | Board state, move rules, match resolver, hidden queue resolver, objectives, solver, hint logic. | Pure C# and deterministic. Must be unit-testable. |
| Data | Level JSON, ScriptableObjects, product catalog, remote config cache, local save. | Versioned schemas with migrations. |

External integrations connect through wrappers, not directly through gameplay code:

| Integration | Required capabilities |
|---|---|
| Backend / LiveOps | Cloud save, event configs, economy validation, leaderboards, remote config. |
| Ad mediation | Rewarded video, interstitials, adaptive banners, impression revenue data where available. |
| Store platforms | Apple IAP, Google Play Billing, receipt validation, purchase restoration. |

### 11.4 Unity project structure

```text
Assets/
  _Game/
    Art/
      Products/
      Shelves/
      Themes/
      UI/
      VFX/
    Audio/
      Music/
      SFX/
    Data/
      Levels/
      Products/
      Economy/
      Events/
      RemoteDefaults/
    Prefabs/
      Gameplay/
      UI/
      Products/
    Scenes/
      Boot.unity
      MainMenu.unity
      Gameplay.unity
      LevelEditor.unity
    Scripts/
      Domain/
        BoardState.cs
        MoveRules.cs
        MatchResolver.cs
        RevealResolver.cs
        Solver/
      Application/
        GameStateMachine.cs
        LevelFlowController.cs
        EconomyController.cs
        EventController.cs
      Presentation/
        BoardView.cs
        CompartmentView.cs
        ProductView.cs
        InputController.cs
        HudController.cs
      Services/
        Analytics/
        Ads/
        IAP/
        RemoteConfig/
        Save/
        Addressables/
      Editor/
        LevelEditor/
        Validators/
  Plugins/
  Settings/
```

### 11.5 Client state machine

```text
Boot
  -> UpdateCheck
  -> ConsentFlow
  -> MainMenu
  -> LevelLoading
  -> Gameplay
      -> Paused
      -> Win
      -> Lose
      -> ReviveOffer
  -> RewardSummary
  -> MetaProgression
  -> MainMenu / NextLevelLoading
```

### 11.6 Gameplay domain classes

```text
BoardState
- LevelId
- TimerState
- CompartmentState[]
- ObjectiveState
- ComboState
- MoveHistory

CompartmentState
- CompartmentId
- CellState[3] Front
- Queue<LayerState> HiddenLayers
- BlockerState
- IsInteractable

CellState
- CellIndex
- ProductInstance? Product
- CellBlocker? Blocker

ProductInstance
- InstanceId
- SkuId
- Flags: frozen, taped, mystery, objective

MoveAction
- SourceCompartmentId
- SourceCellIndex
- TargetCompartmentId
- TargetCellIndex
- Timestamp

ResolutionResult
- MovedProducts[]
- ClearedTriples[]
- RevealedLayers[]
- ObjectiveUpdates[]
- ComboUpdates
- RewardsPreview
```

### 11.7 Event bus

Use a typed event bus or C# events to decouple domain resolution from presentation.

```text
GameplayEvents
- LevelStarted
- ProductSelected
- ProductMoved
- InvalidMove
- TripleCleared
- LayerRevealed
- ComboChanged
- BoosterUsed
- ObjectiveUpdated
- TimerWarning
- LevelWon
- LevelLost
```

Presentation listens to these events to animate. Analytics listens to selected events to send telemetry.

### 11.8 Determinism requirements

- Same level seed and same move sequence should produce identical board outcomes.
- Randomness in shuffle/booster effects must be seeded and recorded.
- Domain layer should have no dependencies on Unity `Time`, scene objects, physics, or random state.
- Unit tests must run outside the Unity player where possible.

### 11.9 Save system

Save locally after every important state change:

- Level completion.
- Currency/booster changes.
- IAP grants.
- Event progress.
- Collection progress.
- Settings changes.

Use atomic saves:

1. Write to temp file.
2. Validate checksum/schema version.
3. Swap temp to active save.
4. Keep previous save backup.

Cloud save should be enabled after anonymous auth or platform sign-in. Use version numbers and conflict resolution:

- If cloud save is newer and local has no unsynced purchases, use cloud.
- If both changed, merge durable progress by max level, additive validated purchases, max currency only when server-authoritative transaction log supports it.
- Never trust client-reported IAP without receipt validation.

---

## 12. Data schemas

### 12.1 Level config JSON

```json
{
  "schemaVersion": 1,
  "levelId": "level_0125",
  "seed": 882314,
  "chapterId": "snack_aisle",
  "difficultyTier": "hard",
  "board": {
    "rows": 5,
    "columns": 3,
    "compartments": [
      {
        "id": "c_0_0",
        "row": 0,
        "column": 0,
        "type": "normal",
        "front": [
          { "skuId": "bag_bow_01" },
          { "skuId": "tomato_cluster_01" },
          { "skuId": "chips_blue_01" }
        ],
        "hiddenLayers": [
          [
            { "skuId": "soda_blue_01" },
            { "skuId": "pear_yellow_01" },
            { "skuId": "chips_blue_01" }
          ]
        ],
        "blocker": null,
        "previewMode": "dim_exact"
      }
    ]
  },
  "objective": {
    "type": "clear_all",
    "targets": []
  },
  "timerSec": 176,
  "starThresholds": {
    "threeStarsRemainingSec": 55,
    "twoStarsRemainingSec": 20
  },
  "availableBoosters": ["hint", "shuffle", "hammer", "freeze_time", "extra_slot"],
  "rewards": {
    "baseCoins": 45,
    "firstTryBonusCoins": 15,
    "passXp": 10
  },
  "validation": {
    "solverStatus": "solved",
    "solverNodes": 4822,
    "minSolutionMoves": 58,
    "botWinRate": 0.46,
    "lastValidatedAt": "2026-06-12T00:00:00Z"
  }
}
```

### 12.2 Product catalog JSON

```json
{
  "schemaVersion": 1,
  "products": [
    {
      "skuId": "chips_blue_01",
      "displayNameKey": "sku.chips_blue_01",
      "category": "snack",
      "silhouetteClass": "pouch",
      "rarity": "common",
      "prefabAddress": "products/chips_blue_01.prefab",
      "iconAddress": "icons/chips_blue_01.png",
      "unlockLevel": 1,
      "colorTags": ["blue", "yellow"],
      "sizeClass": "medium",
      "readabilityScore": 5,
      "seasonal": false
    }
  ]
}
```

### 12.3 Economy config JSON

```json
{
  "schemaVersion": 1,
  "currencies": {
    "coins": { "startingAmount": 500, "maxSoftCap": 999999 },
    "stars": { "startingAmount": 0 },
    "gems": { "startingAmount": 0 }
  },
  "boosterCosts": {
    "hint": { "coins": 100 },
    "shuffle": { "coins": 250 },
    "hammer": { "coins": 200 },
    "freeze_time": { "coins": 300 },
    "extra_slot": { "coins": 400 }
  },
  "reviveOffers": [
    { "id": "rv_plus_60_sec", "type": "rewarded_ad", "addSeconds": 60 },
    { "id": "coins_plus_45_sec", "type": "coins", "cost": 300, "addSeconds": 45 }
  ]
}
```

### 12.4 Remote config defaults

```json
{
  "schemaVersion": 1,
  "ads": {
    "interstitialEnabled": true,
    "firstInterstitialAfterLevel": 8,
    "interstitialCooldownSec": 120,
    "suppressInterstitialAfterRewardedSec": 180,
    "bannerInGameplayEnabled": false
  },
  "difficulty": {
    "timerMultiplierNormal": 1.0,
    "timerMultiplierHard": 0.88,
    "timerMultiplierSuperHard": 0.78,
    "comboWindowSec": 2.5
  },
  "economy": {
    "winCoinsMultiplier": 1.0,
    "rewardedDoubleEnabled": true,
    "starterPackVariant": "A"
  },
  "features": {
    "relaxModeEnabled": true,
    "collectionAlbumEnabled": true,
    "battlePassEnabled": true,
    "dailyOrdersEnabled": true
  }
}
```

### 12.5 Player save schema

```json
{
  "schemaVersion": 1,
  "playerId": "anon_abc123",
  "createdAt": "2026-06-12T00:00:00Z",
  "lastSeenAt": "2026-06-12T00:00:00Z",
  "progress": {
    "highestLevelCompleted": 124,
    "currentChapterId": "snack_aisle",
    "stars": 312,
    "xp": 8420
  },
  "wallet": {
    "coins": 2450,
    "gems": 0
  },
  "boosters": {
    "hint": 4,
    "shuffle": 1,
    "hammer": 2,
    "freeze_time": 0,
    "extra_slot": 1
  },
  "settings": {
    "inputMode": "tap_and_drag",
    "music": true,
    "sfx": true,
    "haptics": true,
    "reduceMotion": false,
    "relaxModePreferred": false
  },
  "purchases": {
    "removeAds": false,
    "activePassId": null
  },
  "events": {},
  "collections": {}
}
```

---

## 13. Backend, services, and integrations

### 13.1 MVP service stack

The team can choose Firebase, Unity Gaming Services, PlayFab, or a custom backend. For speed, use managed services unless there is a strong reason not to.

Required service capabilities:

- Anonymous authentication.
- Cloud save.
- Remote config.
- A/B testing.
- Analytics.
- Crash reporting.
- Push notifications.
- Server-side IAP validation.
- Event configuration.
- Leaderboards or event cohorts.

### 13.2 Backend API outline

```text
POST /v1/auth/anonymous
GET  /v1/player/save
PUT  /v1/player/save
POST /v1/economy/grant
POST /v1/iap/validate/apple
POST /v1/iap/validate/google
GET  /v1/remote-config
GET  /v1/events/active
POST /v1/events/progress
GET  /v1/leaderboards/{eventId}
POST /v1/leaderboards/{eventId}/score
POST /v1/consent/update
POST /v1/data/delete-request
```

### 13.3 Server-authoritative needs

The game can be mostly client-authoritative for offline play, but these operations should be server-validated:

- IAP receipts.
- Durable entitlement grants.
- Cloud save conflict resolution.
- Event leaderboard submissions.
- Pass purchase and premium reward claims.
- High-value currency grants.

### 13.4 Ad mediation

Use an ad mediation platform with:

- Rewarded video.
- Interstitial.
- Adaptive banners.
- Impression-level revenue data if available.
- Frequency capping and placement controls.
- COPPA/GDPR/CCPA flags.
- A/B test support or remote placement control.

Create an internal `IAdsService` wrapper so the game logic is not tied directly to one SDK.

```csharp
public interface IAdsService
{
    bool IsRewardedReady(string placementId);
    Task<RewardedResult> ShowRewardedAsync(string placementId, string context);
    bool IsInterstitialReady(string placementId);
    Task<InterstitialResult> ShowInterstitialAsync(string placementId, string context);
    void ShowBanner(string placementId, BannerPosition position);
    void HideBanner(string placementId);
}
```

### 13.5 IAP integration

Use platform billing APIs through Unity IAP or a carefully maintained native bridge. Requirements:

- Product catalog loaded from store and remote config.
- Local pending purchase queue.
- Server-side validation.
- Idempotent grant by transaction ID.
- Restore purchases.
- Clear messaging for consumables vs non-consumables.
- Remove Ads entitlement checked before every forced ad.

Google Play's billing documentation says the Play Billing Library enables communication with Google Play for localized product offerings and purchase flow handling. Apple recommends using the App Store Server API to get Apple-signed transaction and subscription information when validating IAPs server-side without receipts. Follow the current official docs during implementation.

---

## 14. Analytics, telemetry, and A/B testing

### 14.1 Analytics principles

Analytics is not optional. This genre depends on level tuning, ad tuning, and economy tuning. Every level must be measurable.

Rules:

- Events must include `playerId`, `sessionId`, `appVersion`, `buildNumber`, `platform`, `country`, `installCohort`, and `abVariants` where legal/available.
- Economy events must include source and sink.
- Ad events must include placement and impression revenue if available.
- Level events must include attempt number, timer remaining, moves, boosters, fail reason, and hidden reveal counts.
- Do not collect unnecessary personal data.

### 14.2 Core event taxonomy

| Event | Trigger | Key parameters |
|---|---|---|
| `app_first_open` | First launch | install source, consent state |
| `session_start` | App foreground | session number, days since install |
| `tutorial_step` | Tutorial interaction | step id, success/fail |
| `level_start` | Level begins | level id, difficulty, attempt, boosters selected |
| `product_move` | Valid move committed | level id, move index, source, target, sku, createsPair, createsTriple |
| `invalid_move` | Invalid input | reason, sku, source, target |
| `triple_clear` | Match clears | sku, combo, time remaining, compartment |
| `layer_reveal` | Hidden layer becomes front | compartment id, hidden depth before/after |
| `booster_used` | Booster consumed | booster id, source, level id, time remaining |
| `level_end` | Win/loss/quit | result, fail reason, duration, moves, remaining time, boosters used |
| `ad_opportunity` | Ad offered | placement, context, reward |
| `ad_impression` | Ad shown | network, placement, format, revenue |
| `iap_start` | Purchase flow begins | product id, price, currency |
| `iap_complete` | Purchase validated | product id, transaction id hash, revenue |
| `economy_transaction` | Currency/booster changes | item, amount, source, sink, balance |
| `event_progress` | Event points earned | event id, points, source |
| `crash` | Crash report | build, device, stack trace via crash SDK |

### 14.3 Level difficulty dashboard

Build a dashboard around these metrics per level:

- Starts.
- Completion rate.
- First-attempt win rate.
- Average attempts to win.
- Average moves.
- Average time remaining on win.
- Timeout loss rate.
- No-space/stalemate loss rate.
- Booster usage rate by booster.
- Rewarded revive acceptance.
- Quit rate.
- Solver difficulty score.

Flag levels automatically:

```text
- Completion rate < target_min for tier
- Timeout losses > 70% of failures
- Booster use > 2x surrounding level average
- Quit rate spike > 1.5x surrounding average
- Average time remaining < 5 seconds on normal levels
- Unusual ad/IAP conversion spike caused by frustration
```

### 14.4 Product KPIs

Soft-launch KPI targets should be treated as starting hypotheses:

| KPI | Initial target | Notes |
|---|---:|---|
| D1 retention | 35%+ | Varies strongly by traffic source and market. |
| D7 retention | 12%+ | Improve with events, streaks, and fair difficulty. |
| D30 retention | 4%+ | Needs live ops and content depth. |
| Crash-free sessions | 99.5%+ | Must be high for UA scaling. |
| Average session length | 8-12 min | Short-session puzzle target. |
| Levels per session | 5-10 | Depends on level length. |
| Rewarded ad engagement | 20%-40% DAU | Depends on placement and reward value. |
| Interstitial impressions/DAU | 1-4 | Use frequency caps. |
| IAP conversion | 1%-3% early | Depends on market and monetization. |

### 14.5 A/B tests

High-priority tests:

1. First timer introduction: Level 3 vs Level 6 vs Level 10.
2. Interstitial first show: after level 5 vs 8 vs 12.
3. Interstitial cooldown: 90s vs 120s vs 180s.
4. Rewarded revive: +45s vs +60s vs extra slot.
5. Remove Ads price: $4.99 vs $5.99 vs $6.99 equivalent.
6. Starter Pack: $0.99 vs $1.99, with/without 24h no forced ads.
7. Hidden preview: exact vs silhouette after level 100.
8. Relax Mode visibility: settings-only vs mode button after first fail.
9. Combo reward: cosmetic only vs coin bonus.
10. Pass price/content: $4.99 light vs $9.99 deluxe.

Use remote config and A/B testing tools. Firebase documentation supports A/B Testing with Remote Config for Android, iOS, Unity, and other platforms; Unity Remote Config is designed to tune game design without deploying new versions.

---

## 15. Live operations plan

### 15.1 LiveOps calendar

Use a 4-week cycle:

| Week | Activity |
|---|---|
| Week 1 | New pass season, product album page, balance patch. |
| Week 2 | Weekend Rush event, new hard levels, offer test. |
| Week 3 | Treasure Shelves event, new shelf skin, UA creative refresh. |
| Week 4 | Seasonal mini-event, relax puzzle pack, economy review. |

### 15.2 Content release cadence

- Launch: 500 levels in app, 500 additional levels in remote/content pipeline.
- Weekly: 50-100 levels, depending on validation pipeline.
- Monthly: one shelf theme, one product category expansion, one pass season.
- Quarterly: new major mechanic or blocker.

### 15.3 Remote content delivery

Use Addressables or equivalent to deliver:

- Product prefabs and icons.
- Seasonal shelf themes.
- Event VFX/audio.
- Level bundles.
- Localization updates if tooling supports it.

Keep critical level and product fallback data packaged in the app so offline players can play without network.

### 15.4 Push notifications

Notifications should be opt-in, localized, and respectful.

Allowed notifications:

- Daily reward ready.
- Event ending soon.
- Pass reward unclaimed.
- New levels available.

Limits:

- No more than 1-2 per day.
- Quiet hours by local time.
- Easy opt-out.
- No deceptive urgency.

---

## 16. Production roadmap

### 16.1 Recommended team

| Role | Count | Responsibilities |
|---|---:|---|
| Product owner / producer | 1 | Scope, milestones, backlog, release coordination. |
| Game designer | 1-2 | Core rules, levels, economy, LiveOps, balancing. |
| Unity gameplay engineer | 2 | Core gameplay, board, input, animations, tools. |
| Unity UI/client engineer | 1 | UI flow, menus, shop, pass, events. |
| Backend/services engineer | 1 | Auth, cloud save, IAP validation, events, leaderboards. |
| Technical artist | 1 | Art pipeline, shaders, optimization, VFX. |
| 3D artist(s) | 2-4 | Products, shelves, themes, icons. |
| UI/UX designer | 1 | UX flows, HUD, menus, store assets. |
| QA | 1-3 | Functional, device, regression, content validation. |
| Data/UA analyst | 0.5-1 | Dashboards, soft-launch analysis, A/B tests. |

### 16.2 Milestone plan

#### Phase 0 - Pre-production (2 weeks)

Deliverables:

- Final product name shortlist.
- Core mechanic prototype decision.
- Art style guide.
- Technical architecture decision.
- Project repo and CI skeleton.
- Level data schema v1.
- Analytics event spec v1.
- Monetization design v1.

Acceptance criteria:

- Team can run project on iOS/Android dev devices.
- One test scene loads product prefabs and shelf grid.
- Product owner approves scope and feature priorities.

#### Phase 1 - Core prototype (4 weeks)

Deliverables:

- 5x3 board.
- Product movement with drag and tap input.
- Triple match detection and clearing.
- Hidden layer preview and reveal.
- Timer and basic win/loss.
- 20 test levels in JSON.
- Basic HUD.
- One booster: Hint or Shuffle.

Acceptance criteria:

- A player can complete 20 levels on device.
- Hidden queue mechanic matches the intended screenshot behavior.
- Levels are data-driven.
- Domain unit tests cover move, match, reveal, win/loss.

#### Phase 2 - Vertical slice (4-6 weeks)

Deliverables:

- Polished core animations, VFX, SFX, haptics.
- 75 levels.
- 5 boosters.
- Tutorial.
- Win/lose/revive flow.
- Local save.
- Analytics integration.
- Remote config defaults.
- Basic shop.
- Rewarded ads test integration.

Acceptance criteria:

- 30-minute playtest has no blocking bugs.
- Analytics events appear in dashboard.
- Rewarded ad grants correctly.
- Designers can edit levels without code.

#### Phase 3 - MVP content and meta (6-8 weeks)

Deliverables:

- 250 levels.
- 100 product SKUs.
- 3 shelf themes.
- Daily rewards.
- Win streak.
- Collection album v1.
- Store renovation v1 or chapter map v1.
- IAP test products.
- Remove Ads entitlement.
- Interstitial/banners with caps.
- Cloud save.
- Crash reporting.
- Level validation tools.

Acceptance criteria:

- Build passes full QA smoke test.
- IAP receipts validate in sandbox/internal test.
- Remove Ads suppresses forced ads.
- Crash-free test sessions >99% internally.
- All 250 levels solver-validated.

#### Phase 4 - Soft launch (4-8 weeks)

Deliverables:

- 500 levels.
- 200 product SKUs.
- 6 themes.
- 3 recurring events.
- Pass season v1.
- A/B tests.
- UA creative pack and playable ad prototype.
- Store listing assets.

Acceptance criteria:

- Soft launch in 1-3 test markets.
- Dashboard tracks retention, revenue, ad revenue, level difficulty, crash rate.
- Weekly balance patches via remote config/content bundles.
- Go/no-go report after cohorts mature.

#### Phase 5 - Global launch and scale

Deliverables:

- 1,000+ levels ready.
- LiveOps calendar for next 8 weeks.
- Localization for priority languages.
- UA budget scaling plan.
- Customer support macros.
- Privacy/data deletion workflow.

Acceptance criteria:

- KPI gates met or mitigation plan approved.
- Store compliance passed.
- No critical bugs open.
- Team can release new levels/events without app update.

---

## 17. Backlog epics and user stories

### Epic A - Core board gameplay

**Story A1: Move visible products**  
As a player, I can move a visible product from one compartment to an empty front cell so that I can organize products into triples.

Acceptance criteria:

- Only visible front products are selectable.
- Hidden preview products are not selectable.
- Invalid targets are rejected with feedback.
- Move resolves identically in drag and tap modes.
- Move is recorded in move history.

**Story A2: Clear triples**  
As a player, when three identical products are in a compartment, they clear automatically.

Acceptance criteria:

- Match detection uses SKU ID.
- Clear animation plays.
- Cells become empty after animation.
- Objective counters update.
- Analytics event fires.

**Story A3: Reveal hidden layers**  
As a player, when all three front products in a compartment are moved or cleared, the next hidden batch appears.

Acceptance criteria:

- Hidden preview is visible but disabled.
- Reveal occurs only when front layer is empty.
- Next hidden layer becomes interactable after reveal animation.
- If more layers remain, next preview updates.

### Epic B - Level flow

- Start level.
- Pause/resume.
- Timer warning.
- Win panel.
- Lose panel.
- Revive offer.
- Retry.
- Next level.

### Epic C - Boosters

- Hint heuristic.
- Shuffle with solvability preservation.
- Hammer selected product.
- Freeze/add time.
- Extra slot.
- Booster inventory and purchase hooks.

### Epic D - Content tools

- Level editor.
- Solver validation.
- Batch validation.
- Product catalog editor.
- Difficulty dashboard export.
- Thumbnail generation.

### Epic E - Economy and monetization

- Coins and stars.
- Booster shop.
- Rewarded ads.
- Interstitial/banners.
- Remove ads.
- Starter pack.
- Pass.
- Piggy bank.
- Receipt validation.

### Epic F - Meta and LiveOps

- Chapter map.
- Daily reward.
- Win streak.
- Collection album.
- Daily orders.
- Weekend event.
- Remote event config.

### Epic G - Analytics and QA

- Event instrumentation.
- Dashboards.
- Crash reporting.
- Unit tests.
- Device test matrix.
- Automated level validation.

---

## 18. Performance and technical quality

### 18.1 Target devices

Support:

- iOS 13+ or higher if required by current SDKs.
- Android 8+ or higher if required by current SDKs.
- Low-end Android devices with 3GB RAM should be playable.
- Tablet layouts should scale but portrait remains primary.

### 18.2 Performance targets

| Metric | Target |
|---|---:|
| Frame rate | 60 FPS on mid/high devices; 30 FPS fallback on low-end. |
| App cold start | <5 seconds to main menu on mid devices. |
| Gameplay load | <3 seconds after assets cached. |
| Memory | <500 MB runtime on low-end devices; lower preferred. |
| Visible draw calls | <150-200 during gameplay after batching. |
| Initial install size | <250 MB preferred; use remote content for seasonal assets. |
| Crash-free sessions | 99.5%+ soft-launch target. |
| Input latency | Product response within 50 ms. |

### 18.3 Optimization requirements

- Use texture atlases for products and UI where appropriate.
- Use GPU instancing/static batching for repeated shelf pieces.
- Avoid real-time physics for product movement; use scripted tweens.
- Pool product views, VFX, text popups, and UI elements.
- Use Addressables to load only active chapter/theme products.
- Use LOD or simplified meshes for small background props.
- Profile on real low-end Android devices weekly.

### 18.4 Build quality

- CI builds for Android and iOS on every main branch merge.
- Automated unit tests for domain logic.
- Static analysis/linting for C# where feasible.
- Versioned level bundles.
- Crash symbols uploaded for each release.
- Feature flags for risky features.
- Rollback plan for remote config and content bundles.

---

## 19. QA plan

### 19.1 Test categories

| Category | Coverage |
|---|---|
| Functional | Movement, matching, reveal, boosters, objectives, win/loss. |
| Content | Level solvability, product counts, blockers, timer, difficulty. |
| Economy | Currency grants/sinks, booster inventory, purchases, refunds. |
| Ads | Reward grants, frequency caps, no forced ads after remove-ads. |
| IAP | Sandbox purchases, restore, duplicate transaction, failed validation. |
| Save | Local save, cloud save, offline/online, conflict resolution. |
| Performance | FPS, memory, thermal, load times. |
| Device | Phones/tablets, notches, aspect ratios, low-end Android. |
| Localization | Text expansion, fonts, RTL if supported. |
| Compliance | Consent, privacy, data deletion, age rating, store policies. |

### 19.2 Automated tests

Minimum automated tests:

- Product move legal/illegal cases.
- Triple clear cases.
- Hidden reveal cases.
- Chain resolution cases.
- Objective completion cases.
- Booster effects.
- Shuffle solvability preservation.
- Timer win/loss boundaries.
- Save migration.
- Economy transaction idempotency.
- Level JSON schema validation.
- All shipped levels solver-validated.

### 19.3 Device matrix

| Tier | Example devices | Goal |
|---|---|---|
| Low Android | Older Samsung A-series, Moto G, low RAM devices | Verify 30 FPS fallback and memory. |
| Mid Android | Pixel A-series, Samsung mid-tier | Primary Android experience. |
| High Android | Recent Galaxy S/Pixel | 60 FPS, visual quality. |
| iPhone older | iPhone 11/12 class | Baseline iOS performance. |
| iPhone current | Recent iPhone | 60 FPS, haptics, safe areas. |
| Tablet | iPad, Android tablet | Layout/input scaling. |

### 19.4 Content QA checklist

A level cannot ship unless:

- Product counts are valid.
- Solver status is solved.
- Bot simulation is within target range.
- Timer is not obviously unfair.
- Product SKUs are readable and not overly similar.
- Hidden layers reveal correctly.
- Objectives match product content.
- No impossible blocker dependencies.
- No cell overlaps or products clipping through shelves.
- Win/loss works with and without boosters.

---

## 20. Compliance, privacy, and legal

### 20.1 Platform compliance

Follow current Apple App Store Review Guidelines and Google Play policies. Apple guidelines are organized around Safety, Performance, Business, Design, and Legal. Google Play Families policies apply if the target audience includes children, including the requirement to use Families Self-Certified Ads SDKs for children and users of unknown age. Decide early whether the game targets children or is 13+; do not mix child-directed marketing with adult ad/monetization practices.

### 20.2 Privacy requirements

- Consent flow for GDPR/EEA/UK and other applicable regions.
- CCPA/CPRA support where applicable.
- LGPD support for Brazil where applicable.
- COPPA review if under-13 audience may be targeted.
- Data deletion request flow.
- Privacy policy before launch.
- Data safety / App Privacy labels accurate and updated.
- No unnecessary collection of personal data.
- Encrypt data in transit.

### 20.3 Ads and children

If the app targets children or includes children in the target audience:

- Use only compliant ad SDKs.
- Disable personalized ads for children/unknown age groups where required.
- Ensure ad content rating is appropriate.
- Avoid behavioral targeting.
- Avoid manipulative purchase prompts.

### 20.4 IP and clone risk

The mobile puzzle market includes frequent copycat disputes. A recent news report about Zynga's lawsuit over Screw Jam alleged that a competitor copied not only a basic casual puzzle concept but also specific design elements such as icons, colors, UI, and progression. This project should avoid that risk by creating original art, icons, UI layout, product names, level designs, store copy, tutorials, audio, and meta systems.

Practical safeguards:

- Do not scrape or copy competitor assets.
- Do not recreate exact levels from another game.
- Use original product packaging without real-world trademarks.
- Create a distinct UI style and iconography.
- Maintain art source files and contracts proving originality.
- Run legal review before launch.

### 20.5 Random rewards and loot boxes

If paid random rewards are introduced:

- Disclose odds before purchase where required.
- Review country-specific regulations.
- Consider avoiding paid random rewards entirely for launch.
- Use deterministic pass rewards and transparent bundles instead.

---

## 21. Store, ASO, and user acquisition

### 21.1 Store positioning

Store page should emphasize:

- Triple match goods sorting.
- Satisfying shelf organization.
- Hidden product reveals.
- Boosters for tricky puzzles.
- Offline play.
- Thousands of levels after content pipeline matures.
- Seasonal events.
- Fair ads and optional remove ads.

Avoid false claims such as "no ads" unless all forced ads are truly absent or removed by default.

### 21.2 Screenshot plan

Store screenshots:

1. Core shelf puzzle with clear triple opportunity.
2. Hidden layer reveal moment.
3. Combo multiplier and satisfying clear.
4. Booster use on hard level.
5. Collection album or store renovation.
6. Seasonal event.
7. Pass/rewards.

### 21.3 UA creative strategy

Unity's 2025 outlook highlights long-format playable creatives as effective for puzzle games, including stand-alone playables with many interactions or 1-2 minutes of play time. For this game, build playable ads that let users solve one miniature shelf puzzle.

Creative concepts:

- **Almost solved:** two pears in a compartment, one pear trapped behind a front layer.
- **Wrong move trap:** show player running out of shelf space, then demonstrate correct move.
- **Satisfying chain:** three quick clears and combo x5.
- **Hidden reveal hook:** disabled products behind slide forward after clearing front.
- **Can you solve it?** simple puzzle with one obvious but satisfying solution.

### 21.4 Creative production requirements

- Export gameplay without UI clutter for ads.
- Build deterministic mini-levels for playable ads.
- Produce 9:16, 1:1, 4:5, and 16:9 variants.
- Use localized captions.
- Refresh creatives weekly during UA tests.
- Track creative IDs through attribution and analytics.

---

## 22. Definition of done for a fully playable launch candidate

A launch candidate is done when all of the following are true:

### Core gameplay

- Players can complete levels from start to finish.
- Visible front products move correctly.
- Hidden disabled products reveal correctly when front layer is emptied.
- Triple matching is reliable.
- Timer, combo, win, loss, retry, revive, pause, and next-level flow work.
- Drag and tap modes both work.

### Content

- At least 500 levels are in the launch build or downloadable launch content.
- At least 1,000 levels exist in the content backlog/pipeline.
- All shipped levels are solver-validated.
- Level difficulty dashboard has no critical outliers.
- At least 200 product SKUs are available across categories.
- At least 6 shelf/room themes are available.

### Meta and monetization

- Daily reward, win streak, and at least one event are live.
- Collection album or renovation meta is live.
- Rewarded ads, interstitials, banners, and Remove Ads are implemented and frequency-capped.
- Starter pack, booster bundle, and pass or piggy bank are implemented.
- IAP validation works in sandbox/internal tests.
- Economy grants are idempotent and logged.

### Tech and quality

- Builds pass iOS and Android QA.
- Crash reporting is integrated.
- Analytics events are verified in dashboard.
- Remote config can modify ad caps, timer multipliers, reward multipliers, and feature flags without app update.
- Save migration and cloud save work.
- App handles offline gameplay gracefully.
- Performance targets are met on low and mid-tier devices.

### Compliance

- Privacy policy is live.
- Consent flow is implemented where required.
- App Store privacy labels and Google Play Data Safety are accurate.
- Age rating and ad SDK choices match target audience.
- Legal review confirms original IP and acceptable monetization.

---

## 23. Immediate next steps for the development team

1. Approve the product pillars and monetization guardrails.
2. Choose final engine version and backend stack.
3. Build a 2-week prototype focused only on board, movement, triple clear, and hidden reveal.
4. Build 20 hand-authored levels and playtest them internally.
5. Implement analytics skeleton before expanding content.
6. Build the level editor and solver before committing to hundreds of levels.
7. Produce art style guide and first 30 product SKUs.
8. Define soft-launch KPI gates and test markets.
9. Create original brand/name and run legal clearance.
10. Prepare a UA playable prototype as soon as the core loop feels satisfying.

---

## 24. Reference links used for research

The following public sources were used to ground the market and implementation recommendations. Information was reviewed on 2026-06-12.

1. Goods Sort - Sorting Games on Google Play: https://play.google.com/store/apps/details?hl=en&id=closet.match.pair.matching.games
2. Match Factory! on Google Play: https://play.google.com/store/apps/details?hl=en&id=net.peakgames.match
3. Sort Match: 3D Goods Puzzle on the App Store: https://apps.apple.com/us/app/sort-match-3d-goods-puzzle/id6526483945
4. Goods Match 3D: Sorting Games on the App Store: https://apps.apple.com/us/app/goods-match-3d-sorting-games/id1619057157
5. Goods Match 3D - Sorting Games on the App Store: https://apps.apple.com/us/app/goods-match-3d-sorting-games/id6465896494
6. Sensor Tower, State of Mobile 2025: https://sensortower.com/state-of-mobile-2025
7. Sensor Tower, State of Gaming 2025: https://sensortower.com/state-of-gaming-2025
8. Liftoff, 2025 Casual Gaming Apps Report: https://liftoff.ai/2025-casual-gaming-apps-report/
9. Unity, 2025 Mobile Gaming Trends - Unity Perspectives: https://unity.com/blog/2025-mobile-gaming-trends-unity-perspectives
10. Unity 6 Releases and Support: https://unity.com/releases/unity-6/support
11. Unity Addressables documentation: https://docs.unity3d.com/Packages/com.unity.addressables@latest/
12. Unity Remote Config documentation: https://docs.unity.com/en-us/remote-config
13. Firebase A/B Testing with Remote Config: https://firebase.google.com/docs/ab-testing/abtest-config
14. Google Play Billing documentation: https://developer.android.com/google/play/billing
15. Apple App Store Server API / receipt validation documentation: https://developer.apple.com/documentation/storekit/validating-receipts-with-the-app-store
16. Google Play Families policy/content rating requirements: https://support.google.com/googleplay/android-developer/answer/9859655?hl=en
17. Apple App Store Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
18. Polygon report on Zynga copycat lawsuit in casual puzzle market: https://www.polygon.com/news/520256/screw-jam-zynga-lawsuit

---

## Appendix A - Sample implementation pseudo-code

### A.1 Apply move and resolve

```pseudo
function ApplyMoveAndResolve(board, move):
    assert IsLegalMove(board, move)

    source = board.GetCell(move.source)
    target = board.GetCell(move.target)
    product = source.product

    source.product = null
    target.product = product
    board.moveHistory.push(move)

    resolution = new ResolutionResult()
    resolution.movedProducts.add(product)

    affectedCompartments = [move.source.compartmentId, move.target.compartmentId]

    for compartmentId in affectedCompartments.unique():
        compartment = board.GetCompartment(compartmentId)
        if IsTriple(compartment):
            sku = compartment.frontCells[0].product.skuId
            ClearTriple(compartment)
            resolution.clearedTriples.add({ compartmentId, sku })
            UpdateCombo(board.comboState)
            UpdateObjectives(board.objectives, sku, 3)

    for compartment in board.compartments:
        if FrontLayerEmpty(compartment) and compartment.hiddenLayers.notEmpty():
            layer = compartment.hiddenLayers.dequeue()
            compartment.frontCells = layer.cells
            resolution.revealedLayers.add({ compartment.id, layer })

    if IsWin(board):
        resolution.levelEnd = "win"
    else if board.timer.remaining <= 0:
        resolution.levelEnd = "loss_timeout"

    return resolution
```

### A.2 Hint heuristic

```pseudo
function FindHint(board):
    legalMoves = GenerateLegalMoves(board)

    scoredMoves = []
    for move in legalMoves:
        score = 0
        after = SimulateMove(board, move)

        if moveCreatesTriple(after, move):
            score += 1000
        if moveCreatesPair(after, move):
            score += 250
        if sourceFrontLayerBecomesEmpty(after, move):
            score += 200
        if revealCreatesImmediateTripleOpportunity(after):
            score += 300
        if moveReducesEmptyCellsTooMuch(after):
            score -= 150
        if moveBlocksKnownPair(after):
            score -= 200

        scoredMoves.add(move, score)

    return highestScore(scoredMoves)
```

### A.3 Shuffle with solvability preservation

```pseudo
function ShuffleVisibleProducts(board, seed):
    rng = Random(seed)
    visibleProducts = collect all movable visible products
    cells = collect all cells currently holding those products

    for attempt in 1..MAX_SHUFFLE_ATTEMPTS:
        shuffled = rng.shuffle(visibleProducts)
        candidate = board.clone()
        assign shuffled products to cells in candidate
        if ValidateCandidateSolvable(candidate):
            return candidate

    return FallbackShuffle(board)
```

---

## Appendix B - Example Jira-ready tickets

### Ticket 1 - Implement hidden layer preview

**Type:** Feature  
**Priority:** P0  
**Description:** Render the next hidden layer behind each compartment's front layer as disabled products. Hidden products must not receive input and should visually indicate they are not active.

**Acceptance criteria:**

- Hidden products render at reduced opacity/scale.
- Hidden product colliders/input are disabled.
- Hidden preview updates after reveal.
- No preview appears if queue is empty.
- Works in 3x3, 4x3, and 5x3 boards.

### Ticket 2 - Implement reveal resolver

**Type:** Feature  
**Priority:** P0  
**Description:** When a compartment's front layer becomes empty, pop the next hidden layer from its queue and move it to the front layer.

**Acceptance criteria:**

- Reveal triggers after products are moved out or cleared.
- Reveal animation plays once.
- New products become interactable after animation.
- Analytics event `layer_reveal` fires.
- Unit tests cover empty queue, one layer, and multiple layers.

### Ticket 3 - Build solver validation CLI

**Type:** Tooling  
**Priority:** P0  
**Description:** Add a command-line validator that loads all level JSON files and validates schema, product counts, and solver status.

**Acceptance criteria:**

- CLI exits non-zero if any level fails.
- Generates CSV report with solver nodes and difficulty metrics.
- Runs in CI.
- Supports validating a single level or folder.

### Ticket 4 - Implement rewarded revive

**Type:** Feature  
**Priority:** P1  
**Description:** On timeout loss, show a revive panel offering rewarded ad for +60 seconds or coins for +45 seconds.

**Acceptance criteria:**

- Rewarded ad button appears only when ad ready.
- Successful ad adds time and resumes level.
- Failed/canceled ad grants nothing.
- Coin revive checks balance and deducts coins.
- Analytics events fire for opportunity, click, impression, reward, and outcome.

---

## Appendix C - Launch risk register

- **Core loop feels too similar to competitors**
  - Probability: Medium
  - Impact: High
  - Mitigation: original art, UI, meta, level designs, and legal review.
- **Levels become unsolvable or unfair**
  - Probability: Medium
  - Impact: High
  - Mitigation: solver validation, bot simulation, and difficulty dashboard.
- **Ad fatigue hurts retention**
  - Probability: High
  - Impact: High
  - Mitigation: frequency caps, honest remove-ads, and rewarded-first strategy.
- **Art production bottleneck**
  - Probability: High
  - Impact: Medium
  - Mitigation: modular SKU pipeline, atlas templates, and outsource-ready style guide.
- **Low-end device performance issues**
  - Probability: Medium
  - Impact: High
  - Mitigation: early profiling, pooling, batching, and Addressables.
- **IAP/ads SDK compliance bugs**
  - Probability: Medium
  - Impact: High
  - Mitigation: SDK wrappers, sandbox tests, consent flow, and platform review checklist.
- **LiveOps too heavy for team**
  - Probability: Medium
  - Impact: Medium
  - Mitigation: start with three simple events and automate content bundles.
- **UA CPI too high**
  - Probability: Medium
  - Impact: High
  - Mitigation: early playable ad prototype, creative iteration, and ASO tests.
- **Timer alienates relaxed players**
  - Probability: Medium
  - Impact: Medium
  - Mitigation: Relax Mode, generous early timers, and fair revive options.

---

## Appendix D - Glossary for developers and designers

- **ASO:** App Store Optimization.
- **ARPDAU:** Average Revenue Per Daily Active User.
- **ARPPU:** Average Revenue Per Paying User.
- **CPI:** Cost Per Install.
- **DAU:** Daily Active Users.
- **D1/D7/D30:** Retention after 1, 7, or 30 days.
- **F2P:** Free to Play.
- **IAA:** In-App Advertising.
- **IAP:** In-App Purchase.
- **ILRD:** Impression-Level Revenue Data.
- **LTV:** Lifetime Value.
- **ROAS:** Return on Ad Spend.
- **SKU:** Unique product identity used for matching.
- **UA:** User Acquisition.

