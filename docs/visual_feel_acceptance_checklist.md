# Visual Feel Acceptance Checklist

Date: 2026-06-13  
Scope: Shelf Sort 3D gameplay appeal pass

## Feel Target

Correct sorting should feel like moving chunky toy products inside a premium supermarket shelf. A successful move has lift, travel, snap, reward feedback, and fast recovery. A completed level opens a physical reward drawer instead of showing a static web modal.

## Timing Targets

| Beat | Target |
|---|---:|
| Product lift/selection | 80-120 ms |
| Product fly/snap | 160-240 ms |
| Shelf settle / target pulse | 100-160 ms |
| Triple clear burst | 450-750 ms |
| Hidden reveal slide / shimmer | 300-500 ms |
| Win drawer before Next is primary | 2.0-3.5 s |
| Reduced-motion replacement | Under 500 ms |

## Required Capture Set

- Level 1 first move and first triple clear.
- First valid move with target glow.
- First invalid move with reason-specific feedback.
- First hidden reveal.
- First combo objective completion.
- First loss rescue panel.
- First Puzzle Complete Drawer with stars, coins, streak, album/event/pass progress.
- Reduced-motion win path.

## QA Gates

- Every successful move visibly travels unless reduced motion is enabled.
- Every triple clear has anticipation, burst particles, sound, and haptic cue when enabled.
- Hidden reveal is visually distinct from ordinary rerendering.
- No primary gameplay control is a single-letter placeholder.
- Puzzle Complete Drawer appears after every win and is not a native-looking dialog.
- Next button becomes primary only after reward beats or after player skip.
- Game remains usable at 320 px width.
- SFX and haptics can be disabled independently through settings.
- Input is locked during critical animations and does not desync board state.
- Playwright covers start, select, valid move, triple clear, win drawer, loss panel, map, shop, settings, and reduced motion.

## Playtest Questions

Ask after levels 1, 3, 7, and 10:

1. Did the correct sort feel satisfying?
2. Could you tell what cleared and why?
3. Did the hidden reveal feel exciting or confusing?
4. Did the win screen feel like a reward?
5. Did any button or panel feel like a website instead of a game?
6. Did you want to play one more level?

The pass is not done until the first 10 levels feel satisfying on mute and with sound.

