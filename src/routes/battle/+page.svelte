<!--
	Battle: your cat vs a random cat, in one of several arenas. The server decides who wins each of
	the three rounds; this page acts it out. In each round both cats try a move that fits the round's
	trait: the round's loser misses (the other cat dodges), then the winner lands a hit and the loser
	loses a heart. Winners dance, backflip and get a gold medal; losers have a (cartoon) cry.
-->
<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import * as sfx from '#lib/audio/engine.ts';
	import type { CatAction } from '#lib/cat/animation.ts';
	import CatView from '#lib/cat/CatView.svelte';
	import { useClock } from '#lib/cat/clock.svelte.ts';
	import { layoutCat } from '#lib/cat/geometry.ts';
	import { catStoreFor, type SavedCat } from '#lib/cat/store.ts';
	import type { Cat, Pose } from '#lib/cat/types.ts';
	import BattleScene from '#lib/game/BattleScene.svelte';
	import { requestBattle, type BattleOutcome } from '#lib/game/client.ts';
	import {
		LOCATIONS,
		MOVES,
		pickLocation,
		pickMove,
		type Location,
		type Move
	} from '#lib/game/moves.ts';
	import { catLevel, TRAIT_INFO, type Progress } from '#lib/game/progress.ts';
	import { page } from '$app/state';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	type Side = 'left' | 'right';
	interface Fighter {
		/** Offset from the cat's spot, in its own 400-unit box (+x = toward the right). */
		x: number;
		/** Height off the floor. */
		y: number;
		pose: Pose;
		action: CatAction;
		hearts: number;
	}
	interface Effect {
		id: number;
		kind: 'burst' | 'slash' | 'cloud' | 'shout';
		x: number;
		y: number;
		text: string;
		born: number;
	}

	// Arena geometry (800×400 scene). Each cat is drawn in a 300-wide box (its 400-unit scene × 0.75),
	// placed so its floor lines up with the arena floor at y = 345.
	const BOX = 300;
	const BOX_TOP = 73;
	const BOX_X: Record<Side, number> = { left: 40, right: 460 };
	/** How far a cat runs to reach the other one, in box units. */
	const REACH = 300;

	const clock = useClock();
	const store = $derived(catStoreFor(data.user));

	let saved = $state<SavedCat | null>(null);
	let notFound = $state(false);
	let phase = $state<'ready' | 'searching' | 'fighting' | 'done'>('ready');
	let outcome = $state<BattleOutcome | null>(null);
	let location = $state<Location>(pickLocation());
	let caption = $state('');
	let error = $state('');
	let fighters = $state<Record<Side, Fighter>>({ left: fresh(), right: fresh() });
	let projectile = $state<{ kind: Move; x: number; y: number; rot: number } | null>(null);
	let effects = $state<Effect[]>([]);
	let shaking = $state(false);
	let skipping = false;
	let nextEffect = 0;
	let timers: ReturnType<typeof setTimeout>[] = [];

	const name = $derived(saved?.cat.name || 'Your cat');
	const theirName = $derived(outcome?.opponent.cat.name || 'Mystery cat');
	const t = $derived(clock.t);

	function fresh(): Fighter {
		return { x: 0, y: 0, pose: 'standing', action: null, hearts: 3 };
	}

	onMount(async () => {
		const id = page.url.searchParams.get('id');
		saved = (await store.list()).find((s) => s.id === id) ?? null;
		notFound = !saved;
	});
	onDestroy(() => timers.forEach(clearTimeout));

	// ----- timing helpers (instant when skipping) -----

	const wait = (ms: number) =>
		skipping ? Promise.resolve() : new Promise<void>((r) => timers.push(setTimeout(r, ms)));

	function tween(ms: number, step: (p: number) => void): Promise<void> {
		if (skipping) {
			step(1);
			return Promise.resolve();
		}
		return new Promise((resolve) => {
			const start = performance.now();
			const tick = (now: number) => {
				const p = Math.min(1, (now - start) / ms);
				step(skipping ? 1 : p);
				if (p < 1 && !skipping) requestAnimationFrame(tick);
				else resolve();
			};
			requestAnimationFrame(tick);
		});
	}

	const easeOut = (p: number) => 1 - (1 - p) ** 2;
	const other = (s: Side): Side => (s === 'left' ? 'right' : 'left');
	const toward = (s: Side) => (s === 'left' ? 1 : -1);
	const catOf = (s: Side): Cat => (s === 'left' ? saved!.cat : outcome!.opponent.cat);
	const nameOf = (s: Side) => (s === 'left' ? name : theirName);

	/** Where a cat's head is in the arena right now. */
	function headAt(s: Side): { x: number; y: number } {
		const f = fighters[s];
		const L = layoutCat({ shape: catOf(s).shape, pose: f.pose });
		const pivot = L.shadow.cx;
		const facing = s === 'left' ? -1 : 1; // the left cat is flipped to face right
		const lx = pivot + f.x + facing * (L.head.x - pivot);
		const ly = L.head.y - f.y;
		return { x: BOX_X[s] + lx * 0.75, y: BOX_TOP + ly * 0.75 };
	}

	function effect(kind: Effect['kind'], x: number, y: number, text = '') {
		if (skipping) return;
		effects = [
			...effects.filter((e) => t - e.born < 1.2),
			{ id: nextEffect++, kind, x, y, text, born: t }
		];
	}

	async function setAction(s: Side, action: CatAction, ms: number) {
		fighters[s].action = action;
		await wait(ms);
		if (fighters[s].action === action) fighters[s].action = null;
	}

	// ----- moves -----

	async function hit(target: Side, move: Move) {
		const h = headAt(target);
		const away = -toward(target);
		fighters[target].hearts = Math.max(0, fighters[target].hearts - 1);
		// Above the head, a little toward the attacker, so the hurt face stays visible.
		effect('burst', h.x - away * 40, h.y - 95, MOVES[move].impact);
		sfx.bonk();
		if (!skipping) {
			shaking = true;
			timers.push(setTimeout(() => (shaking = false), 350));
		}
		if (move === 'catnip') {
			effect('cloud', h.x, h.y);
			sfx.sparkle();
			void setAction(target, 'dizzy', 1600);
		} else {
			void setAction(target, 'hurt', 900);
		}
		if (move === 'cucumber') {
			sfx.eek();
			await tween(700, (p) => (fighters[target].y = 170 * Math.sin(Math.PI * p)));
		} else {
			await tween(350, (p) => (fighters[target].x = away * 60 * Math.sin(Math.PI * p)));
		}
	}

	async function dodge(target: Side) {
		const h = headAt(target);
		sfx.boing();
		effect('shout', h.x, h.y - 70, 'MISSED!');
		await tween(600, (p) => (fighters[target].y = 150 * Math.sin(Math.PI * p)));
	}

	async function melee(attacker: Side, move: Move, lands: boolean) {
		const A = fighters[attacker];
		const target = other(attacker);
		const dir = toward(attacker);
		const head = headAt(attacker);
		effect(
			'shout',
			head.x,
			head.y - 60,
			move === 'karate-chop' ? 'HI-YAH!' : move === 'kick' ? 'HYAA!' : '…'
		);

		if (move === 'sneaky-pounce') {
			A.pose = 'stretching';
			await tween(900, (p) => (A.x = dir * 110 * p));
		}
		sfx.whoosh();
		const from = A.x;
		const dodging = lands ? null : wait(150).then(() => dodge(target));
		if (move === 'karate-chop') {
			await tween(400, (p) => (A.x = from + dir * (REACH - from * dir) * easeOut(p)));
			const h = headAt(target);
			effect('slash', h.x - dir * 30, h.y - 10);
		} else {
			if (move === 'sneaky-pounce') A.pose = 'standing';
			sfx.boing();
			await tween(500, (p) => {
				A.x = from + dir * (REACH - from * dir) * p;
				A.y = (move === 'kick' ? 130 : 170) * Math.sin(Math.PI * p);
			});
		}
		if (lands) await hit(target, move);
		await dodging;
		await tween(350, (p) => (A.x = dir * REACH * (1 - p)));
		A.pose = 'standing';
	}

	async function toss(attacker: Side, move: Move, lands: boolean) {
		const target = other(attacker);
		const dir = toward(attacker);
		const head = headAt(attacker);
		if (move === 'hairball') {
			effect('shout', head.x, head.y - 60, 'HCK… HCK…');
			sfx.hack();
			await setAction(attacker, 'hurt', 800);
		} else {
			effect('shout', head.x, head.y - 60, MOVES[move].icon);
			void setAction(attacker, 'celebrating', 500);
			await wait(300);
		}
		sfx.whoosh();
		const start = headAt(attacker);
		const end = lands ? headAt(target) : { x: dir > 0 ? 880 : -80, y: headAt(target).y - 20 };
		const dodging = lands ? null : wait(200).then(() => dodge(target));
		projectile = { kind: move, ...start, rot: 0 };
		await tween(lands ? 650 : 900, (p) => {
			projectile = {
				kind: move,
				x: start.x + (end.x - start.x) * p,
				y:
					start.y +
					(end.y - start.y) * p -
					90 * Math.sin(Math.PI * Math.min(1, p * (lands ? 1 : 0.75))),
				rot: p * 720 * dir
			};
		});
		projectile = null;
		if (lands) await hit(target, move);
		await dodging;
	}

	function perform(attacker: Side, move: Move, lands: boolean) {
		return MOVES[move].style === 'melee'
			? melee(attacker, move, lands)
			: toss(attacker, move, lands);
	}

	// ----- the battle -----

	async function battle() {
		if (!saved) return;
		sfx.pop();
		timers.forEach(clearTimeout);
		skipping = false;
		phase = 'searching';
		outcome = null;
		error = '';
		effects = [];
		projectile = null;
		fighters = { left: fresh(), right: fresh() };
		// ?arena=dojo (etc.) picks the arena; handy for testing the art.
		const asked = page.url.searchParams.get('arena');
		location = asked && asked in LOCATIONS ? (asked as Location) : pickLocation();
		caption = 'Looking for an opponent…';
		try {
			const [result] = await Promise.all([requestBattle(data.user, saved), wait(1000)]);
			outcome = result;
		} catch (err) {
			console.error(err);
			error = "Couldn't find an opponent right now. Try again!";
			phase = 'ready';
			return;
		}
		phase = 'fighting';
		caption = `${name} vs ${theirName} at ${LOCATIONS[location].label}!`;
		sfx.meow();
		await wait(1600);

		for (const [i, round] of outcome.result.rounds.entries()) {
			const info = TRAIT_INFO[round.trait];
			const winner: Side = round.winner === 'a' ? 'left' : 'right';
			const loser = other(winner);
			caption = `Round ${i + 1}: ${info.icon} ${info.label}!`;
			await wait(1000);

			const miss = pickMove(round.trait);
			caption = `${nameOf(loser)} tries a ${MOVES[miss].icon} ${MOVES[miss].label}…`;
			await perform(loser, miss, false);
			await wait(300);

			const land = pickMove(round.trait);
			caption = `${nameOf(winner)} uses ${MOVES[land].icon} ${MOVES[land].label}!`;
			await perform(winner, land, true);
			await wait(700);
		}
		finish();
	}

	function finish() {
		if (!saved || !outcome) return;
		skipping = false;
		projectile = null;
		const iWon = outcome.result.winner === 'a';
		// Make sure the hearts match the result even if the show was skipped.
		const lost = (s: Side) =>
			outcome!.result.rounds.filter((r) => (r.winner === 'a' ? 'right' : 'left') === s).length;
		fighters = {
			left: { ...fresh(), hearts: 3 - lost('left'), action: iWon ? 'celebrating' : 'crying' },
			right: { ...fresh(), hearts: 3 - lost('right'), action: iWon ? 'crying' : 'celebrating' }
		};
		phase = 'done';
		saved = { ...saved, progress: outcome.progress };
		if (iWon) {
			caption = `${name} wins! 🏆`;
			sfx.cheer();
		} else {
			caption = `${theirName} wins this time.`;
			sfx.sadTrombone();
		}
	}

	function skip() {
		skipping = true;
	}

	const winnerSide = $derived<Side | null>(
		phase === 'done' && outcome ? (outcome.result.winner === 'a' ? 'left' : 'right') : null
	);

	function record(p: Progress): string {
		return `🏆 ${p.wins} – ${p.losses}`;
	}
</script>

<svelte:head>
	<title>Battle · {name}</title>
</svelte:head>

{#snippet fighterView(side: Side, cat: Cat)}
	{@const f = fighters[side]}
	<div
		class="fighter-box"
		class:dance={winnerSide === side}
		style="left: {(BOX_X[side] / 800) * 100}%; top: {(BOX_TOP / 400) * 100}%; width: {(BOX / 800) *
			100}%"
	>
		<CatView
			cat={{ ...cat, pose: f.pose }}
			t={t + (side === 'right' ? 1.7 : 0)}
			scenery={false}
			action={f.action}
			medal={winnerSide === side}
			offset={{ x: f.x, y: f.y, flip: side === 'left' }}
		/>
	</div>
{/snippet}

{#snippet projectileArt(kind: Move)}
	{#if kind === 'cucumber'}
		<rect
			x="-26"
			y="-11"
			width="52"
			height="22"
			rx="11"
			fill="#69db7c"
			stroke="#3b2a40"
			stroke-width="3"
		/>
		<circle cx="-8" cy="-2" r="2" fill="#2b8a3e" />
		<circle cx="8" cy="3" r="2" fill="#2b8a3e" />
	{:else if kind === 'fish-bone'}
		<g stroke="#3b2a40" stroke-width="3" fill="white">
			<path d="M -26 0 L 22 0" />
			{#each [-14, -4, 6] as x (x)}<path d="M {x} -10 L {x + 4} 0 L {x} 10" fill="none" />{/each}
			<circle cx="-30" cy="0" r="7" />
			<path d="M 22 0 L 32 -10 L 32 10 Z" />
		</g>
	{:else if kind === 'hairball'}
		<circle r="15" fill={saved?.cat.color ?? '#aaa'} stroke="#3b2a40" stroke-width="3" />
		<path
			d="M -10 -4 q 5 -6 10 0 q 5 6 10 0 M -8 6 q 4 -4 8 0"
			fill="none"
			stroke="#3b2a40"
			stroke-width="2"
		/>
	{:else if kind === 'catnip'}
		{#each [0, 120, 240] as a (a)}
			<ellipse
				cx="0"
				cy="-10"
				rx="7"
				ry="13"
				fill="#51cf66"
				stroke="#2b8a3e"
				stroke-width="2"
				transform="rotate({a})"
			/>
		{/each}
		<circle r="5" fill="#94d82d" />
	{/if}
{/snippet}

<main>
	<header>
		{#if saved}<a class="pill" href="/cat?id={saved.id}">🏡 Back to {name}</a>{/if}
		<a class="pill" href="/">🏠 My cats</a>
	</header>

	{#if notFound}
		<p class="center">We couldn't find that cat. <a href="/">Back to My cats</a></p>
	{:else if saved}
		<h1>⚔️ Battle Arena</h1>
		<p class="caption">{caption || `Ready, ${name}?`}</p>

		<div class="arena" class:shaking>
			<svg class="layer" viewBox="0 0 800 400" aria-hidden="true">
				<BattleScene {location} {t} />
			</svg>

			{@render fighterView('left', saved.cat)}
			{#if outcome && phase !== 'searching'}
				{@render fighterView('right', outcome.opponent.cat)}
			{:else}
				<div class="mystery" class:searching={phase === 'searching'}>❓</div>
			{/if}

			<svg class="layer fx" viewBox="0 0 800 400" aria-hidden="true">
				{#if projectile}
					<g transform="translate({projectile.x} {projectile.y}) rotate({projectile.rot})">
						{@render projectileArt(projectile.kind)}
					</g>
				{/if}
				{#each effects as e (e.id)}
					{@const age = t - e.born}
					{#if age < 1.1}
						{@const pop =
							Math.min(1, age * 8) * (1 + 0.15 * Math.sin(Math.min(1, age * 4) * Math.PI))}
						<g
							transform="translate({e.x} {e.y - age * 15}) scale({pop})"
							opacity={age > 0.8 ? (1.1 - age) / 0.3 : 1}
						>
							{#if e.kind === 'burst'}
								<g transform="scale(0.75)">
									<path
										d="M 0 -62 L 16 -30 L 56 -40 L 34 -8 L 66 16 L 26 22 L 30 60 L 0 36 L -30 60 L -26 22 L -66 16 L -34 -8 L -56 -40 L -16 -30 Z"
										fill="#ffd43b"
										stroke="#3b2a40"
										stroke-width="4"
										stroke-linejoin="round"
									/>
									<text
										y="10"
										text-anchor="middle"
										font-size="26"
										font-weight="700"
										fill="#e03131"
										stroke="white"
										stroke-width="1">{e.text}</text
									>
								</g>
							{:else if e.kind === 'slash'}
								{#each [-14, 0, 14] as d (d)}
									<path
										d="M {-40 + d} {-40 - d} Q 0 {-10 - d} {40 + d} {20 - d}"
										fill="none"
										stroke="white"
										stroke-width="7"
										stroke-linecap="round"
									/>
								{/each}
							{:else if e.kind === 'cloud'}
								{#each [[-30, 0, 26], [0, -18, 30], [30, 0, 26], [0, 14, 24]] as [cx, cy, r], i (i)}
									<circle {cx} {cy} r={r * (1 + age)} fill="#8ce99a" opacity="0.7" />
								{/each}
								<text y="8" text-anchor="middle" font-size="24">✨</text>
							{:else}
								<text
									text-anchor="middle"
									font-size="30"
									font-weight="700"
									fill="white"
									stroke="#3b2a40"
									stroke-width="6"
									paint-order="stroke">{e.text}</text
								>
							{/if}
						</g>
					{/if}
				{/each}
			</svg>

			<div class="hud left">
				<span class="hud-name">{name}</span>
				<span class="hearts"
					>{'❤️'.repeat(fighters.left.hearts)}{'🤍'.repeat(3 - fighters.left.hearts)}</span
				>
			</div>
			{#if outcome && phase !== 'searching'}
				<div class="hud right">
					<span class="hud-name">{theirName}</span>
					<span class="hearts"
						>{'❤️'.repeat(fighters.right.hearts)}{'🤍'.repeat(3 - fighters.right.hearts)}</span
					>
				</div>
			{/if}
			<div class="place">{LOCATIONS[location].icon} {LOCATIONS[location].label}</div>
		</div>

		<div class="cards">
			<div class="card">
				<p class="who">{name}</p>
				<p class="stats">Level {catLevel(saved.progress)} · {record(saved.progress)}</p>
			</div>
			<div class="card">
				{#if outcome && phase !== 'searching'}
					<p class="who">{theirName}</p>
					<p class="stats">
						Level {catLevel(outcome.opponent.progress)} ·
						{outcome.opponent.wild ? '🌿 Wild cat' : record(outcome.opponent.progress)}
					</p>
				{:else}
					<p class="who">???</p>
				{/if}
			</div>
		</div>

		{#if error}<p class="caption error">{error}</p>{/if}

		<div class="buttons">
			{#if phase === 'ready'}
				<button class="go" onclick={battle}>⚔️ Find an opponent!</button>
			{:else if phase === 'fighting'}
				<button class="skip" onclick={skip}>⏩ Skip to the end</button>
			{:else if phase === 'done'}
				{#if winnerSide === 'right'}
					<p class="cheer-up">Aww, so close! Train a bit more and you'll get them next time. 💪</p>
				{/if}
				<button class="go" onclick={battle}>⚔️ Battle again</button>
				<a class="go alt" href="/train?id={saved.id}">🏋️ Train</a>
			{/if}
		</div>
	{:else}
		<p class="center">Finding your cat…</p>
	{/if}
</main>

<style>
	main {
		max-width: 1100px;
		margin: 0 auto;
		padding: 12px 16px 40px;
	}
	header {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
	}
	.pill {
		font-size: 1.15rem;
		font-weight: 600;
		text-decoration: none;
		color: inherit;
		padding: 6px 14px;
		border-radius: 999px;
		background: #fff;
		box-shadow: 0 2px 8px #e9b6d455;
	}
	h1 {
		text-align: center;
		font-size: clamp(2rem, 6vw, 3rem);
		margin: 12px 0 0;
		background: var(--rainbow);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
	}
	.center {
		text-align: center;
	}
	.caption {
		text-align: center;
		font-size: clamp(1.2rem, 3.5vw, 1.8rem);
		font-weight: 700;
		min-height: 2.6rem;
		margin: 8px 0;
	}
	.caption.error {
		color: #c2185b;
		font-size: 1.2rem;
	}
	.arena {
		position: relative;
		aspect-ratio: 2;
		border-radius: 24px;
		overflow: hidden;
		box-shadow: 0 6px 24px #e9b6d455;
		user-select: none;
	}
	.shaking {
		animation: shake 0.35s;
	}
	.layer {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}
	.fx {
		pointer-events: none;
	}
	.fighter-box {
		position: absolute;
		aspect-ratio: 1;
	}
	.mystery {
		position: absolute;
		right: 12%;
		top: 35%;
		font-size: clamp(3rem, 10vw, 6rem);
		opacity: 0.5;
	}
	.searching {
		animation: spin 1s linear infinite;
	}
	.hud {
		position: absolute;
		top: 10px;
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 4px 12px;
		border-radius: 14px;
		background: #ffffffd9;
		font-weight: 700;
	}
	.hud.left {
		left: 10px;
	}
	.hud.right {
		right: 10px;
		text-align: right;
	}
	.hud-name {
		font-size: clamp(0.9rem, 2.5vw, 1.3rem);
	}
	.hearts {
		font-size: clamp(0.9rem, 2.5vw, 1.3rem);
	}
	.place {
		position: absolute;
		bottom: 8px;
		left: 50%;
		transform: translateX(-50%);
		padding: 2px 12px;
		border-radius: 999px;
		background: #ffffffd9;
		font-weight: 700;
		white-space: nowrap;
	}
	.cards {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
		margin-top: 12px;
	}
	.card {
		background: var(--card);
		border-radius: 18px;
		padding: 8px 12px;
		text-align: center;
		box-shadow: 0 4px 14px #e9b6d433;
	}
	.who {
		margin: 0;
		font-size: 1.4rem;
		font-weight: 700;
	}
	.stats {
		margin: 2px 0;
		font-size: 1.1rem;
		font-weight: 600;
	}
	/* Victory dance: hop, wiggle, then two backflips. */
	.dance {
		animation: dance 3.2s ease-in-out infinite;
	}
	@keyframes dance {
		0%,
		100% {
			transform: translateY(0) rotate(0);
		}
		10% {
			transform: translateY(-12%) rotate(-8deg);
		}
		20% {
			transform: translateY(0) rotate(8deg);
		}
		30% {
			transform: translateY(-12%) rotate(-8deg);
		}
		40% {
			transform: translateY(0) rotate(0);
		}
		55% {
			transform: translateY(-30%) rotate(-180deg);
		}
		70% {
			transform: translateY(0) rotate(-360deg);
		}
		85% {
			transform: translateY(-30%) rotate(-540deg);
		}
		99.9% {
			transform: translateY(0) rotate(-720deg);
		}
	}
	@keyframes shake {
		0%,
		100% {
			translate: 0;
		}
		20% {
			translate: -10px 4px;
		}
		40% {
			translate: 8px -4px;
		}
		60% {
			translate: -6px 2px;
		}
		80% {
			translate: 4px 0;
		}
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	.buttons {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		margin-top: 16px;
	}
	.cheer-up {
		font-size: 1.3rem;
		font-weight: 600;
		text-align: center;
		margin: 0;
	}
	.go {
		display: inline-block;
		font-size: 1.6rem;
		font-weight: 700;
		padding: 12px 30px;
		border: none;
		border-radius: 999px;
		background: var(--accent);
		color: white;
		text-decoration: none;
		cursor: pointer;
		box-shadow: 0 4px 0 var(--accent-dark);
	}
	.go.alt {
		background: #9775fa;
		box-shadow: 0 4px 0 #7048e8;
	}
	.skip {
		font-size: 1.2rem;
		font-weight: 700;
		padding: 8px 22px;
		border-radius: 999px;
		border: 3px solid #f1e4f5;
		background: #fff;
		cursor: pointer;
	}
</style>
