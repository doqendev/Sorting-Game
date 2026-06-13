# Shelf Sort 3D

Playable V2 vertical slice for the sorting game. The current appeal pass follows `docs/gameplay-appeal-audit-roadmap.md` and `docs/gameplay_appeal_competitor_review_roadmap.md` on top of the original `Sorting_Game_Studio_Audit_and_V2_Spec.md`.

## What is implemented

- 30 handcrafted launch levels and an intentionally empty backlog until the slice validates.
- 40 readable SKU assets with metadata, generated SVG art, asset existence checks, and small-screen readability flags.
- Deterministic TypeScript gameplay domain for legal moves, hidden queues, triple resolution, objectives, blockers, timer, configurable combo rules, star thresholds, fail reasons, boosters, replay, and validation.
- Implemented objectives: clear all, collect orders by SKU/category, clear special flagged products, combo target, and time challenge.
- Boosters: Hint, Shuffle, Hammer, Freeze Time, and Extra Shelf, with objective updates and recovery-focused behavior.
- Mobile-first Three.js board using generated SKU art, tap/drag input modes, reduce-motion support, tutorial hint highlights, tactile move/snap effects, triple-clear particles, hidden reveal beats, booster effects, HUD, map, shop, settings, privacy, events, collection album, Puzzle Complete Drawer, and fail-reason-specific loss panel.
- Centralized audio and haptics services with reusable Web Audio context, per-cue haptic patterns, mute/settings support, and reduced-motion compatibility.
- V2 telemetry event names with consent gating: move, clear, animation quality, drawer dwell/skip, first-clear timing, booster prompts, win, fail, revive, reward ad, IAP, economy, collection, settings, consent, and crash events.
- First-10 pacing metadata with emotional beats, including a level 1 first-move triple payoff, level 8 combo objective, level 9 light blocker, and level 10 hard-level ceremony.
- Local sandbox services for save, mock cloud merge, mock ads, mock purchases, economy grants/spends, validation report, and difficulty dashboard.
- Unit/content tests and browser visual verification covering start, selection, valid move, triple clear, Puzzle Complete Drawer, reduced motion, loss rescue, shop, map, settings, and 320 px layout.
- Installable mobile PWA packaging with manifest metadata, app icons, service worker caching, mobile status-bar tags, and a GitHub Pages deployment workflow.

## Run

```bash
npm install
npm run generate:content
npm run dev -- --port 5174 --strictPort
```

Open `http://127.0.0.1:5174`.

## Phone install

After the `Deploy Mobile Web App` GitHub Action finishes on `main`, open:

```text
https://doqendev.github.io/Sorting-Game/
```

On Android Chrome, use the browser menu and choose `Add to Home screen` or `Install app`. On iPhone Safari, use Share and choose `Add to Home Screen`. The installed app launches in portrait standalone mode and caches the game shell and content for repeat play.

## Verify

```bash
npm run check
```

This regenerates content, validates all 30 V2 levels, checks the 40 SKU assets, runs domain/service/content tests, builds the app, and runs Playwright visual checks with canvas pixel sampling.

## Key files

- `Sorting_Game_Studio_Audit_and_V2_Spec.md`: V2 implementation source of truth.
- `docs/gameplay-appeal-audit-roadmap.md`: gameplay feel, UI, reward, retention, and QA roadmap.
- `docs/gameplay_appeal_competitor_review_roadmap.md`: competitor benchmark and dev-ready juice roadmap.
- `docs/visual_feel_acceptance_checklist.md`: capture and QA criteria for the appeal pass.
- `src/domain/`: gameplay rules, boosters, solver, replay, and validation.
- `src/presentation/ThreeBoardView.ts`: Three.js board rendering and input.
- `src/presentation/AnimationDirector.ts`, `src/presentation/ParticleSystem.ts`, `src/presentation/VisualEvents.ts`: lightweight visual-event and DOM effect layer.
- `src/services/audio.ts`, `src/services/haptics.ts`: feedback services.
- `src/app/GameApp.ts`: level flow, HUD, panels, meta, ads/IAP mocks, save integration.
- `scripts/generate-content.mjs`: V2 SKU, theme, economy, event, and authored-level generator.
- `scripts/validate-levels.ts`: batch content validation and report writer.
- `public/assets/skus/`: generated SKU art.
- `public/data/`: generated V2 content and validation artifacts.
- `tests/domain.test.ts`: domain, services, replay, and content tests.
- `tests/browser/game.spec.ts`: Playwright visual checks.

## Production note

This is an installable web PWA, not an App Store or Google Play native release. Real soft launch still requires native build work or a production web deployment, real analytics backend, real ad/IAP/receipt-validation SDKs, production consent and data-deletion flows, cloud save, localization, device QA, store assets, privacy labels, crash review, and telemetry-driven tuning beyond the first 30 levels.
