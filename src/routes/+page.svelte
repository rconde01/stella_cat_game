<script lang="ts">
	import { onMount } from 'svelte';
	import CatView from '#lib/cat/CatView.svelte';
	import { useClock } from '#lib/cat/clock.svelte.ts';
	import { DEFAULT_CAT } from '#lib/cat/options.ts';
	import { localCatStore } from '#lib/cat/storage.ts';
	import type { Cat } from '#lib/cat/types.ts';

	let cat = $state<Cat>({ ...DEFAULT_CAT });
	let hasSavedCat = $state(false);
	const clock = useClock();

	onMount(() => {
		const saved = localCatStore.load();
		if (saved) {
			cat = saved;
			hasSavedCat = true;
		}
	});
</script>

<svelte:head>
	<title>Rainbow Smiles Funtime Place</title>
</svelte:head>

<main>
	<h1>Rainbow Smiles<br />Funtime Place</h1>
	<div class="cat"><CatView {cat} t={clock.t} /></div>
	{#if hasSavedCat}
		<p class="hello">Hi, {cat.name || 'kitty'}! 👋</p>
	{/if}
	<a class="play" href="/design">{hasSavedCat ? '✨ Change my cat' : '✨ Design your cat'}</a>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: 24px 16px 40px;
	}
	h1 {
		margin: 0;
		font-size: clamp(2.4rem, 8vw, 4.5rem);
		line-height: 1.05;
		background: var(--rainbow);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		filter: drop-shadow(0 3px 0 #fff);
	}
	.cat {
		width: min(80vw, 420px);
		aspect-ratio: 1;
	}
	.hello {
		margin: 0 0 12px;
		font-size: 1.8rem;
		font-weight: 600;
	}
	.play {
		font-size: 1.8rem;
		font-weight: 700;
		text-decoration: none;
		color: white;
		padding: 14px 36px;
		border-radius: 999px;
		background: var(--accent);
		box-shadow: 0 5px 0 var(--accent-dark);
	}
	.play:active {
		transform: translateY(4px);
		box-shadow: 0 1px 0 var(--accent-dark);
	}
</style>
