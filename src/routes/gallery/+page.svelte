<!--
	Every shape x pose, plus every mood and pattern, side by side. Handy for checking the art.
-->
<script lang="ts">
	import CatView from '#lib/cat/CatView.svelte';
	import { DEFAULT_CAT } from '#lib/cat/options.ts';
	import {
		ACCESSORIES,
		BACKGROUNDS,
		DISPOSITIONS,
		PATTERNS,
		POSES,
		SHAPES,
		type Cat
	} from '#lib/cat/types.ts';

	const cat = (overrides: Partial<Cat>): Cat => ({
		...DEFAULT_CAT,
		background: 'none',
		...overrides
	});
</script>

<svelte:head>
	<title>Cat gallery</title>
</svelte:head>

<main>
	<h1>Cat gallery</h1>
	<h2>Accessories</h2>
	<div class="grid">
		{#each ACCESSORIES as accessory (accessory)}
			{#each ['sitting', 'stretching'] as const as pose (pose)}
				<figure>
					<CatView cat={cat({ accessories: [accessory], pose })} t={0.5} />
					<figcaption>{accessory} / {pose}</figcaption>
				</figure>
			{/each}
		{/each}
	</div>
	<h2>Backgrounds</h2>
	<div class="grid">
		{#each BACKGROUNDS as background, i (background)}
			<figure>
				<CatView cat={cat({ background, pose: POSES[i % POSES.length] })} t={0.5} />
				<figcaption>{background}</figcaption>
			</figure>
		{/each}
	</div>
	<h2>Shapes &times; poses</h2>
	<div class="grid">
		{#each SHAPES as shape (shape)}
			{#each POSES as pose (pose)}
				<figure>
					<CatView cat={cat({ shape, pose })} t={0.5} />
					<figcaption>{shape} / {pose}</figcaption>
				</figure>
			{/each}
		{/each}
	</div>
	<h2>Moods</h2>
	<div class="grid">
		{#each DISPOSITIONS as disposition (disposition)}
			<figure>
				<CatView cat={cat({ disposition })} t={0.5} focus="face" />
				<figcaption>{disposition}</figcaption>
			</figure>
		{/each}
	</div>
	<h2>Patterns</h2>
	<div class="grid">
		{#each PATTERNS as pattern (pattern)}
			{#each POSES as pose (pose)}
				<figure>
					<CatView cat={cat({ pattern, pose, color: '#fbf7f2', highlight: '#4a4453' })} t={0.5} />
					<figcaption>{pattern} / {pose}</figcaption>
				</figure>
			{/each}
		{/each}
		<figure>
			<CatView cat={cat({ pattern: 'stripes', color: '#c8b6ff', highlight: 'rainbow' })} t={0.5} />
			<figcaption>rainbow stripes</figcaption>
		</figure>
	</div>
</main>

<style>
	main {
		padding: 16px;
		font-family: system-ui, sans-serif;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 12px;
	}
	figure {
		margin: 0;
		aspect-ratio: 1;
		background: #fff7fb;
		border-radius: 12px;
		padding-bottom: 20px;
		position: relative;
	}
	figcaption {
		position: absolute;
		bottom: 2px;
		width: 100%;
		text-align: center;
		font-size: 13px;
	}
</style>
