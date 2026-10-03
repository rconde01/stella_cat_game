<script lang="ts">
	import { onMount } from 'svelte';
	import CatView from '#lib/cat/CatView.svelte';
	import { useClock } from '#lib/cat/clock.svelte.ts';
	import {
		COAT_COLORS,
		DEFAULT_CAT,
		DISPOSITION_OPTIONS,
		EYE_COLORS,
		HIGHLIGHT_COLORS,
		PATTERN_OPTIONS,
		POSE_OPTIONS,
		SHAPE_OPTIONS,
		randomCat,
		randomName,
		type Option
	} from '#lib/cat/options.ts';
	import { localCatStore } from '#lib/cat/storage.ts';
	import { RAINBOW, type Cat } from '#lib/cat/types.ts';

	const TABS = [
		{ id: 'name', label: 'Name', icon: '✏️' },
		{ id: 'shape', label: 'Shape', icon: '🐱' },
		{ id: 'pose', label: 'Pose', icon: '🤸' },
		{ id: 'pattern', label: 'Pattern', icon: '🐾' },
		{ id: 'colors', label: 'Colors', icon: '🌈' },
		{ id: 'eyes', label: 'Eyes', icon: '👀' },
		{ id: 'mood', label: 'Mood', icon: '😊' }
	] as const;

	type TabId = (typeof TABS)[number]['id'];

	let cat = $state<Cat>({ ...DEFAULT_CAT });
	let tab = $state<TabId>('shape');
	let loaded = $state(false);

	const clock = useClock();

	onMount(() => {
		const saved = localCatStore.load();
		if (saved) cat = saved;
		loaded = true;
	});

	$effect(() => {
		const snapshot = $state.snapshot(cat);
		if (loaded) localCatStore.save(snapshot);
	});

	function surprise() {
		cat = randomCat(cat.name);
	}

	function swatchStyle(color: string): string {
		return color === RAINBOW ? 'background: var(--rainbow)' : `background: ${color}`;
	}
</script>

<svelte:head>
	<title>Design your cat · Rainbow Smiles Funtime Place</title>
</svelte:head>

{#snippet catChoices<T extends string>(
	options: Option<T>[],
	selected: T,
	choose: (id: T) => void,
	preview: (id: T) => Cat,
	focus: 'cat' | 'face' = 'cat'
)}
	<div class="choices">
		{#each options as option (option.id)}
			<button
				class="choice"
				class:selected={option.id === selected}
				aria-pressed={option.id === selected}
				onclick={() => choose(option.id)}
			>
				<span class="thumb"><CatView cat={preview(option.id)} t={0.5} {focus} /></span>
				<span class="label">{option.label}</span>
			</button>
		{/each}
	</div>
{/snippet}

{#snippet swatches(options: Option<string>[], selected: string, choose: (id: string) => void)}
	<div class="swatches">
		{#each options as option (option.id)}
			<button
				class="swatch"
				class:selected={option.id === selected}
				aria-pressed={option.id === selected}
				style={swatchStyle(option.id)}
				title={option.label}
				aria-label={option.label}
				onclick={() => choose(option.id)}
			></button>
		{/each}
	</div>
{/snippet}

<main>
	<header>
		<a class="home" href="/" aria-label="Home">🏠</a>
		<h1>Design your cat!</h1>
	</header>

	<div class="designer">
		<section class="stage">
			<div class="name-banner">{cat.name || 'My cat'}</div>
			<div class="cat"><CatView {cat} t={clock.t} /></div>
			<button class="surprise" onclick={surprise}>🎲 Surprise me!</button>
		</section>

		<section class="panel">
			<div class="tabs" role="tablist">
				{#each TABS as t (t.id)}
					<button
						role="tab"
						class="tab"
						class:active={tab === t.id}
						aria-selected={tab === t.id}
						onclick={() => (tab = t.id)}
					>
						<span class="icon">{t.icon}</span>
						<span>{t.label}</span>
					</button>
				{/each}
			</div>

			<div class="options" role="tabpanel">
				{#if tab === 'name'}
					<h2>What's your cat's name?</h2>
					<div class="name-row">
						<input
							type="text"
							maxlength="20"
							bind:value={cat.name}
							placeholder="Type a name"
							aria-label="Cat name"
						/>
						<button class="dice" onclick={() => (cat.name = randomName(cat.name))}>
							🎲 Pick one for me
						</button>
					</div>
				{:else if tab === 'shape'}
					<h2>Pick a shape</h2>
					{@render catChoices(
						SHAPE_OPTIONS,
						cat.shape,
						(id) => (cat.shape = id),
						(id) => ({ ...cat, shape: id })
					)}
				{:else if tab === 'pose'}
					<h2>Pick a pose</h2>
					{@render catChoices(
						POSE_OPTIONS,
						cat.pose,
						(id) => (cat.pose = id),
						(id) => ({ ...cat, pose: id })
					)}
				{:else if tab === 'pattern'}
					<h2>Pick a pattern</h2>
					{@render catChoices(
						PATTERN_OPTIONS,
						cat.pattern,
						(id) => (cat.pattern = id),
						(id) => ({ ...cat, pattern: id })
					)}
				{:else if tab === 'colors'}
					<h2>Fur color</h2>
					{@render swatches(COAT_COLORS, cat.color, (id) => (cat.color = id))}
					<h2>Highlight color</h2>
					{@render swatches(HIGHLIGHT_COLORS, cat.highlight, (id) => (cat.highlight = id))}
					{#if cat.pattern === 'plain'}
						<p class="hint">Tip: pick a pattern to see the highlight color!</p>
					{/if}
				{:else if tab === 'eyes'}
					<h2>Eye color</h2>
					{@render swatches(EYE_COLORS, cat.eyeColor, (id) => (cat.eyeColor = id))}
				{:else if tab === 'mood'}
					<h2>How is your cat feeling?</h2>
					{@render catChoices(
						DISPOSITION_OPTIONS,
						cat.disposition,
						(id) => (cat.disposition = id),
						(id) => ({ ...cat, disposition: id }),
						'face'
					)}
				{/if}
			</div>
		</section>
	</div>
</main>

<style>
	main {
		max-width: 1200px;
		margin: 0 auto;
		padding: 12px 16px 32px;
	}
	header {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.home {
		font-size: 2rem;
		text-decoration: none;
	}
	h1 {
		margin: 0;
		font-size: clamp(1.6rem, 4vw, 2.4rem);
		background: var(--rainbow);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
	}
	.designer {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
		gap: 20px;
		margin-top: 12px;
	}
	@media (max-width: 800px) {
		.designer {
			grid-template-columns: 1fr;
		}
	}
	.stage,
	.panel {
		background: var(--card);
		border-radius: 28px;
		box-shadow: 0 6px 24px #e9b6d455;
		padding: 16px;
	}
	.stage {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
	}
	.name-banner {
		font-size: clamp(1.6rem, 5vw, 2.6rem);
		font-weight: 700;
		padding: 4px 28px;
		border-radius: 999px;
		background: #fff;
		border: 4px solid #ffd1e6;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.cat {
		width: 100%;
		max-width: 480px;
		aspect-ratio: 1;
	}
	.surprise,
	.dice {
		font-size: 1.3rem;
		font-weight: 600;
		padding: 12px 24px;
		border: none;
		border-radius: 999px;
		background: var(--accent);
		color: white;
		cursor: pointer;
		box-shadow: 0 4px 0 var(--accent-dark);
	}
	.surprise:active,
	.dice:active {
		transform: translateY(3px);
		box-shadow: 0 1px 0 var(--accent-dark);
	}
	.tabs {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(68px, 1fr));
		gap: 8px;
	}
	.tab {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		padding: 8px 4px;
		font-size: 1rem;
		font-weight: 600;
		border: 3px solid transparent;
		border-radius: 18px;
		background: #f6eefa;
		cursor: pointer;
	}
	.tab .icon {
		font-size: 1.7rem;
	}
	.tab.active {
		background: #fff;
		border-color: var(--accent);
	}
	.options {
		margin-top: 12px;
	}
	h2 {
		margin: 8px 0;
		font-size: 1.4rem;
	}
	.choices {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
		gap: 12px;
	}
	.choice {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 8px;
		border: 4px solid #f1e4f5;
		border-radius: 20px;
		background: #fff;
		cursor: pointer;
		transition: transform 0.1s;
	}
	.choice:hover {
		transform: scale(1.04);
	}
	.choice.selected {
		border-color: var(--accent);
		background: #fff0f7;
	}
	.thumb {
		width: 100%;
		aspect-ratio: 1;
	}
	.label {
		font-size: 1.1rem;
		font-weight: 600;
	}
	.swatches {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
	}
	.swatch {
		width: 56px;
		height: 56px;
		border-radius: 50%;
		border: 4px solid #fff;
		box-shadow: 0 0 0 2px #e6d6ec;
		cursor: pointer;
		transition: transform 0.1s;
	}
	.swatch:hover {
		transform: scale(1.1);
	}
	.swatch.selected {
		box-shadow: 0 0 0 4px var(--accent);
		transform: scale(1.12);
	}
	.name-row {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
	}
	input {
		flex: 1 1 200px;
		font: inherit;
		font-size: 1.6rem;
		padding: 10px 16px;
		border: 4px solid #f1e4f5;
		border-radius: 18px;
		outline: none;
	}
	input:focus {
		border-color: var(--accent);
	}
	.hint {
		font-size: 1.1rem;
		opacity: 0.8;
	}
</style>
