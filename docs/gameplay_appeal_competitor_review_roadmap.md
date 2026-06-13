# Gameplay Appeal, Competitor Benchmark, and Juice Roadmap

_Date: 2026-06-13_  
_Audience: design, engineering, art, audio, product, QA_  
_Status: dev-ready roadmap for turning the current vertical slice into a modern mobile puzzle game experience_

## Executive summary

The current `Shelf Sort 3D` vertical slice has a solid gameplay domain foundation, deterministic move resolution, boosters, objectives, analytics scaffolding, generated SKU art, local services, and tests. It does not yet feel like a modern mobile game. It feels like a functional web prototype with a Three.js board inside a browser UI.

The gap is not primarily the rules. The gap is emotional feedback: tactile movement, satisfying clears, reward choreography, polished UI art, premium object readability, audio layering, haptics, and a completion flow that makes players want one more level.

The next development phase should stop expanding feature count and instead make every successful action feel better. The target is a high-retention, dopamine-rich, but fair puzzle loop:

1. **See the clutter.** The board should look like a toy-like premium shelf diorama, not a web canvas surrounded by generic buttons.
2. **Touch a product.** The product should lift, squash, glow, and preview where it can go.
3. **Make a smart move.** The item should fly/snap to the shelf with a satisfying bounce and haptic tick.
4. **Complete a triple.** The shelf should celebrate with anticipation, pop, particles, sound, combo feedback, and reward flight.
5. **Reveal the next layer.** Hidden goods should slide forward physically like a real shelf queue.
6. **Complete the puzzle.** A full-screen game-style completion drawer should slide in, count rewards, fill streak/event tracks, and push the player into the next level.

No more major content expansion should happen until these feelings are in place.

---

## Reference set reviewed

The closest commercial references are modern mobile 3D match/sort games, plus organization games that prove the satisfaction of tidying and completion.

### Triple Match 3D

Relevant takeaways:

- It positions the loop as clearing clutter, matching triplets, discovering hidden objects, and enjoying a satisfying sense of progress.
- It uses realistic/stylized 3D items, timers, boosters, events, travel themes, offline play, and regular content updates.
- Its store presence shows the genre scale: Google Play lists 10M+ downloads and the App Store page shows hundreds of thousands of ratings.
- It also exposes a risk: player reviews complain when objects become hard to distinguish or timers/rewards feel too tight. Readability and fairness matter as much as monetization.

### Match Factory!

Relevant takeaways:

- It uses the same broad promise: connect identical items, sort objects, clear the board, beat timed levels, use boosters, and return daily.
- It is explicitly positioned around daily habit, relaxation plus time pressure, offline play, boosters, and frequent new item packs.
- Google Play lists 10M+ downloads and a large review base, which confirms that the 3D object sorting/matching audience is substantial.
- Its messaging leans heavily on polished 3D items, fast level completion, and a constant supply of new collectable objects.

### Wilmot's Warehouse and Unpacking

These are not direct free-to-play competitors, but they are useful references for the emotional core of this game: organization feels good when the objects are readable, movement is pleasant, and the final ordered state feels earned.

Relevant takeaways:

- Wilmot's Warehouse shows that categorizing and retrieving objects can remain satisfying when visual communication is strong and when the game balances calm repetition with time pressure.
- Unpacking is a strong reference for sensory detail: it is known for unique item-placement foley at very high volume. Shelf Sort should not imitate its genre, but it should learn from the principle that every object interaction can have a tiny sensory signature.

### Game feel / juice principle

Game feel research and practitioner vocabulary consistently frame satisfying interaction around input, response, aesthetics, context, amplification, and support. For this project, that translates to: low-latency touch handling, animated feedback, clear intent preview, consequence amplification, and helpful recovery when players make mistakes.

---

## Current implementation findings

### What is already strong

- `README.md` confirms the project has 30 handcrafted launch levels, 40 SKU assets, deterministic TypeScript gameplay rules, boosters, telemetry event names, local save/economy/ads mocks, tests, and browser visual verification.
- `src/domain/board.ts` has clean domain separation: legal move checks, move resolution, triple clears, hidden layer reveal, timer loss, win detection, star calculation, and move-quality classification.
- `src/app/GameApp.ts` already tracks move quality, clears, combos, hidden reveals, wins/losses, collection drops, events, pass XP, reward doubling, revive offers, settings, consent, and local test hooks.
- `src/presentation/ThreeBoardView.ts` renders a real 3D board with shelves, product meshes, hidden-layer previews, target picking, legal highlights, hints, tap/drag input, pixel-ratio handling, shadows, and reduced-motion support.
- `src/styles.css` is mobile-first, safe-area aware, and has a working HUD, objective row, booster row, toast, dialog, and responsive sizing.

This is a good prototype foundation.

### Why it does not yet feel like a modern game

1. **Moves resolve instantly.** `handleMove()` applies the domain move and then `afterResolution()` rerenders the board. The player does not see the item travel, snap, settle, or cause a chain reaction.
2. **Triples disappear without ceremony.** `resolveAffected()` clears triples in the domain, but the presentation layer only sees the post-resolution state. There is no anticipation, shake, scale, sparkle, coin flight, combo burst, or shelf bounce.
3. **Hidden layers appear by rerender, not reveal.** Hidden goods should slide forward from the rear of the shelf. Currently the board is rebuilt after state changes.
4. **The win surface is a web modal.** `openWinPanel()` renders a standard panel in a `<dialog>`. It is functional, but not memorable. It should become the emotional climax of the level.
5. **UI still reads as a website.** Generic button shapes, text labels like `M`, `S`, `H`, `F`, `II`, plain dialog panels, and flat reward grids communicate prototype/web app rather than mobile game.
6. **Feedback is mostly audio/haptic only.** `feedback()` vibrates and plays a short oscillator tone, but does not coordinate visual effects. Real game feel requires all three layers: visual, audio, haptic.
7. **Products need more premium identity.** Procedural shapes and SVG art are useful, but the genre depends on instant object recognition at small sizes. Each SKU needs silhouette, color, icon, and category clarity.
8. **Objective/reward surfaces lack drama.** Coins, stars, streaks, pass XP, events, and album progress are present, but they do not animate as a cohesive reward sequence.
9. **Invalid moves are generic.** `invalidMove()` always says the shelf spot is not valid. The domain already returns specific reasons; the UI should teach with specific copy and localized micro-feedback.
10. **No visual progression pressure.** Timer urgency has a pulse, but there is no board-level tension ramp, last-10-seconds treatment, near-complete celebration, or combo opportunity cue.

---

## Product goal

The game should feel like **a premium toy supermarket shelf sorter**: chunky, bright, readable, tactile, and rewarding. Every successful move should make the player feel a tiny release. Every completed shelf should create a bigger release. Every completed puzzle should feel like opening a reward drawer.

The UI must look like a game layer over a playful 3D diorama. It should never look like a website with rectangular buttons and modal dialogs.

### Experience pillars

| Pillar | Meaning | Player-facing result |
|---|---|---|
| Tactile sorting | Every product behaves like a physical toy | Lift, drag/fly, snap, bounce, settle |
| Clear readability | Objects are recognizable instantly | No guessing tiny SKUs, no visual clutter confusion |
| Dopamine clears | Correct sorting is celebrated | Pop, sparkle, combo, sound, haptic, reward flight |
| Anticipatory reveal | Hidden shelves create curiosity | Back row slides forward, mystery becomes opportunity |
| Game-native UI | HUD feels like mobile game chrome | Icons, badges, animated meters, premium panels |
| Completion ritual | Win state is a mini-event | Drawer reveal, rewards count up, next-level pull |
| Fair addiction | Players want to continue because it feels good | Do not rely only on pressure, scarcity, or frustration |

---

## Roadmap

## Phase 0 — Lock the appeal target before coding

**Goal:** Align design, art, engineering, and QA on the feel target.

### Tasks

- Create a 1-page art direction board: toy supermarket, premium shelf, rounded UI, bright items, celebratory clears.
- Record 5-10 short reference clips from Triple Match 3D, Match Factory, and one organization game.
- Define timing targets:
  - Product lift: 80-120 ms.
  - Product fly/snap: 160-240 ms.
  - Shelf settle bounce: 100-160 ms.
  - Triple clear celebration: 450-750 ms.
  - Hidden reveal slide: 300-500 ms.
  - Full puzzle complete sequence: 2.0-3.5 seconds before the Next CTA becomes primary.
- Add a `docs/visual_feel_acceptance_checklist.md` later with video/GIF acceptance criteria.

### Definition of done

- The team can answer: “What should a correct sort feel like?” in one sentence.
- Everyone agrees that the build is not shippable until the first 10 levels feel satisfying on mute and with sound.

---

## Phase 1 — Add an animation command layer

**Goal:** Stop rebuilding the board immediately after every move. The presentation must receive an ordered list of visual consequences.

### Engineering direction

Add an animation pipeline between domain resolution and board rerender.

Recommended new files:

- `src/presentation/BoardAnimator.ts`
- `src/presentation/effects/ParticleBurst.ts`
- `src/presentation/effects/RewardFlight.ts`
- `src/services/audio.ts`
- `src/services/haptics.ts`

Recommended changes:

- In `ThreeBoardView`, keep stable object IDs for visible products instead of recreating all dynamic objects every render.
- Add methods such as:
  - `animateMove(move, product, quality): Promise<void>`
  - `animateTripleClear(clear): Promise<void>`
  - `animateHiddenReveal(reveal): Promise<void>`
  - `animateInvalidMove(reason): void`
  - `animateBoosterUse(boosterId, result): Promise<void>`
  - `animateWinFinale(summary): Promise<void>`
- In `GameApp.handleMove()`, apply the domain move, but pass both the pre-state and `ResolutionResult` to the board animator before the final `renderBoard()` reconciliation.
- Add a simple animation queue so rapid taps cannot corrupt state.
- Respect `reduceMotion`: replace large movement/particles with fades, small scale changes, and shorter timing.

### Definition of done

- A product visibly moves from source to target before state reconciliation.
- Triple clears are visible before the shelf is empty.
- Hidden layers visibly slide forward.
- No input is accepted while the board is in a critical animation unless deliberately buffered.
- Browser tests can wait for `window.__SHELF_SORT_TEST__.isAnimating()` or equivalent.

---

## Phase 2 — Make correct sorting addictive

**Goal:** Every correct sort should produce layered feedback.

### Correct move sequence

1. Tap product: product lifts 8-12%, outline/glow appears, legal slots pulse softly.
2. Drop target: product arcs or slides to target, shadow stretches, product rotates slightly.
3. Snap: target shelf gives a small bounce, product squash-stretches, haptic tick fires.
4. Move quality feedback:
   - `good`: small green tick/spark.
   - `match_ready`: stronger glow and “Nice!” badge.
   - `reveal_enabling`: rear shelf shimmer.
   - `risky`: subtle amber warning and soft “careful” pulse.
5. If no triple, return to normal quickly so the game remains fast.

### Triple clear sequence

1. Anticipation: three matched products wiggle together for 120 ms.
2. Alignment: products pull into a tidy row or triangular cluster.
3. Pop: products scale up, flash rim light, then vanish into particles.
4. Reward: three tiny coins/stars/shine dots fly to the HUD.
5. Combo: combo badge bursts above shelf if combo > 1.
6. Reveal: if hidden goods exist, back-row items slide forward with shelf-depth shadow.

### Combo escalation

- Combo 1: clean pop.
- Combo 2: brighter particles, “Combo x2”.
- Combo 3: camera micro-zoom, stronger sound layer.
- Combo 5+: gold shelf burst, temporary border glow, extra coin flight.
- Combo 8+: “Shelf Streak!” banner and collection-card chance preview.

### Definition of done

- A player can tell the difference between a neutral move, good move, match-ready move, risky move, and reveal-enabling move without reading text.
- Correct sorting feels rewarding even before the level ends.
- The first triple clear in Level 1 feels good enough to use in a store preview clip.

---

## Phase 3 — Build the Puzzle Complete Drawer

**Goal:** Replace the current `Level Complete` modal with a game-native completion ritual.

### Proposed sequence

1. Final triple clears.
2. Board pauses for a 250 ms “clean shelf” beat.
3. Camera/board subtly zooms or shelf lights sweep across the empty board.
4. A bottom drawer slides up from below the screen, like opening a prize drawer or checkout drawer.
5. The drawer contains:
   - Big title: `Puzzle Complete!`
   - Three stars that stamp in one by one.
   - Coin count-up with flying coins from board to drawer.
   - Streak meter fill.
   - Event/daily order progress fill.
   - Collection album card reveal if a new SKU/category card was earned.
   - Pass XP/progress meter.
   - Rewarded `Double Coins` button presented as a shiny bonus slot, not a plain web button.
   - Primary `Next Level` CTA that animates/pulses after rewards finish.
6. Optional final drawer flourish: drawer closes partially and reopens with a chest every 3-win streak.

### Required UI treatment

- No native `<dialog>` look.
- Rounded, chunky, layered panel with bevels, shadows, star slots, animated counters.
- Full-screen dim with confetti/particle layer.
- Background board remains visible, blurred or darkened, to keep game context.
- Use iconography for coins, stars, streak, album, event, pass XP.

### Definition of done

- The win surface is visually distinct from settings/shop/info panels.
- The reward count-up is impossible to miss.
- The player understands what they earned and what will progress next.
- The `Next` button feels like the obvious next action after the celebration, not another website button.

---

## Phase 4 — Replace website-like UI with game-native HUD

**Goal:** Make the whole shell read as a mobile game.

### Current issues to fix

- Top-left `M`, pause `II`, booster letters `S/H/F`, and text-heavy buttons look placeholder.
- Rectangular 8px-radius panels feel web-like.
- Dialogs are plain panels with plain grids.
- HUD lacks depth, iconography, and motion.
- The board is not framed as a world or shelf cabinet.

### New UI direction

- Replace letters with SVG/PNG game icons.
- Use chunky pill panels, bevels, glossy highlights, and badge counters.
- Turn the timer into a prominent capsule with progress ring/bar and urgency states.
- Use coin/star icons with animated count changes.
- Make boosters circular toy buttons with inventory badges and cooldown/disabled states.
- Add a shelf/world frame behind the Three.js board: soft vignette, countertop, store backdrop, depth shadows.
- Build custom overlay components:
  - `GameOverlayManager`
  - `WinDrawer`
  - `LoseRescuePanel`
  - `ShopPanel`
  - `MapPanel`
  - `SettingsPanel`
- Use the same design language across all panels, but reserve the most celebratory treatment for win/combo/chest moments.

### Definition of done

- A screenshot with no gameplay movement still looks like a polished mobile puzzle game.
- No primary gameplay control is represented by a plain letter.
- Panels feel like game objects, not HTML dialogs.
- UI remains readable at 320px width and on high-DPI phones.

---

## Phase 5 — Upgrade product art and shelf readability

**Goal:** Make sorting visually satisfying and fair.

### Product readability rules

Every SKU must pass a small-size recognition test:

- Recognizable at 44-56 px on a mid-density phone screenshot.
- Unique silhouette inside its category.
- Distinct color and accent grouping.
- No two active SKUs in early levels should share the same dominant color and shape.
- Label/icon area must face the camera and remain legible during idle animation.
- Hidden previews must be distinguishable from front products without becoming invisible.

### Art direction

- Replace purely procedural primitive feel with toy-like, rounded, semi-premium goods.
- Add category-specific shelf themes: breakfast, toys, drinks, snacks, bathroom, travel.
- Add rare/special products with visual flags: ribbon, glitter, sticker, frost, tape.
- Add shelf materials and depth: back panel, side supports, soft shadows, labels, small price tags.

### Definition of done

- A non-developer can identify all visible products in the first 10 levels without explanation.
- Player reviews/playtest notes do not mention “I could not tell what object that was.”
- Screenshots are strong enough for App Store / Google Play creatives.

---

## Phase 6 — Improve failure and rescue psychology

**Goal:** Loss should feel recoverable and instructive, not random or punishing.

### Current problem

The domain has nuanced fail reasons, but the visible UX remains basic. Competitor reviews show that players tolerate challenge, but they react badly when hard timers, poor rewards, or unclear objects make a level feel unfair.

### Required panels

- Timeout:
  - Show remaining target count.
  - Offer `+45s`, `Freeze Time`, or retry.
  - Copy: “You were 2 goods away.”
- Board jammed:
  - Highlight the jammed area.
  - Offer `Shuffle` or `Extra Shelf`.
- Reserve mismanagement:
  - Show “Free a shelf to keep sorting.”
  - Offer `Extra Shelf`.
- Blocker remaining:
  - Highlight blocker.
  - Offer `Hammer`.
- Unclear target remaining:
  - Show target product icons.
  - Offer targeted hint.

### Definition of done

- Each fail reason maps to a specific visual explanation and rescue offer.
- The player always knows why they failed.
- Rescue offers feel helpful, not random.

---

## Phase 7 — Build a fair retention loop around satisfaction

**Goal:** Encourage repeat play with visible progress instead of frustration-only pressure.

### Add/upgrade loops

- **Daily order:** clear specific categories/SKUs for bonus coins and a small visual order ticket.
- **Collection album:** new SKU card drops should animate after clears and especially in the win drawer.
- **Streak chest:** every 3 wins fills a chest; every 5 wins gives a stronger reward.
- **Event progress:** mini-events should be visible on win, not hidden in panels.
- **Chapter map:** should be a game board/path with nodes, locks, chests, and challenge levels.
- **Soft difficulty labels:** Hard/Super Hard levels should promise bigger rewards and use stronger intro banners.

### Definition of done

- Completing a level advances at least two visible progress tracks.
- The player sees the next desirable reward before tapping Next.
- Events and album progress are not just menu panels; they are part of the win loop.

---

## Phase 8 — Audio and haptics pass

**Goal:** Replace temporary oscillator-only feedback with a designed audio/haptic stack.

### Required sound layers

- Product pickup.
- Product snap/drop.
- Invalid wobble.
- Triple anticipation.
- Triple pop.
- Coin flight/count-up.
- Hidden reveal slide.
- Combo badge.
- Booster-specific sounds.
- Win drawer open.
- Star stamp.
- Streak chest.
- Timer urgency.

### Technical direction

- Keep Web Audio fallback for the web build, but add proper audio asset loading.
- Add volume groups: music, SFX, UI.
- Add haptic patterns per event.
- Ensure iOS/Android wrapper plans account for native haptics later.
- Respect settings and reduced-motion/low-sensory mode.

### Definition of done

- The game feels understandable with audio on.
- It still feels good on mute because visual feedback carries the loop.
- Haptics never fire continuously or aggressively.

---

## Phase 9 — QA, metrics, and acceptance gates

**Goal:** Make “feels good” measurable enough to ship.

### New QA checks

- Capture short video/GIF for Level 1 first clear, first hidden reveal, first win drawer, first loss rescue.
- Add visual regression tests for HUD layout and win drawer layout.
- Add animation-state tests to ensure no stuck input lock.
- Add reduced-motion test path.
- Add low-end device/browser performance sampling.

### Telemetry to add

- `first_clear_time_ms`
- `clear_animation_seen`
- `win_drawer_opened`
- `win_drawer_next_tap_delay_ms`
- `rewarded_double_impression_after_drawer`
- `rewarded_double_accept_after_drawer`
- `invalid_reason_shown`
- `booster_prompt_from_fail_reason`
- `settings_reduce_motion_enabled`
- `tap_miss_rate`
- `drag_cancel_rate`
- `level_quit_during_animation`

### Human playtest questions

Ask players after Levels 1, 3, 7, and 10:

1. Did the correct sort feel satisfying?
2. Could you tell what cleared and why?
3. Did the hidden reveal feel exciting or confusing?
4. Did the win screen feel like a reward?
5. Did any button or panel feel like a website instead of a game?
6. Did you want to play one more level?

### Definition of done

- 80%+ of testers answer yes to “Did you want to play one more level?” after Level 3.
- 90%+ understand why triples clear without instruction.
- No top-3 complaint mentions object readability, web-like UI, or unclear win rewards.

---

## Implementation backlog

| Priority | Area | Task | Primary files |
|---|---|---|---|
| P0 | Animation architecture | Add animation queue and stable product object mapping | `src/presentation/ThreeBoardView.ts`, new `BoardAnimator.ts` |
| P0 | Move feel | Add lift, legal target glow, fly/snap, shelf bounce | `ThreeBoardView.ts`, `BoardAnimator.ts` |
| P0 | Triple clear | Add anticipation, pop, particles, reward flight | `BoardAnimator.ts`, new `effects/*` |
| P0 | Reveal feel | Animate hidden layer slide-forward | `ThreeBoardView.ts`, `BoardAnimator.ts` |
| P0 | Win flow | Replace win dialog with Puzzle Complete Drawer | `src/app/GameApp.ts`, new `WinDrawer` overlay, `styles.css` |
| P0 | UI icons | Replace placeholder text controls with icons | `public/assets/ui/*`, `GameApp.ts`, `styles.css` |
| P1 | Audio | Add proper SFX service and asset hooks | new `src/services/audio.ts` |
| P1 | Haptics | Centralize haptic patterns | new `src/services/haptics.ts` |
| P1 | Invalid feedback | Map domain reasons to visual coaching | `GameApp.ts`, `ThreeBoardView.ts` |
| P1 | Product readability | Audit and upgrade SKU silhouettes/colors | `scripts/generate-content.mjs`, `public/assets/skus/*` |
| P1 | Lose panels | Build reason-specific rescue panels | `GameApp.ts`, overlay components |
| P1 | Event/reward progress | Animate album/event/pass/streak in win drawer | `GameApp.ts`, overlay components |
| P2 | Chapter map | Replace simple level buttons with node path | `GameApp.ts`, `styles.css` |
| P2 | Booster UX | Booster preview animations and better disabled states | `GameApp.ts`, `ThreeBoardView.ts` |
| P2 | QA | Add video/visual acceptance tests | `tests/browser/*` |

---

## First sprint proposal

The first sprint should produce a visible improvement immediately.

### Sprint objective

Make Level 1’s first triple and completion sequence feel like a modern game moment.

### Sprint scope

1. Add animation queue.
2. Animate product move and snap.
3. Animate triple clear with pop and particles.
4. Add simple coin/star reward flight to HUD.
5. Replace win modal with first version of bottom Puzzle Complete Drawer.
6. Replace text-only booster/menu/pause placeholders with temporary icon assets.
7. Add QA capture for Level 1 first clear and win drawer.

### Out of scope for first sprint

- New levels.
- New monetization logic.
- Real ad/IAP SDK integration.
- Full chapter map redesign.
- Large SKU expansion.

### Sprint definition of done

- A 10-second gameplay clip of Level 1 looks good enough to show externally as an early product direction.
- The win drawer no longer looks like a browser dialog.
- The first successful triple produces visible anticipation, pop, sound/haptic, reward movement, and a clean state transition.

---

## Risks and cautions

- **Do not make the game slower.** Juice should be fast and skippable after the player has seen it. Add tap-to-accelerate for reward count-ups after the first few levels.
- **Do not hide clarity behind effects.** Particles should reinforce clears, not obscure products.
- **Do not overuse frustration.** Timers and fail states can drive retention, but unclear objects and stingy rewards create negative reviews.
- **Do not ship web placeholders.** If an icon is missing, use a temporary game-style icon, not a letter.
- **Do not expand level count during this pass.** More levels will not fix weak feel.
- **Do not break deterministic gameplay.** Animation must be a presentation layer over deterministic state, not a second source of truth.

---

## Source notes

These sources informed the benchmark and recommendations:

- Triple Match 3D on Google Play: https://play.google.com/store/apps/details?id=com.master.triple3d.find
- Triple Match 3D on the App Store: https://apps.apple.com/us/app/triple-match-3d/id1607122287
- Match Factory! on Google Play: https://play.google.com/store/apps/details?id=net.peakgames.match
- Triple Match 3D overview and genre notes: https://en.wikipedia.org/wiki/Triple_Match_3D
- Wilmot's Warehouse overview: https://en.wikipedia.org/wiki/Wilmot%27s_Warehouse
- Unpacking overview: https://en.wikipedia.org/wiki/Unpacking_(video_game)
- Game feel overview: https://en.wikipedia.org/wiki/Game_feel
- Pichlmair and Johansen, `Designing Game Feel: A Survey`: https://arxiv.org/abs/2011.09201

Repo files reviewed:

- `README.md`
- `Sorting_Game_Studio_Audit_and_V2_Spec.md`
- `package.json`
- `src/app/GameApp.ts`
- `src/domain/board.ts`
- `src/presentation/ThreeBoardView.ts`
- `src/styles.css`
