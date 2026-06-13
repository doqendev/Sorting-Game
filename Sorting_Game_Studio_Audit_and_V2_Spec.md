---
title: "Sorting Game - Studio Audit and V2 Production Specification"
subtitle: "Highly critical product, design, engineering, LiveOps, and monetization mandate"
author: "Prepared for Quim and the Sorting Game development team"
date: "2026-06-12"
---

# Sorting Game - Studio Audit and V2 Production Specification

## Executive verdict

The current `doqendev/Sorting-Game` repo proves the team can turn a design brief into a playable prototype quickly. That is valuable. It is not close to a mainstream mobile puzzle studio quality bar.

The dangerous part is that the repository looks broad: 500 launch levels, 1,000 backlog levels, 200 SKUs, boosters, ads, IAP, collections, daily rewards, remote config, analytics, consent, save, cloud mock, and tests. In practice, many of these are labels, mocks, local-only scaffolds, or generated placeholders. A mainstream studio would not treat this as a soft-launch candidate. It would treat it as a proof-of-concept that now needs hard production discipline.

The next phase must be narrower, higher quality, and more measurable. The target is not to add more feature names. The target is to build a game that can survive the current mobile puzzle market: excellent readability, tactile interaction, strong loss/retry psychology, tuned difficulty, validated content, real SDKs, real data, and a LiveOps calendar.

## Current grade

| Area | Prototype grade | Production/mobile grade | Verdict |
|---|---:|---:|---|
| Core shelf-sorting loop | B | C- | Playable, but strategically shallow. |
| Hidden shelf queue mechanic | C | D | Present visually, but currently not used as a meaningful planning system. |
| Level generation | C | F | Produces many levels, not necessarily good levels. |
| Level validation | C- | F | Current validation trusts generated metadata too much. |
| Art/readability | C- | F | Procedural primitives are not enough for a visual-sort puzzle. |
| UX/feel | D | F | Functional UI, very little juice, coaching, feedback, or delight. |
| Meta systems | C- | D- | Collections/events exist as panels, not as compelling loops. |
| Ads/IAP | D | F | Sandbox-only, no mediation, no receipt validation, no no-fill handling. |
| Analytics | C- | F | LocalStorage analytics only, no real dashboards or experiment loop. |
| QA | C | D- | Some tests exist, but not enough for mobile production. |
| Overall | C | D-/F | Good prototype; not soft-launch ready. |

## Mandatory direction

1. Treat the current build as a vertical-slice prototype, not a launch foundation.
2. Stop using generated content count as proof of progress.
3. Build 30 excellent levels before building 500 more.
4. Rework hidden queues into the signature strategic mechanic.
5. Replace placeholder visuals with production-grade readable SKUs.
6. Replace local mocks with real mobile production systems before soft launch.
7. Make analytics, validation, and dashboards mandatory gates, not optional polish.

---

# 1. What mainstream studio games do better

Mainstream sort/match mobile games are not winning because the core mechanic is complex. They win because the total product machine is strong.

Top genre competitors normally have:

- Fast first-session onboarding with no cognitive overload.
- Highly readable objects with strong silhouettes, colors, scale, and labels.
- A satisfying tactile loop: pick up, move, snap, match, clear, reveal, reward.
- Dozens of micro-animations, particles, sound effects, haptics, and state transitions.
- Level difficulty curves managed by data, not guesswork.
- Loss screens that coach and monetize without feeling abusive.
- Multiple return loops: daily rewards, collections, events, streaks, renovation/progression, limited-time goals.
- Real ad mediation and purchase validation.
- Remote config and A/B testing.
- Ongoing content operations.

The current build has the vocabulary of these systems but not the production quality. The team should be proud of the prototype speed, then be ruthless about the next stage.

---

# 2. Repository audit summary

## What is working

The repo has a clean TypeScript domain model, a deterministic board state, a playable Three.js renderer, local save, generated data files, boosters, a basic UI shell, tests, and a working local web build. This is the right kind of prototype foundation.

The strongest pieces are:

- Deterministic board state and move resolution.
- Data-driven level/content concept.
- Separate domain/presentation/service layers.
- Basic automated tests.
- A working game loop with hidden previews, triples, timer, fail/win states, boosters, and modal flow.

## What is not acceptable for production

The repo is currently a web app, not a native mobile production game. The README itself states that iOS/Android store release still requires porting or native build pipeline work plus real ads, IAP, cloud, consent SDKs, QA, and legal review.

The following are production blockers:

- Hidden layers are generated as complete triples, which can auto-clear after reveal and remove strategy.
- Most levels are formulaic `clear_all` levels.
- Validation metadata is written by generation and partially trusted by validation.
- Procedural product primitives are too weak for a mainstream object-recognition puzzle.
- UI is functional but not emotionally competitive.
- Analytics are local-only.
- Ads and purchases are sandbox mocks.
- Consent is shown, but analytics are started immediately.
- Category and special objective schema exists but is not fully implemented.
- Browser tests mostly verify nonblank rendering, not real gameplay quality.

---

# 3. Critical gameplay audit

## 3.1 Core mechanic

Current rule: move one visible product from a front cell into an empty front cell in another compartment. A compartment clears when all three visible cells contain the same SKU.

This works as a prototype. It is too flat for a full game unless levels introduce richer constraints and goals.

### Required upgrades

- Add a move-quality feedback system: good move, risky move, match-ready move, reveal-enabling move.
- Add contextual invalid-move feedback instead of generic rejection.
- Add tap precision polish, target highlighting, hover/drag preview, snap animation, and undo-friendly interaction.
- Add skill progression: the player should learn hidden previews, reserve management, blockers, order goals, and combo planning over the first 30 levels.

## 3.2 Hidden queues

This should be the signature feature. In the reference game, the disabled products behind the front row create future planning. The current generator often creates hidden layers of three identical products. When revealed, they can instantly clear. That turns strategy into cleanup.

### Required hidden queue rules

Hidden queues must follow these defaults:

- A hidden layer may contain mixed SKUs.
- Hidden items should be previewed but not always perfectly known.
- Early levels show exact dim previews.
- Mid levels use silhouette previews.
- Later levels can use mystery bags or partial preview.
- Revealing should usually create new decisions, not automatic clears.
- Automatic reveal clears are allowed only as designed cascade moments, not as the default generator behavior.

### Hidden queue design examples

Good hidden layer:

- Front: Apple, Milk, Chips
- Hidden preview: Pear, Milk, Soda
- Meaning: clearing the front reveals future Milk and forces planning.

Bad hidden layer:

- Front: Apple, Milk, Chips
- Hidden preview: Pear, Pear, Pear
- Meaning: once front is empty, the shelf clears itself. This is not a decision.

## 3.3 Loss states

Current loss states are timeout and no legal moves. These are necessary but not enough.

A mainstream version needs explicit fail reasons:

- Timeout.
- Board jammed.
- Reserve mismanagement.
- Objective not completed.
- Blocker not removed.
- Unclear target remaining.

Each fail reason should trigger a specific rescue offer and coaching message.

Examples:

- Timeout: offer `+45s` rewarded revive or freeze-time booster.
- No moves: offer extra shelf or shuffle.
- Objective fail: show the remaining target SKUs and offer a targeted hint.

## 3.4 Win flow

Current win panel is functional but not sticky. Mainstream win flows do more:

- Celebrate the final clear.
- Show stars, coins, streak, event progress, collection progress, pass XP, and next reward.
- Offer rewarded double in a way that feels valuable.
- Smoothly transition to next level without modal fatigue.

The win panel should be treated as a monetization and retention surface, not just an end screen.

---

# 4. Level design and content production

## 4.1 The current generator must be replaced

The current generator is useful for stress testing but not for launch content. It uses broad stage bands, reserve count formulas, hidden depth formulas, and patterned SKU distribution. This creates volume but not authored pacing.

The V2 pipeline must separate:

1. Level authoring intent.
2. Level generation candidate.
3. Solver validation.
4. Bot simulation.
5. Human review.
6. Telemetry-based retuning.
7. Versioned content release.

## 4.2 Launch content strategy

Do not ship 500 mediocre levels. Build:

- 30 handcrafted vertical-slice levels.
- 100 soft-launch levels after the slice is proven.
- 300 levels for first regional soft launch.
- 1,000+ only after telemetry and tooling work.

## 4.3 First 30 levels curriculum

| Level range | Goal | Mechanics |
|---|---|---|
| 1-3 | Teach moving and triple clear | No timer pressure, exact targets, no hidden layers. |
| 4-6 | Teach reserve shelves | One reserve, simple triples. |
| 7-10 | Teach hidden previews | Exact dim previews, mixed hidden layers. |
| 11-15 | Teach planning ahead | Hidden layer decisions, mild timer. |
| 16-20 | Teach blockers | Tape/crate/frost one at a time. |
| 21-25 | Teach orders | Collect specific SKUs or categories. |
| 26-30 | First hard arc | Mixed objectives, hidden queues, fair tension. |

## 4.4 Difficulty gates

Every level must have validation metrics:

- Solvable status.
- Minimum solution moves.
- Average bot solution moves.
- Bot win rate across multiple heuristics.
- Dead-end probability.
- Average reserve pressure.
- Reveal count.
- Hidden information ratio.
- Time pressure ratio.
- Booster-free win probability.
- Human review grade.

A level cannot ship if:

- It is not solved by at least two solver strategies.
- Product counts are invalid.
- It has low reserve space without intentional design.
- It can auto-clear major hidden content by default.
- Bot win rate is outside target band for its tier.
- Readability risk is high due to too many similar products.

## 4.5 Difficulty bands

| Tier | Target first-try win rate | Booster use target | Purpose |
|---|---:|---:|---|
| Tutorial | 95-99% | 0-2% | Teach and build confidence. |
| Normal | 70-85% | 5-15% | Relaxing progression. |
| Hard | 45-65% | 15-30% | Intentional friction and monetization. |
| Super hard | 25-45% | 30-55% | Event-like challenge, visible reward. |

These are starting targets. Real values must be tuned from soft-launch telemetry.

---

# 5. Art direction and readability

## 5.1 Current issue

The current renderer creates simple shapes such as boxes, bottles, cylinders, spheres, and toy-like primitives with colors and labels. This is fine for prototype logic. It is not enough for a mainstream sort puzzle.

Players must identify items instantly under time pressure. If they lose because two objects look similar or touch targets are unclear, they blame the game.

## 5.2 Production SKU requirements

Each SKU needs:

- Strong silhouette.
- Unique color palette.
- Distinct label/marking.
- Correct scale class.
- Icon and 3D model consistency.
- Readability rating.
- Similarity tags to prevent too many confusing items in the same level.
- LOD or optimized mesh for low-end devices.

## 5.3 SKU catalog plan

Vertical slice:

- 40 production SKUs.
- 4 categories: snacks, drinks, fruit, household.
- 10 items per category.

Soft launch:

- 120 production SKUs.
- 8 categories.
- 5 shelf themes.

Global launch:

- 250+ SKUs.
- Seasonal variants.
- Event-limited cosmetics.

## 5.4 Visual quality bar

Every product must pass:

- Small-screen readability test on 320px width.
- Colorblind-safe contrast review.
- Similarity test against all other SKUs in the same unlock band.
- Tap target visibility test.
- Hidden-preview readability test.

---

# 6. UX, feel, audio, and haptics

## 6.1 The current feel is underpowered

The game currently renders and reacts, but mainstream mobile puzzle games rely on feel. Every move should create micro-reward.

Required feel upgrades:

- Product pickup lift animation.
- Drag shadow and target magnetism.
- Snap-to-shelf animation.
- Match anticipation pulse when two of same SKU are in target shelf.
- Triple clear burst.
- Hidden layer slide-forward reveal.
- Combo badge and sound escalation.
- Timer urgency animation.
- Booster-specific effects.
- Soft haptics on pick/snap/clear/fail.
- Audio mix with low fatigue.

## 6.2 Onboarding

Do not start with a consent modal as the player's first emotional beat unless required. The first seconds should show the game and teach one successful move.

First-session flow:

1. Level 1 loads immediately.
2. Hand pointer shows first product.
3. Target shelf glows.
4. Player makes a guaranteed match.
5. Triple clear triggers satisfying animation.
6. Hidden mechanic appears after player understands front sorting.
7. Consent and privacy flows appear at appropriate moment and jurisdiction.

## 6.3 Accessibility

Required:

- One-hand portrait layout.
- Large touch targets.
- Reduce motion toggle that actually works.
- Colorblind-safe item differentiation.
- Clear font size on small devices.
- Haptics toggle.
- Offline support for core levels.

---

# 7. Meta, economy, and retention

## 7.1 Current meta problem

Daily reward, events, album, pass, shop, and map exist mostly as panels or static configs. They do not yet create strong retention.

The meta should be simple but emotionally useful:

- Clear levels to earn stars/tokens.
- Spend stars/tokens to renovate or unlock a supermarket/market scene.
- Clear products to collect album cards.
- Daily orders give targeted goals.
- Win streak chests reward continued play.
- Events create urgency and variety.

## 7.2 Recommended V2 meta stack

Vertical slice:

- Collection album.
- Daily reward.
- Win streak chest.
- Simple map progression.

Soft launch:

- Renovation scene.
- Daily orders.
- Treasure shelves event.
- Starter pack and remove ads.

Global launch:

- Match pass.
- Leaderboard/cohort event.
- Seasonal SKUs and themes.
- Remote content updates.

## 7.3 Economy principles

Do not make the economy feel like a punishment machine. Puzzle players tolerate ads and IAP when the game feels fair.

Rules:

- Boosters should help recover from mistakes, not be mandatory for normal levels.
- Hard/super-hard levels can increase booster demand but must be transparently labeled.
- Revive offers must match fail reason.
- Rewarded ads should give clear value.
- Interstitials should have cooldowns and never appear too early.
- Remove Ads must suppress forced interstitials and banners, not rewarded opt-ins.

## 7.4 Booster redesign

Current boosters:

- Hint.
- Shuffle.
- Hammer/Clear One.
- Freeze Time.
- Extra Shelf.

Recommended behavior:

| Booster | V2 behavior | Risk to avoid |
|---|---|---|
| Hint | Shows one high-quality strategic move and why. | Do not show useless move. |
| Shuffle | Rearranges visible items while preserving solvability. | Do not create worse deadlock. |
| Clear One | Removes selected blocker/product and updates targets correctly. | Do not break product count logic. |
| Freeze Time | Pauses timer and adds small time. | Do not make normal levels timer-only monetization. |
| Extra Shelf | Adds temporary reserve with polished layout and expiry rules. | Do not break board layout or difficulty math. |

---

# 8. Monetization and ads

## 8.1 Current state

The repo has sandbox ad and purchase services. These are useful for UI flow testing only. They are not monetization systems.

## 8.2 Required ad architecture

Implement mediation with:

- Rewarded video.
- Interstitials.
- Optional banners only if data proves value without retention harm.
- No-fill handling.
- Load timeout handling.
- Impression-level revenue data.
- Placement-level analytics.
- Cooldowns via remote config.
- Reward idempotency.
- Suppression after purchases and rewarded views.

Recommended placements:

- Rewarded revive after timeout.
- Rewarded rescue after no moves.
- Rewarded double coins after win.
- Rewarded free booster chest.
- Interstitial after level completion starting no earlier than level 8-10, with cooldown.

## 8.3 Required IAP architecture

Implement:

- Real store catalog.
- Server-side receipt validation.
- Restore purchases.
- Idempotent entitlements.
- Purchase failure/cancel handling.
- Refund awareness if possible.
- Offer segmentation.

Launch IAP:

- Remove Ads.
- Starter Pack.
- Small booster pack.
- Value booster pack.
- Piggy bank.

Do not launch match pass until the core retention loop works.

---

# 9. Analytics and experimentation

## 9.1 Current issue

LocalStorage analytics are good for development but useless for production decisions. The team needs dashboards that answer what players are doing and why they leave.

## 9.2 Required analytics events

Minimum events:

- `app_open`
- `session_start`
- `session_end`
- `level_start`
- `level_move`
- `invalid_move`
- `triple_clear`
- `hidden_layer_reveal`
- `booster_offer`
- `booster_use`
- `level_fail`
- `level_revive_offer`
- `level_revive_accept`
- `level_complete`
- `rewarded_ad_offer`
- `rewarded_ad_start`
- `rewarded_ad_complete`
- `interstitial_impression`
- `iap_offer_view`
- `iap_start`
- `iap_complete`
- `economy_grant`
- `economy_spend`
- `event_progress`
- `collection_card_drop`
- `settings_change`
- `consent_update`
- `crash`

## 9.3 Required dashboards

- Level funnel: starts, wins, losses, fail reasons, moves, time remaining, booster usage.
- Economy: sources, sinks, balances, booster inventory, revive spend.
- Ads: opportunities, impressions, fill, eCPM, rewarded completion, ARPDAU.
- IAP: views, starts, conversions, revenue, refunds if available.
- Retention: D0/D1/D3/D7, session length, levels per session.
- Performance: crashes, load time, FPS, memory.

## 9.4 A/B testing

Initial tests:

- First interstitial level: 8 vs 10 vs 12.
- Timer difficulty: default vs +10 percent.
- Hidden preview mode: exact longer vs silhouettes earlier.
- Starter pack price/content.
- Rewarded double CTA copy.
- Win streak chest reward pacing.

No A/B test should ship without a success metric, guardrail metric, and minimum sample plan.

---

# 10. Technical architecture

## 10.1 Decide platform strategy

The current build is Vite/TypeScript/Three.js. The team must decide:

Option A: Keep web stack and ship through web/PWA/instant-game channels.

Option B: Port to Unity/Godot/native mobile for App Store and Google Play.

Option C: Use a hybrid shell, only if performance, SDK compatibility, and store compliance are proven.

For mainstream mobile monetization, Option B is the safest default unless there is a strong reason to stay web.

## 10.2 Domain rules

Keep the deterministic domain layer concept. Improve it:

- Remove hardcoded tuning values from domain logic.
- Pass remote/config values explicitly.
- Implement all schema-declared objective types or remove them.
- Track category targets correctly.
- Track special blockers correctly.
- Make booster effects deterministic and validation-aware.
- Add replay serialization for QA and customer support.

## 10.3 Content pipeline

Replace generated JSON dumps with:

- Source level files.
- Generated candidate levels.
- Solver output.
- Bot simulation output.
- Human review annotations.
- Release bundles.
- Remote patch support.
- Content versioning.

## 10.4 Save and backend

LocalStorage-style save is not production-safe.

Production requires:

- Local encrypted/obfuscated save.
- Cloud sync.
- Conflict resolution.
- Server-validated purchases.
- Economy ledger.
- Player support tooling.
- GDPR/CCPA deletion path.

## 10.5 Privacy and compliance

Production must include:

- Consent management by region.
- ATT on iOS where relevant.
- Google UMP or equivalent for ads.
- Platform privacy labels.
- Data deletion request flow.
- Age/privacy review.
- SDK inventory.

Analytics must not fire before consent where consent is required.

---

# 11. QA and performance

## 11.1 Current tests are not enough

The existing browser test verifies a canvas appears and the HUD does not overlap. That is useful but far from enough.

## 11.2 Required test suites

Domain tests:

- Legal move matrix.
- Hidden reveal behavior.
- Mixed hidden queues.
- Category objectives.
- Special objectives.
- Blockers.
- Boosters.
- No-move states.
- Timer states.
- Replay determinism.

Content tests:

- Schema validation.
- Product counts.
- Solver validation.
- Bot simulation.
- Similarity/readability checks.
- Auto-clear risk checks.
- Reserve pressure checks.

Device tests:

- Low-end Android.
- Mid Android.
- Recent iPhone.
- Small screen.
- Tablet.
- Offline launch.
- Background/resume.
- Network loss during ad/purchase.

Performance targets:

- 60 FPS target on mid devices.
- Minimum 30 FPS on low-end devices.
- First playable under 5 seconds on target devices.
- Memory budget defined by platform.
- No major frame spikes on clear/reveal animations.

---

# 12. Jira-ready development mandate

## Epic A - Core rules V2

### A1. Rewrite hidden queue generation

Acceptance:

- Hidden layers support mixed SKUs.
- Default generation does not create full hidden triples.
- Hidden preview mode is configurable per level.
- Validation flags auto-clear reveal risks.

### A2. Implement all objective types or remove unused schema

Acceptance:

- `clear_all`, `collect_orders`, `clear_special`, `combo_target`, and `time_challenge` either work end-to-end or are removed from schema.
- UI, analytics, solver, and tests support each implemented objective.

### A3. Fix category target tracking

Acceptance:

- Category objectives update correctly when products clear.
- Hammer and booster clears update objectives correctly.
- Tests cover SKU and category targets.

### A4. Remove hardcoded combo timing

Acceptance:

- Combo window comes from level or remote config.
- Tests verify different combo windows.

### A5. Implement replay system

Acceptance:

- A level seed plus move list recreates the same result.
- QA can export/import replay JSON.

## Epic B - Level pipeline

### B1. Build V2 level schema

Acceptance:

- Schema includes board, layers, preview mode, objective, timer, difficulty tags, blockers, rewards, and validation metadata.
- JSON schema validation runs in CI.

### B2. Build real solver validation

Acceptance:

- Validation metadata is produced only by validation scripts.
- At least two solver strategies run.
- Unsolved or timeout levels fail CI unless explicitly marked experimental.

### B3. Build bot simulation

Acceptance:

- Simulates multiple heuristic players.
- Outputs pass rate, fail reason, moves, time pressure, reserve pressure, booster need.

### B4. Build first 30 handcrafted levels

Acceptance:

- All 30 pass validation.
- Human review notes exist.
- First-session tutorial is integrated.

## Epic C - Art/readability

### C1. Create production SKU art pipeline

Acceptance:

- SKU metadata maps to icons and 3D assets.
- Placeholder primitives are removed from production build.
- Missing asset detection fails CI.

### C2. Build 40 vertical-slice SKUs

Acceptance:

- Each SKU has strong silhouette and color identity.
- Each SKU passes small-screen readability review.

### C3. Implement theme system V2

Acceptance:

- Shelf, background, lighting, and UI accents change by chapter.
- Theme changes do not reduce product readability.

## Epic D - Feel and presentation

### D1. Move animation system

Acceptance:

- Pickup, drag, snap, invalid bounce, and settle animations exist.
- Movement feels responsive under 100ms.

### D2. Match/reveal animation system

Acceptance:

- Triple clear, cascade, hidden layer reveal, and combo effects are polished.
- Animations can be reduced by accessibility setting.

### D3. Audio and haptics

Acceptance:

- Pick, snap, clear, combo, booster, win, loss, and timer warning have audio/haptic feedback.
- Settings persist and work immediately.

## Epic E - UX/onboarding

### E1. First-session tutorial

Acceptance:

- First move is taught visually.
- Player understands clear, reserve, and hidden preview by level 10.

### E2. Win panel V2

Acceptance:

- Shows rewards, progress, collection, event, streak, and next CTA.
- Rewarded double is integrated and tracked.

### E3. Loss panel V2

Acceptance:

- Loss reason is specific.
- Rescue offer matches fail reason.
- Retry is always available.

### E4. Home/map/meta screen

Acceptance:

- Player can access level map, collection, events, shop, settings, and renovation/progression.

## Epic F - Meta and LiveOps

### F1. Collection album V2

Acceptance:

- Cards drop from cleared products.
- Duplicate handling exists.
- Completing pages grants rewards.

### F2. Win streak chest

Acceptance:

- Streak progress, rewards, loss reset, and optional protection exist.

### F3. Daily orders

Acceptance:

- Daily objectives are configurable and tracked.
- Rewards are granted once.

### F4. Renovation meta

Acceptance:

- At least one scene can be upgraded with earned currency.
- Upgrades provide long-term visual progression.

## Epic G - Monetization

### G1. Real ad mediation integration

Acceptance:

- Rewarded and interstitial ads work on devices.
- No-fill, error, timeout, and cooldown behavior are handled.
- Impression revenue is tracked.

### G2. IAP and receipt validation

Acceptance:

- Purchases validate server-side.
- Restore works.
- Entitlements are idempotent.

### G3. Remote offer eligibility

Acceptance:

- Starter pack, booster packs, remove ads, and piggy bank are remotely configurable and segmented.

## Epic H - Analytics/backend

### H1. Production analytics

Acceptance:

- Events send to a real backend/analytics service.
- Schema validation exists.
- Dashboards are available before soft launch.

### H2. Remote config

Acceptance:

- Difficulty, timers, economy, ads, feature flags, and events are remotely configurable.

### H3. Cloud save and support tools

Acceptance:

- Saves sync across devices.
- Support can inspect player ID, progress, purchases, and recent errors.

## Epic I - QA/release

### I1. Mobile smoke suite

Acceptance:

- Launch, play, win, fail, revive, ad, purchase sandbox, offline, resume, and settings are tested on physical devices.

### I2. Performance suite

Acceptance:

- Max board and animation stress scenes meet FPS/memory budgets.

### I3. Release checklist

Acceptance:

- Every release requires content validation, SDK smoke, privacy labels, store assets, localization check, and crash review.

---

# 13. Immediate bug and debt list

1. Replace `validate-levels.mjs`; it currently trusts generated validation metadata too much.
2. Replace hidden layer generation that creates three identical SKUs per hidden shelf.
3. Fix category target tracking.
4. Implement or remove `clear_special` and `time_challenge`.
5. Remove hardcoded combo timing from domain logic.
6. Use configured star thresholds or remove them.
7. Fix `any` workaround in move handling.
8. Fix analytics field where `createsPair` is always false.
9. Gate analytics behind consent where required.
10. Make reduce motion setting functional.
11. Enforce input mode setting or remove it.
12. Redesign extra shelf layout and difficulty impact.
13. Make hammer update objectives correctly.
14. Make shuffle preserve or improve solvability.
15. Replace procedural product visuals with production assets.
16. Add real gameplay completion browser/device tests.
17. Replace LocalStorage save merge for production.
18. Replace mock purchases with receipt validation.
19. Implement real ad failure/no-fill flows.
20. Update README so it does not overstate production readiness.

---

# 14. Definition of Done

## Vertical slice done

The vertical slice is done when:

- 30 handcrafted levels are fun and validated.
- Hidden queues create strategy, not accidental auto-clears.
- 40 production-quality SKUs exist.
- Move, clear, reveal, booster, win, loss, and revive flows are polished.
- Tutorial teaches the first session clearly.
- Real event schema and telemetry validation exist.
- A gameplay video can be shown to a publisher or UA team without apologizing for placeholder art.

## Soft launch done

Soft launch is done when:

- Native/mobile build pipeline is stable.
- 300+ validated levels are ready.
- Ads, IAP, receipt validation, consent, crash reporting, analytics, remote config, and cloud save are integrated.
- Store pages, screenshots, privacy labels, and support flow are ready.
- Dashboards can answer level pass rate, fail reason, ad revenue, purchase conversion, retention, and crash questions within 24 hours.
- Content can be patched remotely.
- The team has a 30-day LiveOps calendar.

## Global launch done

Global launch is done when:

- 1,000+ validated levels exist.
- Two or more recurring events are stable.
- Economy and ad frequency are tuned from soft-launch data.
- Retention and monetization meet internal targets.
- App rating risk is actively monitored.
- Support can handle purchase, save, and progression tickets.
- The team can ship new content weekly without app updates.

---

# 15. Final instruction to the team

The prototype is not a failure. It is exactly what a prototype should be: fast, broad, and imperfect. The next phase must be the opposite: focused, deep, measured, and polished.

Do not build more scaffolding until the core game feels excellent. Do not generate more levels until the first 30 are fun. Do not claim meta systems are implemented until they change player behavior. Do not claim monetization is implemented until real SDKs, receipt validation, no-fill handling, consent, and dashboards exist.

The ambition should be to make a shelf-sort game that feels more readable, fair, tactile, and generous than the mainstream competitors while still having the retention, content, and monetization discipline of a serious mobile studio.
