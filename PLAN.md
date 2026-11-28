# PLAN.md — Short Fuse v1

Ordered task list for version 1 (see `GDD.md` for the rules and the definition of done).
Do the tasks in order. Each task is one small pull request. Tick the box in the same PR that finishes it.

## Phase 1: Setup

- [x] **01 — Project setup.** Create the project with Vite + TypeScript, add Phaser, Vitest, ESLint, and Prettier. Add the npm scripts `dev`, `test`, `lint`, `build`. Create the folder layout from `AGENTS.md`. `main.ts` starts Phaser with one empty scene that shows the text "Short Fuse". One sample test that passes. (This is the only task allowed to add npm packages.)

## Phase 2: Game rules (src/core, with tests)

- [x] **02 — Config.** Create `src/core/config.ts` with every number from `GDD.md`: code range 21–30, charge range 1–10, decision timer 10 seconds, fuse size 3, segments lost on a normal loss 1, on a perfect-defuse loss 2, Rookie stop distance 4.
- [x] **03 — Seeded random generator.** `src/core/rng.ts`: create a generator from a seed, and a function for a random whole number between a min and max. Tests: same seed gives the same sequence; numbers stay inside the range.
- [x] **04 — Start a round.** `src/core/round.ts`: create the round state, roll the code, deal 2 visible charges to the player and 2 to the AI (one marked hidden). Tests for all of it.
- [x] **05 — Take a charge.** Player takes a charge; overload is detected when the total goes over the code. Tests.
- [x] **06 — Lock in.** Player locks in; the round moves to the AI turn. Taking a charge after locking in is not allowed. Tests.
- [x] **07 — Rookie AI.** `src/core/ai.ts`: the Rookie rule from `GDD.md`. Tests using the GDD examples (code 27 with AI totals 20, 23, 27).
- [x] **08 — Round result.** Compare totals: overloads, closer total wins, perfect defuse, tie. Tests for every case.
- [x] **09 — Match and fuses.** `src/core/match.ts`: both fuses start at 3, burn 1 on a normal loss and 2 on a perfect-defuse loss, nothing on a tie, match ends when a fuse reaches 0. Tests.
- [x] **10 — Taunts.** `src/core/taunts.ts`: a list of at least 10 short taunt lines and a function that picks one with the seeded generator. Test.

## Phase 3: Screens (src/scenes)

- [x] **11 — Game screen layout.** `GameScene` shows the code, both totals (AI hidden charge as "??"), both fuses, and the two buttons, from a match state. Buttons do nothing yet. Simple shapes and text only.
- [x] **12 — Player controls.** Take charge and Lock in buttons call the core functions. Keyboard: Space = Take charge, Enter = Lock in.
- [x] **13 — Decision timer.** 10-second timer bar; red in the last 3 seconds; when it runs out the player takes a charge automatically.
- [x] **14 — AI turn.** Reveal the hidden charge after a short pause, then show each AI charge one by one with a taunt.
- [x] **15 — Round and match flow.** After each round show the result, burn fuse segments, start the next round. Go to the match-over screen when a fuse reaches 0.
- [x] **16 — Title and match-over screens.** `TitleScene` with Play and mute buttons. `MatchOverScene` with the winner and a Play again button.

## Phase 4: Feel

- [x] **17 — Screen shake.** Shake on every charge; bigger charges shake more.
- [x] **18 — Sounds.** Ticking that speeds up as the player gets close to the code, defuse sound, perfect-defuse sound, spark on a lost round, explosion at match end. Mute button works.
- [x] **19 — Phone check.** Layout fits a phone screen in portrait; buttons are large enough to tap.

## Phase 5: Done check

- [ ] **20 — Definition of done.** Go through the checklist in `GDD.md` and fix anything missing. Small fixes only; list anything bigger as a new task at the end of this file.
