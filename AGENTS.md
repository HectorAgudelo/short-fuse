# AGENTS.md — Short Fuse

Instructions for every AI coding agent working in this repo (Antigravity, GitHub Copilot, and any other agent).
A human (Hector) reviews every pull request before it is merged. Your job is to make that review fast and easy.

## 1. Read these first, every task

1. `GDD.md`: the game design document. It is the source of truth for the game rules.
2. `PLAN.md`: the ordered task list. Work on ONE task from it at a time.
3. This file.

If the task you were given conflicts with `GDD.md`, stop and say so in the pull request. Do not change the rules on your own.

## 2. Project in one paragraph

Short Fuse is a 2D bomb-duel game based on the card game 21, built with TypeScript, Phaser (2D game library), Vite (build tool), and Vitest (test runner). The game rules live in `src/core/` as plain TypeScript with no Phaser imports. Phaser code in `src/scenes/` only draws the screen and reads input. Tests for `src/core/` live in `tests/`.

## 3. Commands

- `npm install`: install dependencies
- `npm run dev`: start the local dev server
- `npm test`: run all tests once
- `npm run lint`: check code style
- `npm run build`: build the game for release

Before you open a pull request, `npm test`, `npm run lint`, and `npm run build` must all pass.

## 4. Pull request rules (small and focused)

- One task from `PLAN.md` = one branch = one pull request.
- Branch name: `feature/<task-number>-<short-name>`, for example `feature/04-take-charge`.
- Keep it small: at most about 200 changed lines of non-test code, and at most 6 files. If a task is bigger, split it and say so in the PR.
- Do only what the task asks. No "while I was here" refactors, renames, or formatting changes in unrelated files.
- Do not add, remove, or upgrade npm packages unless the task says so. If you think one is needed, explain why in the PR and stop.
- Fill in the PR template (`.github/pull_request_template.md`) completely, in plain words.
- In `PLAN.md`, tick the box of the task you finished (change `- [ ]` to `- [x]`) in the same PR. Do not edit other lines in `PLAN.md`.

## 5. Readable code rules (most important)

The reviewer must understand every line on the first read. When in doubt, choose the boring, obvious way.

### Names
- Use full, descriptive names: `playerTotal`, not `pt` or `tot`.
- Booleans start with `is`, `has`, or `should`: `isOverloaded`, `hasLockedIn`.
- Functions start with a verb: `takeCharge`, `compareTotals`, `burnFuseSegment`.

### Size and shape
- Functions: at most about 30 lines, and do one thing.
- Files: at most about 200 lines.
- Nesting: at most 2 levels deep. Use early returns instead of deep `if/else`.
- One statement per line.

### Things to avoid
- No nested ternaries (`a ? b : c ? d : e`). Use `if` statements.
- No long chains of `.map().filter().reduce()`. More than 2 steps: use a `for...of` loop with clear variable names.
- No `reduce` unless it is a simple sum.
- No clever one-liners, bit tricks, or code golf.
- No `any`. No type assertions (`as Something`) unless there is no other way, with a comment explaining why.
- No advanced TypeScript: no conditional types, mapped types, decorators, or complex generics.
- No classes in `src/core/`. Use plain objects (types) and functions. Phaser scenes in `src/scenes/` are classes because Phaser requires it.
- No global mutable variables.
- No `Math.random()` in `src/core/`. All randomness goes through `src/core/rng.ts`.
- No magic numbers. Every tunable number (code range, charge range, timer seconds, fuse size) lives in `src/core/config.ts`.

### Things to do
- Write explicit types for function parameters and return values.
- Keep `src/core/` functions **pure**: they get the current state and return a NEW state. Never change the object that was passed in. Use the spread syntax (`{ ...state, playerTotal: newTotal }`).
- Add a short comment (1 to 2 lines) above every exported function saying what it does.
- Comments explain WHY, not WHAT. Do not comment obvious lines.
- Prefer clear and slightly longer code over short and clever code.

### Example of the style we want

```ts
// Adds one charge to the player's total and checks for overload.
export function takePlayerCharge(state: RoundState, rng: Rng): RoundState {
  const charge = rollCharge(rng);
  const newTotal = state.playerTotal + charge;
  const isOverloaded = newTotal > state.code;

  return {
    ...state,
    playerTotal: newTotal,
    playerCharges: [...state.playerCharges, charge],
    isPlayerOverloaded: isOverloaded,
  };
}
```

## 6. Testing rules

- Every rule in `src/core/` needs a test. Write the test first, then the code that makes it pass.
- Use a fixed seed in tests so results are always the same.
- One behavior per test. The test name says the behavior in plain words, for example `it("player loses the round when the total goes over the code")`.
- Use the examples in `GDD.md` (like "Code 27, AI total 23: stops") as test cases.
- Do not delete or weaken an existing test to make your code pass. If a test seems wrong, explain it in the PR.

## 7. Folder layout

```
src/
  core/          game rules only, no Phaser imports
    config.ts    every tunable number
    rng.ts       seeded random number generator
    round.ts     dealing, taking charges, overload, comparing totals
    match.ts     fuses and who wins the match
    ai.ts        the Rookie AI rule
    taunts.ts    the AI's taunt lines
  scenes/        Phaser screens: TitleScene, GameScene, MatchOverScene
  main.ts        starts Phaser
tests/           Vitest tests for src/core/
```

Do not create new top-level folders without a task asking for it.

## 8. When you are stuck

Do not guess. Open the pull request as a draft, explain what is unclear, and list the options you see. A clear question is better than a wrong guess.
