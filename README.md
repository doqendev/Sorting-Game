# Shelf Sort 3D

A runnable implementation of the `Shelf_Sort_3D_Technical_Product_Spec_v1.md` blueprint.

## What is implemented

- Playable portrait shelf-sorting puzzle with visible front products, disabled hidden previews, reveal resolution, triples, timer, combo, win/loss, retry, revive, pause, and next-level flow.
- Tap/drag-compatible Three.js board renderer with original stylized SKU visuals.
- Deterministic TypeScript domain layer for board state, legal moves, match resolution, reveal resolution, timer, hinting, boosters, and solver validation.
- Launch boosters: Hint, Shuffle, Clear One, Freeze Time, and Extra Shelf.
- Data-driven content: 500 generated launch levels, 1,000 backlog levels, 200 product SKUs, 6 shelf themes, economy config, remote config, events, validation report, and difficulty dashboard CSV.
- Meta and monetization scaffolding: daily reward, win streak, collection album, recurring events, mock rewarded/interstitial/banner ads, Remove Ads, starter pack, booster bundles, piggy bank, match pass, and idempotent sandbox purchase grants.
- Local atomic save, cloud-save mock merge, analytics event logging, crash capture, consent panel, privacy panel, and remote-configurable balancing.
- Automated unit/content validation plus desktop and mobile browser pixel verification.

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

This regenerates content, validates the 500 shipped levels, runs domain/service tests, builds the app, and runs Playwright desktop/mobile visual checks with canvas pixel sampling.

## Key files

- `src/domain/`: deterministic gameplay rules, boosters, solver, and validation.
- `src/presentation/ThreeBoardView.ts`: Three.js board rendering and input.
- `src/app/GameApp.ts`: level flow, HUD, panels, meta, ads, IAP mocks, save integration.
- `scripts/generate-content.mjs`: product, theme, economy, event, launch-level, and backlog-level generator.
- `scripts/validate-levels.mjs`: batch content validation.
- `public/data/`: generated launch content and validation artifacts.
- `tests/domain.test.ts`: domain, services, and content tests.
- `tests/browser/game.spec.ts`: desktop/mobile Playwright visual checks.

## Production note

This repo is implemented as a web-playable TypeScript/Three.js build because the starting repository contained only Markdown and no Unity project. The architecture follows the spec boundaries: deterministic domain, data files, service wrappers, content validation, analytics, remote config, and mobile-first UI. Native iOS/Android store release would still require porting the presentation/services into Unity or another native build pipeline, integrating real ad/IAP/cloud/consent SDKs, and completing platform QA/legal review.
