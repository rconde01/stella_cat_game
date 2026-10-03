# Stella's Cat Game

A cat-based game website that Rob is building together with Rob's daughter, Stella. The game's design is
driven by Stella's ideas, so sessions with her should focus on **what the game does**, not on tooling.
Keep the boilerplate/infra boring and working so creative time isn't spent on setup.

## Project overview

- **What:** A browser game about cats, delivered as a website.
- **First feature (not started yet):** A **cat designer** — Stella designs a cat using **vector graphics
  drawn on an HTML `<canvas>`**. Cat parts (body, head, ears, tail, eyes, colors, patterns…) should be
  modelled as data (TypeScript types) and rendered to canvas from that data, so a designed cat can be
  saved, loaded, and reused elsewhere in the game.
- **Persistence:** We will probably want to save data between sessions (e.g. saved cats). See
  [Hosting & data](#hosting--data) for the plan.
- **Audience:** A kid. Prefer big, friendly, forgiving UI; avoid anything that needs typing or reading
  long text where possible.

## Tech stack

| Concern          | Choice                                                                  |
| ---------------- | ----------------------------------------------------------------------- |
| UI framework     | **Svelte 5** (runes mode is forced on for all project files)            |
| App framework    | **SvelteKit 3** (routing + server endpoints; built on Vite)             |
| Build/dev server | **Vite 8**                                                              |
| Language         | **TypeScript 6** (strict)                                               |
| Formatting       | **Prettier** (+ `prettier-plugin-svelte`)                               |
| Linting          | **ESLint 10** flat config (`typescript-eslint`, `eslint-plugin-svelte`) |
| Hosting          | **Vercel** via `@sveltejs/adapter-vercel`                               |
| Runtime          | **Node 24 LTS** (pinned in `package.json` `engines`)                    |
| Package manager  | **npm**                                                                 |

Why SvelteKit rather than a plain Svelte + Vite SPA: it is the official way to build Svelte apps, still
uses Vite underneath, and gives us server endpoints (`+server.ts`) on Vercel for free when we need to
save data to a database — no separate backend to run.

## Commands

```sh
npm install            # install deps
npm run dev -- --open  # dev server at http://localhost:5173
npm run check          # svelte-check / TypeScript type-check
npm run lint           # prettier --check + eslint
npm run format         # prettier --write
npm run build          # production build (emits Vercel output)
npm run preview        # serve the production build locally
```

Before committing, run `npm run format`, `npm run lint`, `npm run check`, and `npm run build`; all four
should pass.

## Project layout

```
src/
  app.html              HTML shell
  app.d.ts              SvelteKit ambient types
  lib/                  shared code (import via `$lib/...` or `#lib/...`)
    assets/             images/svg imported by components
  routes/
    +layout.svelte      app-wide layout
    +page.svelte        home page
static/                 files served as-is (robots.txt, etc.)
vite.config.ts          Vite + SvelteKit config (adapter + compiler options live here in Kit 3)
eslint.config.js        ESLint flat config
prettier.config.js      Prettier config (tabs, single quotes, width 100)
```

Note: in SvelteKit 3 there is no `svelte.config.js`; Kit options (adapter, compilerOptions) are passed
to the `sveltekit()` plugin in `vite.config.ts`.

## Conventions

- Svelte 5 runes (`$state`, `$derived`, `$effect`, `$props`) — no legacy `export let` / `$:` syntax.
- Game logic and data models in plain TypeScript under `src/lib/` (framework-free, easy to test);
  Svelte components stay thin.
- Canvas drawing code: keep a pure "draw cat from data" function (`(ctx, cat) => void`) separate from
  UI/interaction code.
- Line endings are LF everywhere (enforced by `.gitattributes`) so Prettier passes on Windows.
- Commit small, descriptive commits and push to `origin/main` as we go.

## Hosting & data

**Decision: Vercel** (account already exists).

- GitHub Pages only serves static files. It _could_ still save data in the browser (`localStorage` /
  IndexedDB), but that data lives on one device/browser only. Anything shared across devices, or
  server-side, needs a backend — so Pages is not enough long-term.
- Vercel hosts SvelteKit natively (static pages + serverless functions for `+server.ts` endpoints),
  deploys automatically on every push to `main`, and creates a preview URL for every other branch/PR.
  The free Hobby tier is enough for a personal project.

**Persistence plan (decide when we get there):**

1. **Start with `localStorage`** for saved cats — zero setup, works offline, fine while it's just Stella
   on one computer/tablet.
2. **When cross-device saving is wanted**, add a database from the Vercel Marketplace (one click,
   env vars injected automatically, free tiers):
   - **Neon (Postgres)** — if we want structured data / queries. Pairs with `npx sv add drizzle`.
   - **Upstash (Redis)** — simplest key/value store (e.g. `cats:<id>` → JSON).
   - Alternative: **Supabase** (Postgres + auth + storage) if we later want logins.

Design the save/load code behind a small interface (e.g. `CatStore` with `list/get/save/delete`) so the
`localStorage` implementation can be swapped for a server-backed one without touching the UI.

## Setup log

A running record of how this project was set up, in order.

### 2026-10-03 — Boilerplate

1. **Toolchain:** Git and Node were not on PATH (repo had been managed via SmartGit's bundled git).
   Installed with winget:
   `winget install Git.Git` (2.55) and `winget install OpenJS.NodeJS.LTS` (Node 24.19, npm 11.17).
2. **Scaffold:** Created the SvelteKit project in the repo root with the official Svelte CLI:
   ```sh
   npx sv@1.0.1 create --template minimal --types ts --add prettier eslint sveltekit-adapter="adapter:vercel" --install npm .
   ```
3. **Line endings:** Added `.gitattributes` (`* text=auto eol=lf`) so Windows checkouts don't break
   `prettier --check`.
4. **Node version:** Added `"engines": { "node": "24.x" }` to `package.json` so Vercel builds with the
   same major version as local dev (`.npmrc` has `engine-strict=true`).
5. **Placeholder page:** Replaced the SvelteKit welcome page with a "Stella's Cat Game" placeholder.
6. **Verified:** `npm run lint`, `npm run check`, `npm run build` all pass.
7. **Git:** Initial commit pushed to `https://github.com/rconde01/stella_cat_game` (`main`).
   The first push failed with "terminal prompts disabled" because Claude Code's shell disables git
   prompts. Fix: run once with `$env:GIT_TERMINAL_PROMPT='1'; $env:GCM_INTERACTIVE='always'; git push`,
   which opens the Git Credential Manager browser sign-in; the credential is then cached for future pushes.

### Pending — Vercel (needs Rob's login, one-time)

1. Go to <https://vercel.com/new> and sign in (use "Continue with GitHub").
2. Import the `rconde01/stella_cat_game` repository (grant Vercel access to it if prompted).
3. Framework preset is auto-detected as **SvelteKit**; leave build settings at defaults. Click **Deploy**.
4. After that, every push to `main` deploys to production; other branches get preview URLs.
5. Record the production URL here once it exists.

## Ideas backlog

_(Fill in with Stella!)_

- Cat designer (vector graphics on canvas) — first feature.
