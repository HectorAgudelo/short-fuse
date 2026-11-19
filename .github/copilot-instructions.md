# Copilot instructions — Short Fuse

The full rules for this repo are in `AGENTS.md` at the repo root. Read it and follow it for every task.
The game rules are in `GDD.md`. The task list is in `PLAN.md`.

The most important rules, repeated here for Copilot features that do not read `AGENTS.md`:

## Pull requests
- One task from `PLAN.md` per pull request. Do only that task.
- Small: at most about 200 changed lines of non-test code and at most 6 files.
- No unrelated refactors, renames, or formatting changes.
- No new npm packages unless the task says so.
- `npm test`, `npm run lint`, and `npm run build` must pass.

## Readable code
- Full descriptive names. Booleans start with `is`, `has`, or `should`. Functions start with a verb.
- Functions at most about 30 lines. Files at most about 200 lines. At most 2 levels of nesting; use early returns.
- No nested ternaries, no long `.map().filter().reduce()` chains, no clever one-liners.
- No `any`, no advanced TypeScript (conditional types, mapped types, decorators, complex generics).
- No classes in `src/core/`; plain types and pure functions that return new state.
- No `Math.random()` in `src/core/`; use `src/core/rng.ts`.
- No magic numbers; put them in `src/core/config.ts`.
- Explicit types on parameters and return values. A short comment above every exported function.

## When reviewing a pull request
Flag any code that breaks the rules above, any `src/core/` change without a test, and any change outside the task's scope.
