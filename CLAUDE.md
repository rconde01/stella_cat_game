# Rainbow Smiles Funtime Place

**Rainbow Smiles Funtime Place** is a cat-based game website that Rob is building together with Rob's
daughter, Stella. The game's design is driven by Stella's ideas, so sessions with her should focus on
**what the game does**, not on tooling. Keep the boilerplate/infra boring and working so creative time
isn't spent on setup.

## Project overview

- **Name:** Rainbow Smiles Funtime Place. (The repo/package are still called `stella_cat_game` /
  `stella-cat-game`; that's fine and doesn't need renaming.)
- **What:** A browser game about cats, delivered as a website.
- **Art style:** **Anime / chibi** — big head, big glossy eyes with white highlights, thick dark
  outlines, blush marks, "ω" cat mouth, pastel and rainbow colors, anime mood symbols (💢, Zzz, sweat
  drop).
- **First feature (built):** A **cat designer**, where the player designs their own cat. See
  [Feature: Cat designer](#feature-cat-designer).
- **Persistence:** The designed cat is saved in the browser (`localStorage`). See
  [Hosting & data](#hosting--data).
- **Audience:** A kid. Prefer big, friendly, forgiving UI; avoid anything that needs typing or reading
  long text where possible.

## Feature: Cat designer

The first part of the game: the player designs their cat at `/design`. The home page (`/`) shows the
saved cat, animated.

What the player can choose (all options live in `src/lib/cat/options.ts`):

| Choice               | Options                                                                    |
| -------------------- | -------------------------------------------------------------------------- |
| **Name**             | Typed, or 🎲 "Pick one for me" from a list of cute names.                  |
| **Shape**            | Round, Slim, Fluffy, Kitten.                                               |
| **Pose**             | Sitting, Standing, Lying down, Stretching (play bow).                      |
| **Pattern**          | Plain, Stripes (tabby), Spots, Patches, Tuxedo.                            |
| **Color**            | 11 fur colors, including fantasy ones (Bubblegum, Lavender, Sky, Mint…).   |
| **Color highlights** | 12 pattern colors, including **Rainbow** (gradient).                       |
| **Eye color**        | 8 iris colors.                                                             |
| **Disposition**      | Happy, Grumpy, Sleepy, Silly, Shy — shown on the face and in the movement. |

Plus a **🎲 Surprise me!** button that randomizes everything except the name.

**Animation** (`src/lib/cat/animation.ts`): every cat breathes, blinks and twitches its ears. Mood
changes the rest:

| Mood   | Face                                                     | Movement                                |
| ------ | -------------------------------------------------------- | --------------------------------------- |
| Happy  | Big sparkly eyes, open "ω" smile, blush                  | Tail sways, head bobs, eyes look about  |
| Grumpy | Angry slanted lids, frowning brows, frown, pulsing 💢    | Still, with sharp tail flicks; ears out |
| Sleepy | Closed eyes, little "o" mouth, snot bubble, floating Zzz | Slow breathing, slow tail, nodding      |
| Silly  | Wink, tongue out (wiggles)                               | Fast wide tail, big head wobble         |
| Shy    | Looks away, heavy blush with lines, sweat drop           | Head tilted down, ears back             |

### How the cat is drawn

- **SVG rendered by Svelte, not `<canvas>`.** We originally planned canvas, but SVG is the browser's
  native vector format and Svelte renders it declaratively, so each body part is a small component and
  animation is just a time value `t` feeding reactive attributes. Crisp at any size, no extra library.
  (If canvas is ever needed, e.g. for exporting a PNG, the SVG can be drawn onto a canvas.)
- **The cat is plain data** (`Cat` in `src/lib/cat/types.ts`) — JSON-serialisable, saved as-is.
- **`CatView.svelte`** draws a `Cat` at time `t`. `focus` prop: `'full'` (400×400 scene), `'cat'`
  (cropped, for option buttons), `'face'` (zoomed on the head, for mood buttons).
- **Layout** (`geometry.ts`): each pose is a function that places parts (body blob, haunches, legs,
  tail, head) in a 400×400 viewBox; each shape is a set of size factors applied to the pose. Adding a
  pose = one new function; adding a shape = one new row of factors.
- **Parts**: blob-shaped parts (head, body, haunches) are unit-coordinate paths placed with a transform
  (`parts/Part.svelte`); outlines use `vector-effect="non-scaling-stroke"` so line width stays constant.
  Legs and tail are thick rounded strokes with an outline stroke underneath (`parts/Limb.svelte`).
- **Patterns** (`patterns.ts`): markings for blob parts are shapes clipped to the part; legs and tail
  use dash patterns (`pathLength=100`) — stripes = bands, spots = round dots, tuxedo = white socks/tip.
- **Fluffy** uses an SVG turbulence + displacement filter to roughen the fur outline.
- **Animation clock**: `useClock()` (`clock.svelte.ts`) runs one `requestAnimationFrame` loop per page;
  option thumbnails are static (`t = 0.5`) to keep things calm and cheap.
- **`/gallery`** shows every shape × pose, mood and pattern side by side — use it to check art changes.

### Checking the art without a browser

Headless Edge can screenshot pages from the dev server (useful for Claude to see the drawings):

```powershell
& "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless=new --disable-gpu `
  --hide-scrollbars --window-size=1000,2600 --virtual-time-budget=4000 `
  --screenshot="<scratch>\gallery.png" http://localhost:5173/gallery
```

Headless Edge has a minimum window width (~500px), so use ≥600px widths when checking layouts.

## Tech stack

| Concern          | Choice                                                                  |
| ---------------- | ----------------------------------------------------------------------- |
| UI framework     | **Svelte 5** (runes mode is forced on for all project files)            |
| App framework    | **SvelteKit 3** (routing + server endpoints; built on Vite)             |
| Build/dev server | **Vite 8**                                                              |
| Language         | **TypeScript 6** (strict)                                               |
| Graphics         | **SVG** rendered by Svelte components (no graphics library)             |
| Font             | **Fredoka** (Google Fonts, loaded in `+layout.svelte`)                  |
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
  app.html                HTML shell
  lib/
    cat/
      types.ts            Cat data model + option id lists
      options.ts          labels, color palettes, names, DEFAULT_CAT, randomCat()
      geometry.ts         pose/shape → part positions (pure)
      patterns.ts         pattern markings per part (pure)
      animation.ts        mood + time → animation state (pure)
      color.ts            color helpers, rainbow stops
      style.ts            shared outline/nose/blush colors
      storage.ts          CatStore interface + localStorage implementation
      clock.svelte.ts     useClock(): animation time via requestAnimationFrame
      CatView.svelte      draws a Cat as SVG
      parts/              Part, Limb, Head, Face, Eye components
  routes/
    +layout.svelte        global styles, font, colors
    +page.svelte          home: title + your animated cat
    design/+page.svelte   the cat designer
    gallery/+page.svelte  every option side by side (dev aid)
vite.config.ts            Vite + SvelteKit config (adapter + compiler options live here in Kit 3)
```

Notes:

- In SvelteKit 3 there is no `svelte.config.js`; Kit options are passed to the `sveltekit()` plugin in
  `vite.config.ts`.
- Imports from `src/lib` use the `#lib/...` subpath alias **with the file extension**, e.g.
  `import { DEFAULT_CAT } from '#lib/cat/options.ts'` (`.svelte` files too). Inside `src/lib`, relative
  imports without extensions are fine.

## Conventions

- Svelte 5 runes (`$state`, `$derived`, `$effect`, `$props`, `$props.id()`) — no legacy `export let` /
  `$:` syntax.
- Game logic and data models in plain TypeScript under `src/lib/` (framework-free, easy to test);
  Svelte components stay thin.
- Drawing is a pure function of data: `CatView` takes `(cat, t)` and has no internal state. SVG ids
  (clip paths, gradients) are prefixed with `$props.id()` so many cats can be on one page.
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

**Persistence:**

1. **Now: `localStorage`** (`localCatStore` in `storage.ts`, key `rainbow-smiles:cat`). The designer
   autosaves on every change; loaded data goes through `sanitizeCat()` so old/invalid saves fall back to
   defaults instead of crashing.
2. **When cross-device saving is wanted**, add a database from the Vercel Marketplace (one click,
   env vars injected automatically, free tiers):
   - **Neon (Postgres)** — if we want structured data / queries. Pairs with `npx sv add drizzle`.
   - **Upstash (Redis)** — simplest key/value store (e.g. `cats:<id>` → JSON).
   - Alternative: **Supabase** (Postgres + auth + storage) if we later want logins.

   Implement the `CatStore` interface against it (probably async + a `+server.ts` endpoint); the UI only
   talks to `CatStore`.

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
5. **Placeholder page:** Replaced the SvelteKit welcome page with a placeholder.
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

### 2026-10-03 — Name + cat designer v1

1. Named the game **Rainbow Smiles Funtime Place**; chose an **anime** art style.
2. Built the cat designer (`/design`), home page with the saved cat (`/`), and `/gallery`.
3. Chose SVG-in-Svelte over canvas for the vector art (see "How the cat is drawn").
4. Checked the art with headless Edge screenshots of `/gallery` and `/design`.

## Ideas backlog

_(Fill in with Stella!)_

- More shapes / poses / patterns / moods (each is a small, contained addition — see "How the cat is
  drawn").
- Accessories (hats, bows, collars, glasses)?
- Several saved cats instead of one.
- What does the cat _do_ in the game once it's designed?
