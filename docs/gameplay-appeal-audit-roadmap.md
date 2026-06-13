# Gameplay Appeal Audit & Improvement Roadmap

**Repo:** `doqendev/Sorting-Game`  
**Date:** 2026-06-13  
**Audience:** gameplay, UI/UX, art, engineering, QA, product

---

## Executive verdict

Shelf Sort 3D has a good rules foundation, but the current game feel is still closer to a functional web prototype than a modern mobile puzzle game. The next phase should not add more feature names or more levels. It should make the core sort/clear/win loop feel tactile, rewarding, readable, and premium.

North star:

> Every correct sort should feel physically satisfying. Every triple clear should feel like a small win. Every puzzle completion should feel like opening a reward drawer. The UI should look like a mobile game shell, not a website around a canvas.

The build already has deterministic move resolution, objectives, boosters, hidden layers, timers, fail states, save/economy scaffolding, telemetry names, and a Three.js board. The missing layer is the dopamine loop: movement, anticipation, snap, clear, reveal, reward ceremony, and premium UI framing.

---

## Benchmarks and genre expectations

The game should benchmark against three overlapping groups:

| Benchmark group | Examples to study | What they prove | What Shelf Sort 3D should adopt |
|---|---|---|---|
| Shelf / goods sorting puzzle | Goods Sort / Goods Master style shelf games, supermarket-sort variants | The appeal is clarity, snap movement, tidying chaos, and visual order emerging from mess. | Stronger shelf identity, item snap, shelf glow, tidy-line completion, puzzle-complete drawer. |
| 3D triple matching | Triple Match 3D, Match Factory!, Match 3D-style games | Players accept simple mechanics when object handling, discovery, boosters, events, and completion feedback are strong. | Tactile pickup, hidden-layer reveals, clear cascades, combo feedback, event hooks, readable item silhouettes. |
| Mainstream mobile puzzle | Royal Match, Candy Crush, Toon Blast, Homescapes | Premium HUDs, reward choreography, chests, events, progression maps, animated meta systems. | Game-like UI, animated rewards, modern panels, live-event framing, polished end-of-level ceremony. |

Competitive takeaways:

1. The core loop must be instant, readable, and rewarding.
2. Players punish low readability and bad tap targeting.
3. Coins, stars, passes, streaks, collections, and events should move, bounce, count, stamp, fill, and land in visible UI containers.
4. The UI shell is part of the game fantasy. The player should never feel like they are pressing normal HTML controls.
5. Completion needs a signature ritual, not a static `Level Complete` modal.

---

## Current implementation findings

### What is already strong

- The TypeScript domain model is clean and deterministic.
- `applyMoveAndResolve` returns useful game-state events: moved products, cleared triples, revealed layers, objective updates, combo changes, score delta, move quality, and level end.
- `classifyMoveQuality` already identifies `match_ready`, `reveal_enabling`, `good`, `risky`, and `neutral`; this is excellent input for graded feedback.
- The app already has haptic and basic audio feedback hooks.
- The app already tracks coins, stars, pass XP, collections, events, win streaks, boosters, revives, rewarded ads, and settings.
- The board is rendered in Three.js, which is enough for premium movement, lighting, depth, particles, and camera effects.

### Main issues blocking appeal

| Area | Current behavior | Player impact |
|---|---|---|
| Move animation | Product state changes resolve immediately and the board re-renders. | Correct moves feel like teleporting state changes instead of tactile object motion. |
| Clear animation | Triples disappear through logic and re-render. | The most satisfying moment is underpaid. |
| Hidden reveal | Hidden shelves appear after state update. | Hidden queue reveal does not feel like discovery. |
| Completion | Win panel is a static modal with reward grids. | Level completion lacks a memorable reward ceremony. |
| UI skin | Text controls like `M`, `II`, `S`, `H`, `F`; small-radius cards; default-like modal. | The product still reads as a web game, not a modern mobile puzzle game. |
| Audio | Short oscillator beep per feedback kind. | Confirms actions but does not create emotion, rhythm, or reward. |
| Haptics | Present but not synchronized to visual timing. | Good foundation, but the feedback feels disconnected. |
| Boosters | Work functionally but trigger mostly instant/static effects. | Boosters do not yet feel premium or worth buying. |
| Meta rewards | Collections, events, pass XP, streaks exist as labels/panels. | Retention loops lack visual payoff. |

---

## Target emotional loop

### 1. Micro loop: every input, 0-500 ms

- Tap product: product pops up, shelf slot glows, tiny haptic tick.
- Drag/tap move: product lifts and travels along a short curved path.
- Valid target: target pulses green/blue; shelf accepts product with a snap.
- Invalid move: product/shelf shakes, red edge flash, low haptic, soft `nope` sound.
- Good move: product lands with bounce and a tiny sparkle.
- Risky move: subtle low-space warning pulse.

### 2. Meso loop: every correct sort/triple, 500-1600 ms

- Pair created: two matching items pulse together.
- Triple created: three items squeeze inward, glow, and fly into a collection tray or dissolve into sparkles.
- Combo: combo badge rises from the clear location; pitch and particles escalate.
- Hidden reveal: shelf face/drawer slides open; hidden goods roll/slide forward.
- Objective tick: target chip updates with an item icon flying into it.
- Booster impact: each booster has a cinematic identity.

### 3. Macro loop: puzzle complete, 2.5-4.0 seconds

- Last triple clears in slow motion.
- Board dims; shelves settle into a tidy formation.
- A **Puzzle Complete Drawer** slides out from the bottom of the board.
- Stars drop into three slots one by one.
- Coins arc into the wallet.
- Collection/pass/event/streak progress fills.
- Primary `Next` button pulses only after the main reward landing.

---

## Signature feature: Puzzle Complete Drawer

The Puzzle Complete Drawer should become the game's memorable win ritual.

### Visual concept

A glossy supermarket checkout drawer / shelf cabinet / delivery crate slides open after the final clear. It contains reward compartments:

- star slots filled left to right;
- coin bin with coins flying from board into the bin, then to wallet;
- streak stamp or chest progress;
- album card reveal if a new SKU was collected;
- event token slot if an event is active;
- `Next shelf` button emerging after rewards finish.

The drawer should feel physical: handle pull, bounce, spring settle, light rays, soft confetti, star sparkle, coin clinks.

### Sequence spec

| Time | Beat |
|---:|---|
| 0 ms | Final triple snaps into place. |
| 120 ms | Triple glows; products compress toward center. |
| 300 ms | Products pop into sparkles or fly into mini tray. |
| 500 ms | Board dim overlay fades in; shelves do one tidy bounce. |
| 700 ms | Drawer handle appears and shakes once. |
| 950 ms | Drawer slides open with spring easing. |
| 1200 ms | Star 1 lands; haptic tick. |
| 1420 ms | Star 2 lands if earned. |
| 1640 ms | Star 3 lands if earned. |
| 1900 ms | Coins count up and arc to wallet. |
| 2300 ms | Album/pass/event progress animates. |
| 2800 ms | `Next` button pops in and pulses. |

Requirements:

- Skippable after 800 ms.
- Reduced-motion replaces travel/bounce with fade, scale, and count-up.
- Timer pauses once the final win state is reached.
- Player can proceed within 3-4 seconds.
- Do not show a standard browser dialog for this sequence.
- Interstitial ads must not interrupt the ceremony.

---

## UI direction: make it look like a game, not a website

### Remove these visual smells

- Text-only buttons: `M`, `II`, `S`, `H`, `F`, `Shop`.
- Flat web-like cards with 8 px radii.
- Native `dialog` modal behavior in primary flows.
- Generic system-font web-app feel.
- Static reward grids.
- Static album/event panels.

### Target game shell

| UI area | New direction |
|---|---|
| Top HUD | Floating glossy capsules: level badge, timer medallion, coin wallet, star bank, pause button. Add icons and depth. |
| Objective row | Mission cards with SKU icon, progress ring/bar, animated check marks. |
| Board stage | Stylized supermarket/shelf background, soft parallax, warmer lighting, shadow catchers, sparkle layer. |
| Bottom booster dock | Toy-like booster buttons with icon art, count badge, pressed state, sold-out state, and glow when recommended. |
| Panels | Full-screen game overlays and anchored popups with big headers, prize rows, and entrance/exit animation. |
| Map | Game-board path with nodes/chests, not a plain level list. |
| Shop | Card pack / booster chest style with price badges and value ribbons. |
| Events | Large event cards with themed art, timers, progress bars, and reward previews. |

Design principles:

- Large soft shapes, 18-28 px radii, bevels, strokes, and inner highlights.
- Saturated but readable palette.
- Strong iconography with accessible labels.
- 9:16 mobile-first composition with safe-area padding.
- Touch targets large enough for phones.
- UI screenshot should look like a mobile puzzle game within one second.

---

## Animation roadmap

### P0 — Animation architecture foundation

Likely files: `src/app/GameApp.ts`, `src/presentation/ThreeBoardView.ts`, new `src/presentation/AnimationDirector.ts`, new `src/presentation/VisualEvents.ts`.

Current flow:

```ts
applyMoveAndResolve(state)
boardView.renderBoard(state)
openWinPanel(...)
```

Target flow:

```ts
const before = cloneBoard(this.state);
const result = applyMoveAndResolve(this.state, move);
await this.boardView.playResolution(before, this.state, result, move);
this.boardView.renderBoard(this.state);
this.afterResolution(result);
```

Tasks:

- Add input lock while an animation is running.
- Keep `renderBoard` as sync/fallback, but do not use it as the only visual update.
- Add stable product view IDs keyed by `ProductInstance.instanceId`.
- Preserve source and target world positions before mutating visual state.
- Add timeline primitives: `wait`, `tween`, `parallel`, `sequence`, `shake`, `pulse`, `flyTo`.
- Expose `playMove`, `playClearTriple`, `playRevealLayer`, `playObjectiveTick`, `playBooster`, `playWinFinale`.
- Respect `reduceMotion` everywhere.

Acceptance criteria:

- Normal move visibly travels from source to target.
- No product teleports unless reduced motion is enabled.
- Triple clear has glow, scale, particles, sound, and haptic beat.
- Board state and visual state cannot desync after spam tapping.
- Browser tests can disable or fast-forward animations.

### P0 — Tactile move feedback

Tasks:

- Product selection lift/scale/outline.
- Valid target pulse while product is selected.
- Drag path follows finger in drag mode; tap mode animates source to target.
- Snap landing with shelf depression, product bounce, and sparkle pop.
- Pair creation pulses matching pair.
- Risky move warning if `moveQuality === "risky"`.
- Invalid move shake/flash/return.

Acceptance criteria:

- First tap gives visible feedback within 100 ms.
- Valid targets are obvious without text.
- Invalid moves feel blocked but not punishing.
- Feedback remains legible at 320 px width.

### P0 — Correct sort and triple-clear dopamine

Tasks:

- Third-item anticipation: all three matching items pulse in sync.
- Clear choreography: items jump inward, spin/scale down, burst into particles, fly to objective/drawer tray.
- Shelf completion glow and bounce.
- Combo ladder:
  - combo 1: small sparkle;
  - combo 2: bigger sparkle + badge;
  - combo 3+: burst, pitch increase, bigger haptic;
  - combo 5/8/10: special chest/streak notification because combo coins are already granted.
- Objective flyouts.
- Hidden reveal drawer animation.

Acceptance criteria:

- Triple clear is the main reward moment.
- Combo escalation is visible and audible.
- Hidden reveal feels like discovery.
- Objective progress is understandable without opening a panel.

### P0 — Puzzle Complete Drawer

Likely files: `GameApp.ts`, `styles.css`, new `src/ui/RewardDrawer.ts`, `ThreeBoardView.ts`.

Tasks:

- Add full-screen reward overlay that is game-styled, not a browser dialog.
- Add drawer open animation.
- Add star landing using `calculateStars`.
- Add coin count-up and coin fly-to-wallet.
- Add win streak, pass XP, event, and album reveal beats.
- Add `Double coins` and `Next` after rewards land.
- Keep Album, Events, Map secondary buttons visually subordinate.
- Add tap-to-speed-up behavior.

Acceptance criteria:

- Level complete never opens as a plain static grid first.
- Drawer clearly communicates coins, stars, streak, album/pass/event progress.
- `Next` is visible and tappable after rewards land.
- Rewarded double offer appears as a premium button.
- Ads do not interrupt reward ceremony.

### P1 — Modern mobile game UI reskin

Tasks:

- Add design tokens: `--ui-radius-xl`, `--ui-stroke`, `--ui-shadow-soft`, `--ui-shadow-hard`, `--currency-gold`, `--danger-red`, `--boost-blue`, `--success-green`.
- Replace text controls with SVG/icon assets.
- Replace native-looking modal with custom overlay components: `GameOverlay`, `GamePanel`, `RewardDrawer`, `ShopPanel`, `EventPanel`, `AlbumPanel`, `PausePanel`.
- Add button states: idle, pressed, disabled, attention glow, sold-out, recommended.
- Give board a background scene.
- Add game-styled loading screen with progress bar and product icons.

Acceptance criteria:

- No main gameplay control uses a single-letter visible label.
- No primary panel looks like a default web modal.
- Screenshot of first level reads as a mobile game within one second.
- UI works at 320 px width with safe-area insets.

### P1 — Audio and haptics pass

Current oscillator beeps are useful for a prototype but not retention-grade polish.

Tasks:

- Create `AudioService` with reusable context, volume settings, and audio sprite support.
- Add SFX: select, invalid, lift, snap, pair, triple clear, combo tier, drawer open, star land, coin count, booster activate, win, loss.
- Vary pitch slightly across repeated clears.
- Add `HapticsService` and sync haptics to animation beats.
- Keep haptics optional and disabled if unsupported.

Acceptance criteria:

- Audio does not create a new `AudioContext` per feedback event.
- SFX can be muted in settings.
- Haptics are synchronized with visual beats.
- Reduced-motion still keeps audio/haptic feedback unless separately disabled.

### P1 — Booster juice

| Booster | Visual upgrade |
|---|---|
| Hint | Spotlight trail from source to target, pulsing outline, friendly hand/arrow. |
| Shuffle | Goods lift into a swirl, shuffle tornado, settle with bounce. |
| Hammer | Hammer swings down, cracks blocker/product, shards/sparkles. |
| Freeze Time | Timer encased in ice, frosty wave across HUD. |
| Extra Shelf | New shelf slides in, locks into board with sparkle. |

Acceptance criteria:

- Every booster has unique animation, sound, and haptic identity.
- Booster effect is understandable without reading a toast.
- Unusable boosters explain visually why.

---

## Gameplay tuning roadmap

Do not add more levels until the first 30 feel excellent.

First 10 target pacing:

- Level 1: instant triple payoff within first 2 moves.
- Level 2: introduce moving to an empty slot.
- Level 3: introduce reserve shelf safely.
- Level 4-5: teach pair creation and smart targeting.
- Level 6-7: reveal hidden layer as drawer discovery.
- Level 8: first combo objective.
- Level 9: first light blocker.
- Level 10: first hard-level ceremony with bigger reward.

Rules:

- No early level should have a long dry spell without a triple clear.
- Add near-win recovery moments but avoid unfair jam states.
- Add at least one memorable clear cascade in the first session.
- Make hidden queue planning the signature mechanic: the player should feel clever when revealing the right shelf.

Acceptance criteria:

- First session has a triple clear within 30 seconds.
- First hidden reveal is visually impressive.
- First loss teaches a rescue path.
- Every level has a defined emotional beat: first match, reveal, cascade, combo, rescue, blocker release, or tight finish.

---

## Meta and retention roadmap

The current meta systems exist, but need visual payoff.

1. **Daily Order**
   - Show as a visible order card near objective row/map.
   - Animate items into the order card when cleared.
   - Complete order opens a parcel/chest.

2. **Collection Album**
   - First-time SKU clear shows `New item discovered` card.
   - Album categories use visual pages, not plain boxes.
   - Category completion grants chest or shelf theme.

3. **Win Streak**
   - Show streak as flame/ribbon in HUD.
   - Every third win opens a streak chest.
   - Do not hide streak rewards only in text.

4. **Pass XP**
   - Fill pass progress with satisfying animation.
   - Pass level-up has distinct reward reveal.

5. **Events**
   - Event cards need themed art, timers, progress, prize previews.
   - Events should reuse existing mechanics before adding new rules.

### Ethical retention guardrails

- Do not put forced ads immediately before the player sees their win reward.
- Do not make item readability worse to increase booster use.
- Do not hide essential controls behind confusing icon-only UI; icons still need labels/tooltips/aria text.
- Difficulty should create `I can solve this` tension, not `the game cheated me` frustration.
- Use telemetry to tune fairness, not exploit frustration.

---

## Engineering implementation map

### `src/app/GameApp.ts`

- Import `cloneBoard`.
- Add `isAnimating` state.
- In `handleMove`, clone previous state before applying move.
- Convert move handling to async animation-safe flow.
- Do not call `afterResolution` until visual move/clear/reveal beats have played or been skipped.
- Replace first win presentation with `openRewardDrawer`.
- Keep old win panel only as fallback/debug until the drawer is stable.

### `src/presentation/ThreeBoardView.ts`

- Stop deleting all dynamic children for every visual change.
- Maintain object registries:
  - `productViewsByInstanceId`;
  - `shelfViewsByCompartmentId`;
  - `targetViewsByCompartmentCell`.
- Add world-position helpers.
- Add move, clear, reveal, booster, invalid, and finale animations.
- Add lightweight particle system.
- Add visual layers: board meshes, highlights, particles, screen-space effects.
- Keep `renderBoard` for initial render and hard sync.

### `src/domain/board.ts`

- Domain logic is mostly ready.
- Consider extending `ResolutionResult` with visual event metadata:
  - actual source cell;
  - actual target cell after smart targeting;
  - clear location cells;
  - blocker releases with exact cells;
  - reveal entering cells.
- Do not put animation logic in the domain.

### `src/styles.css`

- Add design tokens and game UI primitives.
- Replace web modal styling.
- Add overlay, drawer, reward, chest, album, event, and button animation classes.
- Add reduced-motion CSS branches.
- Add small-screen layout review.

### Suggested new files

- `src/presentation/AnimationDirector.ts`
- `src/presentation/VisualEvents.ts`
- `src/presentation/ParticleSystem.ts`
- `src/services/audio.ts`
- `src/services/haptics.ts`
- `src/ui/GameOverlay.ts`
- `src/ui/RewardDrawer.ts`
- `src/ui/IconButton.ts`
- `src/ui/ObjectiveChip.ts`
- `src/ui/BoosterDock.ts`

---

## Dev ticket backlog

### P0 — Must do before any appeal test

- [ ] Add animation timeline/event system.
- [ ] Animate product selection, move, snap, and invalid return.
- [ ] Animate triple clears with particles, sound, and haptics.
- [ ] Animate hidden shelf reveals.
- [ ] Add Puzzle Complete Drawer.
- [ ] Replace win panel as first completion experience.
- [ ] Add input lock and animation skip/fast-forward.
- [ ] Add reduced-motion support for all new animation.
- [ ] Replace single-letter HUD/booster controls with icons.
- [ ] Remove native-looking modal from main win flow.

### P1 — Needed for premium feel

- [ ] Full game UI reskin.
- [ ] Audio service with reusable context and real SFX pipeline.
- [ ] Booster-specific animations.
- [ ] Objective fly-to-chip animations.
- [ ] Coin/star/pass/streak reward count-up animations.
- [ ] Map/event/shop/album game-styled panels.
- [ ] Screenshot-based visual QA for game shell.

### P2 — Needed for retention tuning

- [ ] Improve first 10 levels with emotional beats.
- [ ] Add daily order visual loop.
- [ ] Add collection card reveal.
- [ ] Add streak chest ceremony.
- [ ] Add event progress animations.
- [ ] Add telemetry for animation skip, drawer dwell, booster prompt clicks, retry reasons.

### P3 — Later polish

- [ ] Seasonal shelf themes.
- [ ] Character/mascot guide.
- [ ] Cosmetic shelf skins.
- [ ] Advanced camera moves.
- [ ] Expanded event modes.

---

## Metrics to add

| Metric | Why it matters |
|---|---|
| `first_clear_seconds` | Measures how quickly the player gets the first dopamine hit. |
| `move_to_clear_ratio` | Detects boring/dry levels. |
| `animation_skip_rate` | Shows if reward ceremony is too slow or annoying. |
| `drawer_dwell_seconds` | Measures completion reward engagement. |
| `objective_chip_clicks` | Shows whether objectives are unclear. |
| `invalid_move_rate` | Detects tap target/readability issues. |
| `hint_after_invalid_rate` | Detects confusion. |
| `booster_prompt_accept_rate` | Measures booster value and fairness. |
| `loss_reason_distribution` | Helps tune timers, blockers, reserves. |
| `first_session_level_reached` | Core onboarding health. |
| `level_1_to_5_completion_rate` | Early funnel health. |
| `clear_animation_fps_bucket` | Ensures polish does not destroy performance. |

---

## QA acceptance checklist

- [ ] Every successful move has visible travel.
- [ ] Every triple clear has animation, particles, sound, and haptics when enabled.
- [ ] Hidden reveal is animated and understandable.
- [ ] Puzzle Complete Drawer appears after every win.
- [ ] Win rewards visibly travel/count/fill before `Next`.
- [ ] No major gameplay UI button is text-only or single-letter-only.
- [ ] No primary flow uses a default-looking browser dialog.
- [ ] Reduced-motion mode works and remains satisfying.
- [ ] Game is usable at 320 px width.
- [ ] Game is readable on small phone screens.
- [ ] Tap targets are forgiving.
- [ ] Animations do not block emergency skip/next behavior.
- [ ] Haptics and SFX can be disabled.
- [ ] Visual performance remains smooth on mid-tier mobile hardware.
- [ ] Playwright visual tests cover: start level, select item, valid move, triple clear, win drawer, loss panel, shop, map, settings.

---

## Definition of done for appealing and addictive

This pass is done when a 5-minute playtest produces these reactions:

1. The player understands what to do without reading long instructions.
2. The player smiles or comments after the first clear.
3. The player notices and anticipates the hidden shelf reveal.
4. The player recognizes a combo as more exciting than a normal clear.
5. The player understands rewards from the completion drawer.
6. The player describes the interface as a game, not a website.
7. The player wants to play one more level.

If any answer is no, do not add more content yet. Fix feel first.

---

## Suggested implementation order

1. Animation architecture.
2. Move and snap.
3. Triple clear.
4. Hidden reveal.
5. Puzzle Complete Drawer.
6. HUD/booster icon reskin.
7. Audio/haptics service.
8. Booster animations.
9. Meta reward animations.
10. First 10 level pacing pass.
11. QA + metrics pass.

This order is deliberate. Do not start with shop, events, or more levels. The core sorting loop must feel amazing first.

---

## Source notes

Inputs reviewed:

- Existing repo files: `README.md`, `Sorting_Game_Studio_Audit_and_V2_Spec.md`, `src/app/GameApp.ts`, `src/presentation/ThreeBoardView.ts`, `src/domain/board.ts`, `src/styles.css`, `package.json`.
- Genre references: shelf/goods sorting games, 3D triple matching games, and mainstream mobile puzzle games with strong reward, event, chest, collection, and UI ceremony loops.
