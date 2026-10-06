<script lang="ts">
	import { onMount } from 'svelte';
	import CatView from '#lib/cat/CatView.svelte';
	import { useClock } from '#lib/cat/clock.svelte.ts';
	import { DEFAULT_CAT } from '#lib/cat/options.ts';
	import { catStoreFor, moveGuestCatsToAccount, type SavedCat } from '#lib/cat/store.ts';
	import { advanceCare, needs, type Need } from '#lib/care/care.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let cats = $state<SavedCat[] | null>(null);
	let message = $state('');
	const clock = useClock();
	const now = Date.now();

	const NEED_ICONS: Record<Need, string> = { food: '🐟', play: '🪶', brush: '🪮' };

	onMount(async () => {
		try {
			if (data.user) {
				const moved = await moveGuestCatsToAccount();
				if (moved) {
					message = `We moved ${moved} ${moved === 1 ? 'cat' : 'cats'} into your account!`;
				}
			}
			cats = await catStoreFor(data.user).list();
		} catch (err) {
			console.error(err);
			message = "Oh no, we couldn't find your cats right now. Try again in a bit!";
			cats = [];
		}
	});
</script>

<svelte:head>
	<title>Rainbow Smiles Funtime Place</title>
</svelte:head>

<main>
	<h1>Rainbow Smiles<br />Funtime Place</h1>

	{#if message}
		<p class="message">{message}</p>
	{/if}

	{#if cats === null}
		<p class="loading">Finding your cats…</p>
	{:else if cats.length === 0}
		<div class="hero"><CatView cat={DEFAULT_CAT} t={clock.t} /></div>
		<a class="play" href="/design">✨ Design your first cat</a>
	{:else}
		<h2>My cats</h2>
		<div class="cats">
			{#each cats as saved (saved.id)}
				{@const care = advanceCare(saved.care, now).care}
				<a class="card" href="/cat?id={saved.id}">
					<span class="pic"><CatView cat={saved.cat} t={clock.t} /></span>
					<span class="name">{saved.cat.name || 'My cat'}</span>
					<span class="badges">
						{#each needs(care) as need (need)}
							<span title="Needs {need}">{NEED_ICONS[need]}</span>
						{/each}
						{#each care.messes as mess (mess.item)}
							<span title="Made a mess">{mess.kind === 'poop' ? '💩' : '💦'}</span>
						{/each}
						{#if !needs(care).length && !care.messes.length}<span title="Happy">💕</span>{/if}
					</span>
				</a>
			{/each}
			<a class="card new" href="/design">
				<span class="plus">+</span>
				<span class="name">New cat</span>
			</a>
		</div>
	{/if}

	{#if data.accountsEnabled && !data.user && cats?.length}
		<p class="nudge">
			Your cats are saved on this device. <a href="/login">Make an account</a> to keep them safe and play
			on any computer!
		</p>
	{/if}
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: 8px 16px 40px;
		max-width: 1100px;
		margin: 0 auto;
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
	h2 {
		font-size: 2rem;
		margin: 20px 0 12px;
	}
	.message {
		font-size: 1.3rem;
		font-weight: 600;
		background: #fff;
		padding: 10px 20px;
		border-radius: 999px;
	}
	.loading {
		font-size: 1.4rem;
	}
	.hero {
		width: min(80vw, 420px);
		aspect-ratio: 1;
		border-radius: 28px;
		overflow: hidden;
		margin: 16px 0;
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
	.cats {
		width: 100%;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 16px;
	}
	.card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		padding: 10px;
		border-radius: 24px;
		background: var(--card);
		box-shadow: 0 6px 24px #e9b6d455;
		text-decoration: none;
		color: inherit;
		transition: transform 0.12s;
	}
	.card:hover {
		transform: scale(1.03) rotate(-1deg);
	}
	.pic {
		width: 100%;
		aspect-ratio: 1;
		border-radius: 18px;
		overflow: hidden;
	}
	.name {
		font-size: 1.4rem;
		font-weight: 700;
	}
	.badges {
		display: flex;
		gap: 4px;
		font-size: 1.4rem;
		min-height: 1.8rem;
	}
	.new {
		justify-content: center;
		border: 4px dashed #ffc2dc;
		background: #fff8fb;
	}
	.plus {
		font-size: 5rem;
		line-height: 1;
		color: var(--accent);
	}
	.nudge {
		margin-top: 24px;
		font-size: 1.15rem;
		max-width: 520px;
	}
</style>
