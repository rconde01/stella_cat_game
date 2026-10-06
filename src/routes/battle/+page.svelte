<!--
	Battle: your cat vs a random cat from the game. Three rounds, best of three.
	Winners dance, backflip and get a gold medal; losers have a (cartoon) cry.
-->
<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import * as sfx from '#lib/audio/engine.ts';
	import type { CatAction } from '#lib/cat/animation.ts';
	import CatView from '#lib/cat/CatView.svelte';
	import { useClock } from '#lib/cat/clock.svelte.ts';
	import { catStoreFor, type SavedCat } from '#lib/cat/store.ts';
	import { requestBattle, type BattleOutcome } from '#lib/game/client.ts';
	import { catLevel, TRAIT_INFO, type Progress } from '#lib/game/progress.ts';
	import { page } from '$app/state';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const clock = useClock();
	const store = $derived(catStoreFor(data.user));

	let saved = $state<SavedCat | null>(null);
	let notFound = $state(false);
	let phase = $state<'ready' | 'searching' | 'fighting' | 'done'>('ready');
	let outcome = $state<BattleOutcome | null>(null);
	/** How many rounds have been shown so far. */
	let shown = $state(0);
	/** Who is lunging right now. */
	let lunge = $state<'a' | 'b' | null>(null);
	let caption = $state('');
	let error = $state('');
	let timers: ReturnType<typeof setTimeout>[] = [];

	const wait = (ms: number) => new Promise((r) => timers.push(setTimeout(r, ms)));
	const name = $derived(saved?.cat.name || 'Your cat');

	onMount(async () => {
		const id = page.url.searchParams.get('id');
		saved = (await store.list()).find((s) => s.id === id) ?? null;
		notFound = !saved;
	});
	onDestroy(() => timers.forEach(clearTimeout));

	async function battle() {
		if (!saved) return;
		sfx.pop();
		phase = 'searching';
		outcome = null;
		shown = 0;
		error = '';
		caption = 'Looking for an opponent…';
		try {
			const [result] = await Promise.all([requestBattle(data.user, saved), wait(1200)]);
			outcome = result;
		} catch (err) {
			console.error(err);
			error = "Couldn't find an opponent right now. Try again!";
			phase = 'ready';
			return;
		}
		const theirName = outcome.opponent.cat.name || 'Mystery cat';
		phase = 'fighting';
		caption = `${name} vs ${theirName}!`;
		sfx.meow();
		await wait(1500);

		for (const [i, round] of outcome.result.rounds.entries()) {
			const info = TRAIT_INFO[round.trait];
			caption = `Round ${i + 1}: ${info.icon} ${info.label}!`;
			await wait(1100);
			const winnerName = round.winner === 'a' ? name : theirName;
			caption = `${winnerName} uses ${info.move}!`;
			lunge = round.winner;
			sfx.whoosh();
			await wait(500);
			lunge = null;
			shown = i + 1;
			await wait(900);
		}

		phase = 'done';
		saved = { ...saved, progress: outcome.progress };
		if (outcome.result.winner === 'a') {
			caption = `${name} wins! 🏆`;
			sfx.cheer();
		} else {
			caption = `${theirName} wins this time.`;
			sfx.sadTrombone();
		}
	}

	const won = $derived(phase === 'done' && outcome?.result.winner === 'a');
	const lost = $derived(phase === 'done' && outcome?.result.winner === 'b');
	const myStars = $derived(
		outcome ? outcome.result.rounds.slice(0, shown).filter((r) => r.winner === 'a').length : 0
	);
	const theirStars = $derived(outcome ? shown - myStars : 0);
	const myAction = $derived<CatAction>(won ? 'celebrating' : lost ? 'crying' : null);
	const theirAction = $derived<CatAction>(won ? 'crying' : lost ? 'celebrating' : null);

	function record(p: Progress): string {
		return `🏆 ${p.wins} – ${p.losses}`;
	}
</script>

<svelte:head>
	<title>Battle · {name}</title>
</svelte:head>

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

		<div class="arena">
			<div class="fighter" class:lunge-right={lunge === 'a'} class:hurt={lunge === 'b'}>
				<div class="stars">{'⭐'.repeat(myStars)}</div>
				<div class="cat" class:dance={won}>
					<CatView cat={saved.cat} t={clock.t} scenery={false} action={myAction} medal={won} />
				</div>
				<p class="who">{name}</p>
				<p class="stats">Level {catLevel(saved.progress)}</p>
				<p class="stats">{record(saved.progress)}</p>
			</div>

			<div class="vs">VS</div>

			<div class="fighter" class:lunge-left={lunge === 'b'} class:hurt={lunge === 'a'}>
				{#if outcome && phase !== 'searching'}
					<div class="stars">{'⭐'.repeat(theirStars)}</div>
					<div class="cat mirrored" class:dance={lost}>
						<CatView
							cat={outcome.opponent.cat}
							t={clock.t + 1.7}
							scenery={false}
							action={theirAction}
							medal={lost}
						/>
					</div>
					<p class="who">{outcome.opponent.cat.name || 'Mystery cat'}</p>
					<p class="stats">Level {catLevel(outcome.opponent.progress)}</p>
					<p class="stats">
						{outcome.opponent.wild ? '🌿 Wild cat' : record(outcome.opponent.progress)}
					</p>
				{:else}
					<div class="cat mystery" class:searching={phase === 'searching'}>❓</div>
					<p class="who">???</p>
				{/if}
			</div>
		</div>

		{#if error}<p class="caption error">{error}</p>{/if}

		<div class="buttons">
			{#if phase === 'ready'}
				<button class="go" onclick={battle}>⚔️ Find an opponent!</button>
			{:else if phase === 'done'}
				{#if lost}
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
		max-width: 1000px;
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
		font-size: clamp(1.3rem, 4vw, 1.9rem);
		font-weight: 700;
		min-height: 2.6rem;
	}
	.caption.error {
		color: #c2185b;
		font-size: 1.2rem;
	}
	.arena {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		gap: 8px;
		background: linear-gradient(#e7f5ff, #fff0f6);
		border-radius: 28px;
		padding: 16px;
		box-shadow: 0 6px 24px #e9b6d455;
	}
	.vs {
		font-size: clamp(1.6rem, 6vw, 3rem);
		font-weight: 700;
		color: var(--accent);
	}
	.fighter {
		display: flex;
		flex-direction: column;
		align-items: center;
		transition: transform 0.25s ease-out;
	}
	.lunge-right {
		transform: translateX(25%) scale(1.08);
	}
	.lunge-left {
		transform: translateX(-25%) scale(1.08);
	}
	.hurt {
		animation: shake 0.4s;
	}
	.stars {
		font-size: 1.6rem;
		min-height: 2.2rem;
	}
	.cat {
		width: 100%;
		max-width: 300px;
		aspect-ratio: 1;
	}
	.mirrored {
		transform: scaleX(-1);
	}
	.mystery {
		display: grid;
		place-items: center;
		font-size: 5rem;
		opacity: 0.4;
	}
	.searching {
		animation: spin 1s linear infinite;
	}
	.who {
		margin: 4px 0 0;
		font-size: 1.5rem;
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
	.mirrored.dance {
		animation-name: dance-mirrored;
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
	@keyframes dance-mirrored {
		0%,
		100% {
			transform: scaleX(-1) translateY(0) rotate(0);
		}
		10% {
			transform: scaleX(-1) translateY(-12%) rotate(-8deg);
		}
		20% {
			transform: scaleX(-1) translateY(0) rotate(8deg);
		}
		30% {
			transform: scaleX(-1) translateY(-12%) rotate(-8deg);
		}
		40% {
			transform: scaleX(-1) translateY(0) rotate(0);
		}
		55% {
			transform: scaleX(-1) translateY(-30%) rotate(-180deg);
		}
		70% {
			transform: scaleX(-1) translateY(0) rotate(-360deg);
		}
		85% {
			transform: scaleX(-1) translateY(-30%) rotate(-540deg);
		}
		99.9% {
			transform: scaleX(-1) translateY(0) rotate(-720deg);
		}
	}
	@keyframes shake {
		0%,
		100% {
			translate: 0;
		}
		25% {
			translate: -6px;
		}
		75% {
			translate: 6px;
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
		margin-top: 18px;
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
</style>
