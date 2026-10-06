<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import CatView from '#lib/cat/CatView.svelte';
	import { useClock } from '#lib/cat/clock.svelte.ts';
	import {
		ACCESSORY_OPTIONS,
		BACKGROUND_OPTIONS,
		COAT_COLORS,
		toggleAccessory,
		type AccessorySlot,
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
	import { catStoreFor } from '#lib/cat/store.ts';
	import { RAINBOW, type Cat } from '#lib/cat/types.ts';
	import { goto, replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import type { PageProps } from './$types';

	const TABS = [
		{ id: 'name', label: 'Name', icon: '✏️' },
		{ id: 'shape', label: 'Shape', icon: '🐱' },
		{ id: 'pose', label: 'Pose', icon: '🤸' },
		{ id: 'pattern', label: 'Pattern', icon: '🐾' },
		{ id: 'colors', label: 'Colors', icon: '🌈' },
		{ id: 'eyes', label: 'Eyes', icon: '👀' },
		{ id: 'mood', label: 'Mood', icon: '😊' },
		{ id: 'dress-up', label: 'Dress up', icon: '🎩' },
		{ id: 'place', label: 'Place', icon: '🏡' }
	] as const;

	const ACCESSORY_SLOTS: { id: AccessorySlot; label: string }[] = [
		{ id: 'head', label: 'On the head' },
		{ id: 'eyes', label: 'Eyes' },
		{ id: 'body', label: 'Costume' },
		{ id: 'fur', label: 'In the fur' }
	];

	type TabId = (typeof TABS)[number]['id'];

	let { data }: PageProps = $props();

	let cat = $state<Cat>({ ...DEFAULT_CAT });
	let tab = $state<TabId>('shape');
	/** The saved cat's id; null until a new cat is first saved. */
	let id = $state<string | null>(null);
	let status = $state<'loading' | 'idle' | 'saving' | 'saved' | 'error'>('loading');
	let confirmingDelete = $state(false);

	const clock = useClock();
	const store = $derived(catStoreFor(data.user));

	/** JSON of what's saved, so we only save real changes (and don't create untouched new cats). */
	let lastSaved = '';
	let saveTimer: ReturnType<typeof setTimeout> | undefined;
	let saveChain = Promise.resolve();

	onMount(async () => {
		const wanted = page.url.searchParams.get('id');
		try {
			const found = wanted ? (await store.list()).find((s) => s.id === wanted) : undefined;
			if (found) {
				id = found.id;
				cat = found.cat;
			} else {
				cat = { ...DEFAULT_CAT, name: randomName() };
			}
			lastSaved = JSON.stringify(cat);
			status = 'idle';
		} catch (err) {
			console.error(err);
			status = 'error';
		}
	});

	// Autosave a moment after the last change.
	let pending = '';
	$effect(() => {
		const json = JSON.stringify($state.snapshot(cat));
		if (status === 'loading' || json === lastSaved) return;
		pending = json;
		clearTimeout(saveTimer);
		saveTimer = setTimeout(() => save(json), 600);
	});

	// Leaving the page: save right away instead of waiting.
	onDestroy(() => {
		clearTimeout(saveTimer);
		if (pending && pending !== lastSaved) save(pending);
	});

	function save(json: string) {
		// Saves run one after another so a new cat is only ever created once.
		saveChain = saveChain.then(async () => {
			if (json === lastSaved) return;
			status = 'saving';
			try {
				if (id) {
					await store.update(id, { cat: JSON.parse(json) });
				} else {
					id = (await store.create(JSON.parse(json))).id;
					replaceState(`/design?id=${id}`, {});
				}
				lastSaved = json;
				status = 'saved';
			} catch (err) {
				console.error(err);
				status = 'error';
			}
		});
	}

	async function deleteCat() {
		clearTimeout(saveTimer);
		pending = '';
		await saveChain;
		if (id) await store.remove(id);
		goto('/');
	}

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
	isSelected: (id: T) => boolean,
	choose: (id: T) => void,
	preview: (id: T) => Cat,
	focus: 'full' | 'cat' | 'face' = 'cat'
)}
	<div class="choices">
		{#each options as option (option.id)}
			<button
				class="choice"
				class:selected={isSelected(option.id)}
				aria-pressed={isSelected(option.id)}
				onclick={() => choose(option.id)}
			>
				<span class="thumb">
					<CatView cat={preview(option.id)} t={0.5} {focus} scenery={focus === 'full'} />
				</span>
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
		<a class="home" href="/">🏠 My cats</a>
		<h1>Design your cat!</h1>
		<span class="status" class:error={status === 'error'}>
			{#if status === 'saving'}Saving…{:else if status === 'saved'}✓ Saved{:else if status === 'error'}⚠️
				Couldn't save{/if}
		</span>
	</header>

	<div class="designer">
		<section class="stage">
			<div class="name-banner">{cat.name || 'My cat'}</div>
			<div class="cat"><CatView {cat} t={clock.t} /></div>
			<div class="stage-buttons">
				<button class="surprise" onclick={surprise}>🎲 Surprise me!</button>
				{#if id}
					<a class="done" href="/cat?id={id}">✅ Done — let's play!</a>
					{#if confirmingDelete}
						<span class="confirm">
							Say goodbye to {cat.name || 'this cat'}?
							<button class="yes" onclick={deleteCat}>Yes</button>
							<button class="no" onclick={() => (confirmingDelete = false)}>No</button>
						</span>
					{:else}
						<button class="delete" onclick={() => (confirmingDelete = true)}>🗑️ Delete</button>
					{/if}
				{/if}
			</div>
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
						(id) => id === cat.shape,
						(id) => (cat.shape = id),
						(id) => ({ ...cat, shape: id })
					)}
				{:else if tab === 'pose'}
					<h2>Pick a pose</h2>
					{@render catChoices(
						POSE_OPTIONS,
						(id) => id === cat.pose,
						(id) => (cat.pose = id),
						(id) => ({ ...cat, pose: id })
					)}
				{:else if tab === 'pattern'}
					<h2>Pick a pattern</h2>
					{@render catChoices(
						PATTERN_OPTIONS,
						(id) => id === cat.pattern,
						(id) => (cat.pattern = id),
						(id) => ({ ...cat, pattern: id })
					)}
				{:else if tab === 'dress-up'}
					{#each ACCESSORY_SLOTS as slot (slot.id)}
						<h2>{slot.label}</h2>
						{@render catChoices(
							ACCESSORY_OPTIONS.filter((o) => o.slot === slot.id),
							(id) => cat.accessories.includes(id),
							(id) => (cat.accessories = toggleAccessory(cat.accessories, id)),
							(id) => ({
								...cat,
								accessories: cat.accessories.includes(id)
									? cat.accessories
									: toggleAccessory(cat.accessories, id)
							}),
							slot.id === 'body' ? 'cat' : 'face'
						)}
					{/each}
					<p class="hint">Tap again to take it off.</p>
				{:else if tab === 'place'}
					<h2>Where does your cat live?</h2>
					{@render catChoices(
						BACKGROUND_OPTIONS,
						(id) => id === cat.background,
						(id) => (cat.background = id),
						(id) => ({ ...cat, background: id }),
						'full'
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
						(id) => id === cat.disposition,
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
		font-size: 1.2rem;
		font-weight: 600;
		text-decoration: none;
		color: inherit;
		padding: 6px 14px;
		border-radius: 999px;
		background: #fff;
		box-shadow: 0 2px 8px #e9b6d455;
		white-space: nowrap;
	}
	.status {
		margin-left: auto;
		font-weight: 600;
		opacity: 0.75;
		white-space: nowrap;
	}
	.status.error {
		color: #c2185b;
		opacity: 1;
	}
	.stage-buttons {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 12px;
	}
	.delete,
	.confirm button {
		font-size: 1.05rem;
		font-weight: 600;
		padding: 8px 16px;
		border-radius: 999px;
		border: 3px solid #f1e4f5;
		background: #fff;
		cursor: pointer;
	}
	.confirm {
		display: flex;
		align-items: center;
		gap: 8px;
		font-weight: 600;
	}
	.confirm .yes {
		border-color: #ff8fa8;
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
		border-radius: 24px;
		overflow: hidden;
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
	.done {
		font-size: 1.3rem;
		font-weight: 600;
		padding: 12px 24px;
		border-radius: 999px;
		background: #5fcf80;
		color: white;
		text-decoration: none;
		box-shadow: 0 4px 0 #3ea862;
	}
	.surprise:active,
	.dice:active {
		transform: translateY(3px);
		box-shadow: 0 1px 0 var(--accent-dark);
	}
	.tabs {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(58px, 1fr));
		gap: 6px;
	}
	.tab {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		padding: 8px 2px;
		font-size: 0.9rem;
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
