# Shelf Sort 3D

Playable V2 vertical slice for the sorting game. The source of truth for this pass is `Sorting_Game_Studio_Audit_and_V2_Spec.md`.

## What is implemented

- 30 handcrafted launch levels and an intentionally empty backlog until the slice validates.
- 40 readable SKU assets with metadata, generated SVG art, asset existence checks, and small-screen readability flags.
- Deterministic TypeScript gameplay domain for legal moves, hidden queues, triple resolution, objectives, blockers, timer, configurable combo rules, star thresholds, fail reasons, boosters, replay, and validation.
- Implemented objectives: clear all, collect orders by SKU/category, clear special flagged products, combo target, and time challenge.
- Boosters: Hint, Shuffle, Hammer, Freeze Time, and Extra Shelf, with objective updates and recovery-focused behavior.
- Mobile-first Three.js board using generated SKU art, tap/drag input modes, reduce-motion support, tutorial hint highlights, HUD, map, shop, settings, privacy, events, collection album, win panel, and fail-reason-specific loss panel.
- V2 telemetry event names with consent gating: move, clear, reveal, booster, win, fail, revive, reward ad, IAP, economy, collection, settings, consent, and crash events.
- Local sandbox services for save, mock cloud merge, mock ads, mock purchases, economy grants/spends, validation report, and difficulty dashboard.
- Unit/content tests and browser visual verification.

## Run

```bash
npm install
npm run generate:content
npm run dev -- --port 5174 --strictPort
```

Open `http://127.0.0.1:5174`.

## Verify

```bash
npm run check
```

This regenerates content, validates all 30 V2 levels, checks the 40 SKU assets, runs domain/service/content tests, builds the app, and runs Playwright visual checks with canvas pixel sampling.

## Key files

- `Sorting_Game_Studio_Audit_and_V2_Spec.md`: V2 implementation source of truth.
- `src/domain/`: gameplay rules, boosters, solver, replay, and validation.
- `src/presentation/ThreeBoardView.ts`: Three.js board rendering and input.
- `src/app/GameApp.ts`: level flow, HUD, panels, meta, ads/IAP mocks, save integration.
- `scripts/generate-content.mjs`: V2 SKU, theme, economy, event, and authored-level generator.
- `scripts/validate-levels.ts`: batch content validation and report writer.
- `public/assets/skus/`: generated SKU art.
- `public/data/`: generated V2 content and validation artifacts.
- `tests/domain.test.ts`: domain, services, replay, and content tests.
- `tests/browser/game.spec.ts`: Playwright visual checks.

## Production note

This is a web-playable TypeScript/Three.js vertical slice, not a production mobile release. Real soft launch still requires native build work or a production web deployment, real analytics backend, real ad/IAP/receipt-validation SDKs, production consent and data-deletion flows, cloud save, localization, device QA, store assets, privacy labels, crash review, and telemetry-driven tuning beyond the first 30 levels.
