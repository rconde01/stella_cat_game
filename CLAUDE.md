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
- **Players & saving:** Players can make an **account** (username + password) and keep **many cats**.
  Guests can play too; their cats live in the browser and move into the account when they sign up.
  See [Accounts & data](#accounts--data).
- **Audience:** A kid. Prefer big, friendly, forgiving UI; avoid anything that needs typing or reading
  long text where possible.

## Feature: Cat designer

The first part of the game: the player designs cats at `/design` (`/design?id=<id>` edits a saved
one). The home page (`/`) shows **My cats**, all animated, plus a "New cat" card. The designer
autosaves ~0.6s after each change (status shows "Saving… / ✓ Saved"), and has a 🗑️ Delete button with
an in-page "are you sure?".

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
| **Accessories**      | One per slot (see below). Tap again to take it off.                        |
| **Background**       | Plain, Lawn, Woods, Bedroom, Rainbow, Starry night, Pink paws, Hearts.     |

Accessory slots (`ACCESSORY_OPTIONS` in `options.ts`; picking a second item in a slot replaces the
first):

| Slot    | Items                                                                                                                                      |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Head    | Party hat, Top hat, Crown, Bow, Unicorn horn (sparkles)                                                                                    |
| Eyes    | Glasses, Heart shades, **Laser eyes** (red eyes + pulsing beams)                                                                           |
| Costume | **Armour** (steel plates, rivets, greaves), **Robot** (metal body, blinking control panel, segmented legs/tail, ear bolts, wobbly antenna) |
| Fur     | **S'mores** (graham crackers, marshmallows, chocolate stuck in the fur)                                                                    |

Backgrounds animate gently (drifting clouds, turning sun, twinkling stars).

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
- **Fluffy** uses an SVG turbulence + displacement filter to roughen the fur outline (skipped when a
  metal costume is worn).
- **Accessories** (`accessories/`): head and eye items are drawn in head units on top of the face
  (`HeadGear`, `Eyewear`); costumes are drawn inside each body blob's clip (`CostumeBody`, passed as
  `Part`'s children) plus extra stroke layers on legs/tail (`costumeLimbLayers` in `costume.ts`);
  `Smores` places pieces at fixed spots on the body and head. `Limb` takes a stack of stroke layers
  (pattern dashes + costume pieces).
- **Backgrounds** (`Scenery.svelte`) are drawn first, in the 400×400 scene; the cat stands on y = 362.
  `CatView`'s `scenery` prop turns them off (option thumbnails other than "Place").
- **Animation clock**: `useClock()` (`clock.svelte.ts`) runs one `requestAnimationFrame` loop per page;
  option thumbnails are static (`t = 0.5`) to keep things calm and cheap.
- **`/gallery`** shows every accessory, background, shape × pose, mood and pattern side by side — use
  it to check art changes.

### Checking the art without a browser

Headless Edge can screenshot pages from the dev server (useful for Claude to see the drawings):

```powershell
& "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless=new --disable-gpu `
  --hide-scrollbars --window-size=1000,2600 --virtual-time-budget=4000 `
  --screenshot="<scratch>\gallery.png" http://localhost:5173/gallery
```

Headless Edge has a minimum window width (~500px), so use ≥600px widths when checking layouts.

To test real interactions (clicking, autosave, logging in), drive the installed Edge with
`playwright-core` (`chromium.launch({ channel: 'msedge' })` — no browser download needed). Install it
in a scratch folder, not in this project.

## Feature: Looking after your cat (Tamagotchi-style)

Tapping a cat on **My cats** opens its page, `/cat?id=<id>`. Rules live in `lib/care/care.ts` (pure,
unit-tested in `care.test.ts`).

- **Three needs**, 0–100: 🐟 Food (empties in ~3h), 🪶 Play (~2h), 🪮 Brushed (~5h). They keep going
  down while you're away (`advanceCare` catches up minute by minute when the page opens).
- **The cat never gets sick or dies** (Rob's rule: too sad). Instead, after ~12 minutes with any need
  below 20, it **poops or pees on one of your favorite things** (teddy, slippers, backpack, pillow),
  at most one mess per item. Tap a mess to clean it. Which item and poop-vs-pee is "random" but seeded
  by the minute it happened, so every page and every catch-up agrees.
- **Feed**: a bowl appears and the cat munches (+35). Feeding a full cat annoys it.
- **Play**: wave a feather wand over the stage; the cat's eyes follow it; moving fills the meter.
- **Brush**: rub the brush over the cat; sparkles and fur tufts fly and it purrs. Brushing an already
  shiny cat annoys it.
- **Pet** (default): tap or stroke. Happy → purrs (^^ eyes, hearts); needy → meows.
- **Annoyance** builds from rapid poking, overfeeding and over-brushing and fades over time. Past a
  limit (lower for grumpy cats) the cat **hisses**: angry face, flat ears, fangs, 💢.
- Needy cats **meow** every ~15s with a thought bubble showing what they want; happy cats purr now and
  then. My cats shows badges per cat (🐟🪶🪮 needs, 💩💦 messes, 💕 all good).
- Care is saved separately from the cat's look (`SavedCat.care`; `PATCH /api/cats/:id` with `{ care }`).

## Feature: Training & battles

Rules in `lib/game/` (pure, unit-tested in `game.test.ts`): `progress.ts` (traits, XP, levels),
`battle.ts` (`fight`). Pages: `/train?id=` and `/battle?id=`, linked from the cat's page.

**Four traits, each with a training mini-game** (`lib/game/games/`, ~15–20s each, tap/touch friendly,
no way to "fail" — every game gives some XP):

| Trait       | Game            | How it works                                                         |
| ----------- | --------------- | -------------------------------------------------------------------- |
| 🏃 Speed    | **Mouse Chase** | Tap the scurrying mouse; it speeds up after every catch.             |
| 💪 Strength | **Tug of War**  | Tap PULL fast to drag the rope away from a giant toy fish.           |
| 🤸 Agility  | **Hop Hop Hop** | Tap to jump yarn balls, cucumbers and shoes. Bumps just don't count. |
| 🧠 Smarts   | **Copycat**     | Simon-says with 🐟🧶🐭🥛 pads; the pattern grows each round.         |

- XP = 15 + 60% of the game score (0–100). Level _n_ → _n_+1 needs 40 + 20·_n_ XP; max level 20.
  The cat's overall level = 1 + all trait levels gained.
- Training costs 8 food and gives +10 play; a cat below 15 food is too hungry to train.

**Battles**: "Find an opponent!" picks a random cat from **another player** (any cat for guests); if
there is none, a made-up **wild cat** near your level. Three rounds, each a different random trait;
each cat's power = 2 × trait level + a roll of 1–8 (ties re-roll); best of three wins. So training
matters (a +2-level cat wins ~80–95%) but luck keeps it exciting. Each round shows the winner's move
(Zoomies Dash, Mighty Paw, Backflip Dodge, Sneaky Trick).

- **Winner**: dances, does two backflips, wears a **gold medal** (`CatView` `medal` prop), fanfare.
- **Loser**: cartoon waterfall tears (`action="crying"`), "wah-wah", then an encouraging message.
- **Records** (🏆 wins – losses) show under each cat in the arena, on the cat's page and on My cats.
- Logged-in battles are decided on the server (`battleForUser`), which updates **both** cats' records;
  the opponent's owner is never shown. Guest battles are decided on the server too, but only the
  guest's own record (in their browser) changes.
- Not cheat-proof: a player could PATCH their own `progress`. Fine for a family game.

## Sound & music

All synthesized with the Web Audio API in `lib/audio/` — no audio files:

- `engine.ts`: meow (sawtooth with a pitch glide + sweeping vowel filters; higher for kittens, lower for
  grumpy cats), hiss (filtered noise burst), purr (low noise pulsing 25×/s, swelling slowly), nom,
  brush swish, sparkle arpeggio, button pop, and the mess sounds (a "plop… pfrrt" and a trickle).
- `music.ts`: an 8-bar C–Am–F–G loop (triangle lead, sine bass, sparkly arpeggio) scheduled with a
  look-ahead timer.
- `settings.svelte.ts`: 🎵/🔊 toggles in the top bar, remembered per browser. Browsers block audio
  until the first tap, so audio starts on the first pointer/key press.
- These were tuned without listening — expect to tweak by ear (or swap in recorded CC0 sounds).

## Tech stack

| Concern          | Choice                                                                       |
| ---------------- | ---------------------------------------------------------------------------- |
| UI framework     | **Svelte 5** (runes mode is forced on for all project files)                 |
| App framework    | **SvelteKit 3** (routing + server endpoints; built on Vite)                  |
| Build/dev server | **Vite 8**                                                                   |
| Language         | **TypeScript 6** (strict)                                                    |
| Graphics         | **SVG** rendered by Svelte components (no graphics library)                  |
| Font             | **Fredoka** (Google Fonts, loaded in `+layout.svelte`)                       |
| Formatting       | **Prettier** (+ `prettier-plugin-svelte`)                                    |
| Linting          | **ESLint 10** flat config (`typescript-eslint`, `eslint-plugin-svelte`)      |
| Hosting          | **Vercel** via `@sveltejs/adapter-vercel`                                    |
| Database         | **Turso** (hosted SQLite / libSQL) via `@libsql/client`, plain SQL           |
| Auth             | Hand-rolled: scrypt password hashes + cookie sessions (`lib/server/auth.ts`) |
| Runtime          | **Node 24 LTS** (pinned in `package.json` `engines`)                         |
| Package manager  | **npm**                                                                      |

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
npm test               # unit tests (Vitest)
npm run build          # production build (emits Vercel output)
npm run preview        # serve the production build locally
```

Before committing, run `npm run format`, `npm run lint`, `npm run check`, `npm test` and
`npm run build`; all should pass.

## Project layout

```
src/
  app.html                HTML shell
  app.d.ts                App.Locals.user
  env.ts                  environment variables (Kit 3 defineEnvVars) → `$app/env/private`
  hooks.server.ts         reads the session cookie → event.locals.user
  lib/
    cat/
      types.ts            Cat data model + option id lists
      options.ts          labels, palettes, accessory slots, names, DEFAULT_CAT, randomCat()
      sanitize.ts         sanitizeCat(): any input → valid Cat (browser + server)
      store.ts            CatStore interface; localCatStore (guests), accountCatStore (API)
      geometry.ts         pose/shape → part positions (pure)
      patterns.ts         pattern markings per part (pure)
      costume.ts          armour/robot leg + tail layers
      animation.ts        mood + time → animation state (pure)
      color.ts, style.ts  color helpers and shared drawing colors
      clock.svelte.ts     useClock(): animation time via requestAnimationFrame
      CatView.svelte      draws a Cat (and its background) as SVG
      Scenery.svelte      backgrounds
      parts/              Part, Limb, Head, Face, Eye
      accessories/        HeadGear, Eyewear, CostumeBody, Smores
    server/               server-only (Kit blocks importing these into the browser)
      db.ts               libSQL client, schema (CREATE TABLE IF NOT EXISTS on first use)
      auth.ts             users, password hashing, sessions
      cats.ts             saved cats per user
  routes/
    +layout.server.ts     passes { user, accountsEnabled } to every page
    +layout.svelte        global styles, font, colors, account bar (Log in / Log out)
    +page.svelte          home: My cats (moves guest cats into the account after login)
    design/+page.svelte   the cat designer (load by ?id=, autosave, delete)
    login/                Make account / Log in (form actions: ?/register, ?/login)
    logout/               POST to log out
    api/cats/             GET list, POST create; [id]: PUT update, DELETE
    gallery/+page.svelte  every option side by side (dev aid)
vite.config.ts            Vite + SvelteKit config (adapter + compiler options live here in Kit 3)
```

Notes:

- In SvelteKit 3 there is no `svelte.config.js`; Kit options are passed to the `sveltekit()` plugin in
  `vite.config.ts`.
- Imports from `src/lib` use the `#lib/...` subpath alias **with the file extension**, e.g.
  `import { DEFAULT_CAT } from '#lib/cat/options.ts'` (`.svelte` files too). Inside `src/lib`, relative
  imports without extensions are fine.
- SvelteKit 3 renamed some built-ins: `dev`/`browser` come from `$app/env` (not `$app/environment`);
  env vars are declared in `src/env.ts` and imported by name from `$app/env/private` (not `$env/...`);
  hook types like `Handle` come from `@sveltejs/kit/hooks`.

## Conventions

- Svelte 5 runes (`$state`, `$derived`, `$effect`, `$props`, `$props.id()`) — no legacy `export let` /
  `$:` syntax.
- Game logic and data models in plain TypeScript under `src/lib/` (framework-free, easy to test);
  Svelte components stay thin.
- Drawing is a pure function of data: `CatView` takes `(cat, t)` and has no internal state. SVG ids
  (clip paths, gradients) are prefixed with `$props.id()` so many cats can be on one page.
- Line endings are LF everywhere (enforced by `.gitattributes`) so Prettier passes on Windows.
- Commit small, descriptive commits and push to `origin/main` as we go.

## Hosting

**Vercel** (account already exists). Live at <https://stella-cat-game.vercel.app/>.

- GitHub Pages only serves static files, so it can't host accounts or a database.
- Vercel hosts SvelteKit natively (static pages + serverless functions for `+server.ts` endpoints and
  form actions), deploys automatically on every push to `main`, and creates a preview URL for every
  other branch/PR. The free Hobby tier is enough for a personal project.

## Accounts & data

**Two places cats can live**, behind one `CatStore` interface (`lib/cat/store.ts`):

| Player    | Store             | Where                                                    |
| --------- | ----------------- | -------------------------------------------------------- |
| Guest     | `localCatStore`   | Browser `localStorage`, key `rainbow-smiles:cats`        |
| Logged in | `accountCatStore` | `/api/cats` → Turso database (`cats` table, JSON column) |

- When a player logs in or signs up, the home page moves any guest cats on that device into the
  account (`moveGuestCatsToAccount`) and says so.
- Every saved cat (browser or server) goes through `sanitizeCat()`, so bad or old data can't break the
  game. The server also scopes every query by user id, and caps cats at 100 per player.
- An old single-cat save (`rainbow-smiles:cat`, from v1) is migrated automatically.

**Database: Turso (libSQL = SQLite over the network).** Chosen because local development needs zero
setup (`file:local.db`, git-ignored) and Turso has a free tier and a Vercel Marketplace integration.
Plain SQL via `@libsql/client` (3 tables, no ORM); tables are created on first use, so there are no
migration steps to run. If the schema needs to change later, consider adding Drizzle.

- Dev: no env vars needed → `local.db` in the project root. Delete it to start fresh.
- Production: needs `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`. **If they're missing, accounts are
  switched off** (`accountsEnabled()` is false): the Log in button is hidden and everyone plays as a
  guest, so the site never breaks.

**Accounts** (`lib/server/auth.ts`): username (3–20 letters/numbers/`_`/`-`, case-insensitive unique)

- password (6+ chars, kid-friendly). Passwords are hashed with scrypt + random salt. Login sets an
  httpOnly, SameSite=Lax `session` cookie holding a random token; the database stores only the token's
  SHA-256, valid 60 days. No email, so **no password reset** — a grown-up should note the password.
  Not yet done: rate-limiting login attempts.

`npm run build` on Windows prints a warning that `@libsql/linux-x64-gnu` can't be found — harmless:
Vercel builds on Linux where it exists, and production talks to Turso over HTTPS anyway.

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

### 2026-10-03 — Accessories, backgrounds, accounts, many cats

1. Added accessories (hats, bow, unicorn horn, glasses, heart shades, laser eyes, armour, robot,
   s'mores) and backgrounds (lawn, woods, bedroom, rainbow, starry night, pink paws, hearts), with
   "Dress up" and "Place" tabs. ("Laser" was interpreted as laser eyes.)
2. Added multiple saved cats ("My cats" home page) and accounts. `npm install @libsql/client`.
3. Verified with an HTTP test (register/login/logout, duplicate names, 401 when logged out, a second
   player can't read/edit/delete someone else's cat) and a real-browser Playwright run of the full
   guest → sign up → cats moved → edit/reload → delete → log out → log in flow.

### 2026-10-06 — Care (Tamagotchi), sound & music

1. Added the cat page (`/cat`) with feed / play / brush / pet, annoyance → hiss, meows and purrs,
   and mischief messes on your favorite stuff instead of sickness.
2. Added synthesized sound effects and background music with on/off toggles.
3. Saved cats gained a `care` part (new `care` column, added automatically to existing databases) and
   are now listed oldest-first. API update changed from `PUT` to `PATCH { cat?, care? }`.
4. Added Vitest (`npm test`) with unit tests for the care rules; checked the page in a real browser.

### 2026-10-06 — Turso connected in Vercel (accounts live)

Rob added Turso through the Vercel dashboard (**Storage** → Marketplace → **Turso**, connected to the
project), checked that `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` exist under **Settings → Environment
Variables**, and redeployed (Deployments → ⋯ → Redeploy). The live login page now offers "Make your
account". New columns (`care`, `progress`) are added to the live database automatically on first use.

### 2026-10-06 — Training & battles

1. Added four training mini-games (`/train`), XP and levels per trait, and battles (`/battle`) against
   random cats from other players (or a wild cat), with win/loss records on every cat.
2. Saved cats gained a `progress` part (new `progress` column). New `POST /api/battle`.
3. Unit tests for levels and battle odds; real-browser run of all four games, a guest battle, and two
   logged-in players battling (both records updated).

## Ideas backlog

_(Fill in with Stella!)_

- More shapes / poses / patterns / moods / accessories / backgrounds (each is a small, contained
  addition — see "How the cat is drawn").
- More training games, special battle moves, or a tournament.
- Show other players' cats (a "cat park"), or pick who to battle.
- Password reset (needs a grown-up's email) and login rate-limiting.
