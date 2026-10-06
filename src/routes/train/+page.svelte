<!--
	Training: four mini-games, one per trait. Playing earns XP; enough XP levels the trait up.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import * as sfx from '#lib/audio/engine.ts';
	import { addTo, advanceCare } from '#lib/care/care.ts';
	import CatView from '#lib/cat/CatView.svelte';
	import { useClock } from '#lib/cat/clock.svelte.ts';
	import { catStoreFor, type SavedCat } from '#lib/cat/store.ts';
	import Copycat from '#lib/game/games/Copycat.svelte';
	import HopHop from '#lib/game/games/HopHop.svelte';
	import MouseChase from '#lib/game/games/MouseChase.svelte';
	import TugOfWar from '#lib/game/games/TugOfWar.svelte';
	import {
		addXp,
		catLevel,
		MAX_LEVEL,
		TRAIT_INFO,
		TRAITS,
		xpForScore,
		xpToNext,
		type Trait
	} from '#lib/game/progress.ts';
	import { page } from '$app/state';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const HOW_TO: Record<Trait, string> = {
		speed: 'Tap the mouse as many times as you can! It gets faster every time you catch it.',
		strength: 'Tap PULL as fast as you can to win the tug of war against the big toy fish!',
		agility: 'Tap to jump over the yarn, cucumbers and shoes!',
		smarts: 'Watch the pattern, then tap the same buttons in the same order!'
	};
	const GAMES = { speed: MouseChase, strength: TugOfWar, agility: HopHop, smarts: Copycat };
	/** Below this much food, the cat is too hungry to train. */
	const MIN_FOOD = 15;

	const clock = useClock();
	const store = $derived(catStoreFor(data.user));

	let saved = $state<SavedCat | null>(null);
	let notFound = $state(false);
	let trait = $state<Trait | null>(null);
	let phase = $state<'pick' | 'intro' | 'countdown' | 'play' | 'result'>('pick');
	let countdown = $state(3);
	let result = $state<{ xp: number; levelsGained: number } | null>(null);

	const name = $derived(saved?.cat.name || 'Your cat');
	const hungry = $derived(
		saved ? advanceCare(saved.care, Date.now()).care.fullness < MIN_FOOD : false
	);

	onMount(async () => {
		const id = page.url.searchParams.get('id');
		saved = (await store.list()).find((s) => s.id === id) ?? null;
		notFound = !saved;
	});

	function choose(t: Trait) {
		sfx.pop();
		trait = t;
		phase = 'intro';
	}

	function start() {
		phase = 'countdown';
		countdown = 3;
		sfx.note(0, 0.15);
		const tick = setInterval(() => {
			countdown--;
			if (countdown > 0) sfx.note(0, 0.15);
			else {
				clearInterval(tick);
				sfx.note(3, 0.3);
				phase = 'play';
			}
		}, 700);
	}

	async function finish(score: number) {
		if (!saved || !trait) return;
		const xp = xpForScore(score);
		const { progress, levelsGained } = addXp(saved.progress, trait, xp);
		// Training is fun, but it makes a cat hungry.
		let care = advanceCare(saved.care, Date.now()).care;
		care = addTo(addTo(care, 'food', -8), 'play', 10);
		saved = { ...saved, progress, care };
		result = { xp, levelsGained };
		phase = 'result';
		if (levelsGained) sfx.levelUp();
		else sfx.sparkle();
		await store.update(saved.id, { progress, care });
	}
</script>

<svelte:head>
	<title>Training · {name}</title>
</svelte:head>

<main>
	<header>
		{#if saved}<a class="pill" href="/cat?id={saved.id}">🏡 Back to {name}</a>{/if}
		<a class="pill" href="/">🏠 My cats</a>
	</header>

	{#if notFound}
		<p class="center">We couldn't find that cat. <a href="/">Back to My cats</a></p>
	{:else if saved}
		<h1>🏋️ {name}'s Training</h1>
		<p class="center level">Level {catLevel(saved.progress)}</p>

		{#if phase === 'pick'}
			{#if hungry}
				<div class="card center">
					<div class="small-cat">
						<CatView cat={saved.cat} t={clock.t} focus="face" scenery={false} />
					</div>
					<p class="big">{name} is too hungry to train! 🐟</p>
					<a class="go" href="/cat?id={saved.id}">Feed {name} first</a>
				</div>
			{:else}
				<div class="traits">
					{#each TRAITS as t (t)}
						{@const tp = saved.progress.traits[t]}
						<button class="trait card" onclick={() => choose(t)}>
							<span class="icon">{TRAIT_INFO[t].icon}</span>
							<span class="label">{TRAIT_INFO[t].label}</span>
							<span class="game-name">{TRAIT_INFO[t].game}</span>
							<span class="lvl">Level {tp.level}{tp.level >= MAX_LEVEL ? ' ⭐ MAX' : ''}</span>
							<span class="bar">
								<span
									class="fill"
									style="width: {tp.level >= MAX_LEVEL ? 100 : (tp.xp / xpToNext(tp.level)) * 100}%"
								></span>
							</span>
						</button>
					{/each}
				</div>
			{/if}
		{:else if phase === 'intro' && trait}
			<div class="card center">
				<p class="big">{TRAIT_INFO[trait].icon} {TRAIT_INFO[trait].game}</p>
				<p class="how">{HOW_TO[trait]}</p>
				<button class="go" onclick={start}>Ready? Go!</button>
				<button class="link" onclick={() => (phase = 'pick')}>Pick a different one</button>
			</div>
		{:else if phase === 'countdown'}
			<div class="card center"><p class="countdown">{countdown}</p></div>
		{:else if phase === 'play' && trait}
			{@const Game = GAMES[trait]}
			<div class="card playing"><Game cat={saved.cat} onDone={finish} /></div>
		{:else if phase === 'result' && trait && result}
			<div class="card center">
				<div class="small-cat">
					<CatView cat={saved.cat} t={clock.t} focus="face" scenery={false} action="celebrating" />
				</div>
				{#if result.levelsGained}
					<p class="big levelup">LEVEL UP! 🎉</p>
					<p class="how">
						{name}'s {TRAIT_INFO[trait].label} is now level {saved.progress.traits[trait].level}!
					</p>
				{:else}
					<p class="big">Great training! ⭐</p>
				{/if}
				<p class="how">+{result.xp} {TRAIT_INFO[trait].label} XP</p>
				<div class="buttons">
					<button class="go" onclick={() => (hungry ? (phase = 'pick') : start())}
						>Play again</button
					>
					<button class="go alt" onclick={() => (phase = 'pick')}>Train something else</button>
				</div>
			</div>
		{/if}
	{:else}
		<p class="center">Finding your cat…</p>
	{/if}
</main>

<style>
	main {
		max-width: 900px;
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
		font-size: clamp(1.8rem, 5vw, 2.6rem);
		margin: 16px 0 0;
	}
	.center {
		text-align: center;
	}
	.level {
		font-size: 1.3rem;
		font-weight: 700;
		margin: 4px 0 16px;
	}
	.card {
		background: var(--card);
		border-radius: 28px;
		box-shadow: 0 6px 24px #e9b6d455;
		padding: 16px;
	}
	.playing {
		max-width: 620px;
		margin: 0 auto;
	}
	.traits {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
		gap: 14px;
	}
	.trait {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		border: 4px solid #f1e4f5;
		cursor: pointer;
		font: inherit;
		transition: transform 0.12s;
	}
	.trait:hover {
		transform: scale(1.03);
	}
	.icon {
		font-size: 3rem;
	}
	.label {
		font-size: 1.5rem;
		font-weight: 700;
	}
	.game-name {
		opacity: 0.75;
	}
	.lvl {
		font-weight: 700;
	}
	.bar {
		width: 100%;
		height: 14px;
		border-radius: 999px;
		background: #f3e8f6;
		overflow: hidden;
	}
	.fill {
		display: block;
		height: 100%;
		background: #9775fa;
		border-radius: 999px;
	}
	.big {
		font-size: 2rem;
		font-weight: 700;
		margin: 8px 0;
	}
	.levelup {
		background: var(--rainbow);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		font-size: 2.6rem;
	}
	.how {
		font-size: 1.3rem;
	}
	.countdown {
		font-size: 7rem;
		font-weight: 700;
		margin: 20px 0;
	}
	.small-cat {
		width: 180px;
		aspect-ratio: 1;
		margin: 0 auto;
	}
	.buttons {
		display: flex;
		gap: 12px;
		justify-content: center;
		flex-wrap: wrap;
	}
	.go {
		display: inline-block;
		font-size: 1.5rem;
		font-weight: 700;
		padding: 12px 28px;
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
	.link {
		display: block;
		margin: 12px auto 0;
		background: none;
		border: none;
		font-size: 1.1rem;
		text-decoration: underline;
		cursor: pointer;
	}
</style>
