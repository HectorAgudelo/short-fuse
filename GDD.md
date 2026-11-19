# GDD.md — Short Fuse Game Design Document (v1)

Source of truth for the game rules. Last updated Nov 18, 2026.

## Overview

Short Fuse (working title) is a one-on-one bomb duel based on the card game 21. You and an AI rival each build a number toward the bomb's code by taking random "charges." Get closer to the code than the rival without going over, or the bomb goes off on you.

A match lasts until one player's 3-segment fuse burns out. Version 1 runs in a web browser on phone and computer. Store versions (iOS, Android, Steam, itch.io) come after v1 works.

## Core rules

One round is a short duel: the player builds a total first, then the AI does, then the totals are compared.

Words used in this document:

- **Code**: the bomb's target number for the round.
- **Charge**: a random number added to a total.
- **Total**: the sum of a player's charges this round.
- **Lock in**: stop taking charges and keep your total.
- **Overload**: your total goes over the code. You lose the round.

How one round plays:

1. The bomb shows a new code: a random whole number from 21 to 30.
2. Deal: the player gets 2 charges, both visible. The AI gets 2 charges: one visible, one hidden (shown as "??").
3. Player turn: the player chooses **Take charge** or **Lock in**. Each charge is a random whole number from 1 to 10.
4. Each decision has a 10-second timer. If it runs out, the player automatically takes a charge.
5. If the player overloads, the player loses the round right away. The AI does not play.
6. AI turn: the AI reveals its hidden charge, then takes charges by its rule (see The AI opponent).
7. If the AI overloads, the AI loses the round.
8. Otherwise, the total closer to the code wins. Hitting the code exactly is a **perfect defuse**.
9. Same distance from the code = a tie. Nobody loses a fuse segment, and a new round starts.

## Winning the match

Each player starts with a fuse of 3 segments. The first player whose fuse reaches 0 loses the match, and their bomb explodes.

- Lose a round: you lose 1 segment.
- Lose to a perfect defuse: you lose 2 segments.
- Tie: nobody loses a segment.
- Both fuses are always visible on screen.

## The AI opponent

In v1 the AI is one simple, fixed rule called **Rookie**. "AI" here means plain code rules, not machine learning.

**Rookie rule:** keep taking charges while the AI's total is 5 or more below the code. Stop once it is within 4 of the code. Rookie ignores the player's total.

Examples (each one should become a test):

- Code 27, AI total 20: 7 below, so it takes a charge.
- Code 27, AI total 23: 4 below, so it stops.
- Code 27, AI total 27: it stops (perfect defuse).

**Personality:** after each charge, the AI shows one short taunt from a fixed list, such as "Feeling lucky?" or "I can hear it ticking." The list lives in one file so it is easy to edit.

Later levels (not v1) can be smarter, for example by looking at the player's locked total.

## Thrill and feel

The tension comes from sound, motion and time pressure, not from complex rules. Art stays simple: flat shapes and a few colors.

- **Timer bar** under the decision buttons, shrinking over 10 seconds and turning red in the last 3.
- **Ticking sound** that speeds up as the player's total gets closer to the code.
- **Screen shake** on each charge. Bigger charges shake more.
- **The hidden charge** stays as "??" until the AI turn, then flips with a short pause before the reveal.
- **Explosion** (flash, shake, sound) on the loser's side when a match ends. A smaller spark when a round is lost.
- **Defuse sound** when a round is won. A special one for a perfect defuse.

## Version 1 scope

Version 1 is one full match against Rookie, playable in a browser on phone and computer.

**In v1:**

- Title screen with a Play button and a mute button.
- Game screen: code, both totals, both fuses, timer, Take charge and Lock in buttons.
- Controls: tap the buttons on phone; on computer, Space = Take charge, Enter = Lock in.
- Match-over screen: who won, and a Play again button.
- Rookie AI, the 3-segment fuse, the timer, sounds and shake from Thrill and feel.

**Not in v1** (ideas for later):

- Special wires (subtract 3, peek at the next charge).
- Harder AI levels and AI bluffing.
- Solo tutorial and daily challenge.
- Store builds: Capacitor for iOS and Android, Electron or Tauri for desktop.
- Accounts, online play, ads and in-app purchases.

## Tech setup

The game rules live in plain TypeScript with no game library inside. The game library only draws the screen and reads input. This keeps the rules easy to test and easy to review.

Tools:

- **TypeScript**: JavaScript with types.
- **Phaser**: a JavaScript library for 2D browser games. It draws, animates, plays sound and reads input.
- **Vite**: the build tool. It runs the local dev server and bundles the game for release.
- **Vitest**: the test runner made to work with Vite.

Folder layout:

```
src/
  core/          game rules only, no Phaser imports
    config.ts    every tunable number (code range, charge range, timer, fuse size)
    rng.ts       seeded random number generator
    round.ts     dealing, taking charges, overload, comparing totals
    match.ts     fuses and who wins the match
    ai.ts        the Rookie rule
    taunts.ts    the AI's taunt lines
  scenes/        Phaser screens: Title, Game, MatchOver
  main.ts        starts Phaser
tests/           Vitest tests for everything in core/
```

Two key rules for the code:

- Everything in `core/` is made of **pure functions**: a function that gets the current game state and returns a new state, without changing anything else. Same input always gives the same output.
- All randomness goes through `rng.ts`. A **seeded random generator** takes a starting number (the seed) and always returns the same sequence for that seed, so tests can replay an exact match. `Math.random()` is not allowed in `core/`.

## Rules for the AI agents

How agents must work (branches, pull request size, code style, tests) is defined in `AGENTS.md`. If this document and `AGENTS.md` ever disagree about how to work, `AGENTS.md` wins. If they disagree about the game rules, this document wins.

## Definition of done for v1

Version 1 is done when every box below is checked.

- [ ] A full match plays from title screen to match-over screen in a desktop browser.
- [ ] The same works in a phone browser with touch.
- [ ] Every rule in Core rules, Winning the match and The AI opponent has a passing test.
- [ ] The same seed always replays the exact same match.
- [ ] `npm run build` finishes with no errors, and the browser console shows no errors during a match.
- [ ] Hector has played 10 full matches and has both won and lost.
