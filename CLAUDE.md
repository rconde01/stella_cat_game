# Rainbow Smiles Funtime Place

**Rainbow Smiles Funtime Place** is a cat-based game website that Rob is building together with Rob's daughter, Stella. The game's design is
driven by Stella's ideas, so sessions with her should focus on **what the game does**, not on tooling.
Keep the boilerplate/infra boring and working so creative time isn't spent on setup.

## Project overview

- **Name:** Rainbow Smiles Funtime Place. (The repo/package are still called `stella_cat_game` /
  `stella-cat-game`; that's fine and doesn't need renaming.)
- **What:** A browser game about cats, delivered as a website.
- **First feature (not started yet):** A **cat designer**, where the player designs their own cat. See
  [Feature: Cat designer](#feature-cat-designer).
- **Persistence:** We will probably want to save data between sessions (e.g. saved cats). See
  [Hosting & data](#hosting--data) for the plan.
- **Audience:** A kid. Prefer big, friendly, forgiving UI; avoid anything that needs typing or reading
  long text where possible.

## Feature: Cat designer

The first part of the game: the player designs their cat. The cat is drawn as **vector graphics on an
HTML `<canvas>`**. Each choice below is stored as data (TypeScript types) and the cat is drawn from that
data, so a designed cat can be saved, loaded, and reused elsewhere in the game.

What the player can choose:

| Choice               | Notes                                                                            |
| -------------------- | -------------------------------------------------------------------------------- |
| **Shape**            | Pick from several body shapes / builds.                                          |
| **Pose**             | Pick from several poses (e.g. sitting, standing, lying down).                    |
| **Pattern**          | Coat pattern (e.g. solid, stripes/tabby, spots, patches).                        |
| **Color**            | Main coat color.                                                                 |
| **Color highlights** | Secondary/accent color (used by the pattern, belly, paws, ear tips…).            |
| **Eye color**        | Iris color.                                                                      |
| **Disposition**      | The cat's personality, shown on its face — e.g. a **grumpy** face, a happy face. |
| **Name**             | The cat's name, typed by the player.                                             |

**Animation:** The cat should have small idle animations — e.g. the face moving (blinking, expression
shifting) and the tail swishing. Disposition can influence the animation (a grumpy cat's tail flicks,
a happy cat's tail sways).

Design notes:

- Model the cat as one plain data object, e.g. `Cat { name, shape, pose, pattern, color, highlightColor,
eyeColor, disposition }`, with each option as a union of string ids (`'grumpy' | 'happy' | …`).
- Drawing is a pure function `drawCat(ctx, cat, t)` where `t` is the animation time; a
  `requestAnimationFrame` loop in the Svelte component calls it each frame.
- Build each pose from shared parts (body, head, ears, tail, face) so adding a shape/pose/disposition
  doesn't mean redrawing everything.
- Option pickers should be big, visual buttons (swatches and little previews), not dropdowns.

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

**Decision: Vercel** (account already exists). Live at <https://stella-cat-game.vercel.app/>.

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

### 2026-10-03 — Vercel deployment

1. At <https://vercel.com/new>, signed in with GitHub and imported `rconde01/stella_cat_game`.
2. Framework preset auto-detected as **SvelteKit**; build settings left at defaults; deployed.
3. Every push to `main` deploys to production; other branches/PRs get preview URLs.

**Production URL:** <https://stella-cat-game.vercel.app/>

## Ideas backlog

_(Fill in with Stella!)_

- Cat designer — first feature, spec'd above.
