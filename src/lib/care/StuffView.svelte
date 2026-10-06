<!--
	One of the player's favorite things, maybe with a mess on it. Drawn in a 100×100 box.
-->
<script lang="ts">
	import { OUTLINE } from '../cat/style';
	import type { MessKind, Stuff } from './care';

	interface Props {
		item: Stuff;
		mess: MessKind | null;
		t: number;
	}

	let { item, mess, t }: Props = $props();

	const ln = { stroke: OUTLINE, 'stroke-width': 2.5, 'stroke-linejoin': 'round' } as const;
	const stink = (i: number) => {
		const p = (t * 0.5 + i / 3) % 1;
		return { y: 40 - p * 30, opacity: Math.sin(p * Math.PI) * 0.8, dx: 30 + i * 20 };
	};
</script>

<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
	{#if item === 'teddy'}
		<ellipse cx="50" cy="72" rx="26" ry="22" fill="#c98b5a" {...ln} />
		<circle cx="30" cy="20" r="9" fill="#c98b5a" {...ln} />
		<circle cx="70" cy="20" r="9" fill="#c98b5a" {...ln} />
		<circle cx="50" cy="36" r="22" fill="#c98b5a" {...ln} />
		<ellipse cx="50" cy="44" rx="10" ry="7" fill="#f2d3b3" {...ln} />
		<circle cx="42" cy="32" r="2.6" fill={OUTLINE} />
		<circle cx="58" cy="32" r="2.6" fill={OUTLINE} />
		<ellipse cx="50" cy="41" rx="3" ry="2" fill={OUTLINE} />
		<path d="M 38 56 L 50 62 L 62 56 L 62 66 L 50 61 L 38 66 Z" fill="#ff7fb0" {...ln} />
		<ellipse cx="50" cy="78" rx="12" ry="10" fill="#f2d3b3" />
	{:else if item === 'slippers'}
		{#each [28, 66] as x, i (i)}
			<g transform="translate({x} {i ? 58 : 66}) rotate({i ? 8 : -8})">
				<path d="M -18 10 Q -20 -22 0 -24 Q 20 -22 18 10 Q 0 18 -18 10 Z" fill="#ffb3d1" {...ln} />
				<path d="M -14 0 Q 0 -10 14 0 Q 14 12 0 14 Q -14 12 -14 0 Z" fill="#ffd9e8" />
				<circle cx="0" cy="-16" r="7" fill="white" {...ln} />
			</g>
		{/each}
	{:else if item === 'backpack'}
		<path d="M 36 22 Q 50 6 64 22" fill="none" {...ln} stroke-width="5" />
		<rect x="22" y="20" width="56" height="70" rx="16" fill="#9b7bff" {...ln} />
		<rect x="30" y="56" width="40" height="26" rx="8" fill="#b9a2ff" {...ln} />
		<path d="M 30 66 L 70 66" stroke={OUTLINE} stroke-width="2" />
		<circle cx="50" cy="40" r="7" fill="#ffd43b" {...ln} />
	{:else}
		<path
			d="M 12 40 Q 10 24 26 24 L 74 24 Q 90 24 88 40 L 88 72 Q 90 88 74 86 L 26 86 Q 10 88 12 72 Z"
			fill="#a5d8ff"
			{...ln}
		/>
		<path
			d="M 50 40 L 54 50 L 65 51 L 57 58 L 59 69 L 50 63 L 41 69 L 43 58 L 35 51 L 46 50 Z"
			fill="#fff3a8"
			{...ln}
			stroke-width="2"
		/>
	{/if}

	{#if mess === 'poop'}
		<g transform="translate(50 54)">
			<ellipse cx="0" cy="18" rx="26" ry="10" fill="#8a5a3c" {...ln} />
			<ellipse cx="0" cy="8" rx="19" ry="9" fill="#9c6a48" {...ln} />
			<ellipse cx="0" cy="-1" rx="12" ry="7" fill="#ae7b55" {...ln} />
			<path d="M -4 -6 Q 2 -16 6 -10 Q 4 -6 -4 -6 Z" fill="#ae7b55" {...ln} />
			<!-- silly face -->
			<circle cx="-7" cy="8" r="2.2" fill={OUTLINE} />
			<circle cx="7" cy="8" r="2.2" fill={OUTLINE} />
			<path d="M -5 14 Q 0 18 5 14" fill="none" stroke={OUTLINE} stroke-width="2" />
		</g>
	{:else if mess === 'pee'}
		<ellipse cx="50" cy="88" rx="42" ry="10" fill="#ffe14d" fill-opacity="0.85" {...ln} />
		<ellipse cx="38" cy="85" rx="10" ry="3" fill="white" opacity="0.7" />
		<path d="M 46 60 Q 44 70 47 74 Q 50 70 46 60 Z" fill="#ffe14d" {...ln} stroke-width="1.5" />
	{/if}
	{#if mess}
		{#each [0, 1, 2] as i (i)}
			{@const s = stink(i)}
			<path
				d="M {s.dx} {s.y + 12} q -5 -4 0 -8 q 5 -4 0 -8"
				fill="none"
				stroke="#8fcf6b"
				stroke-width="3"
				stroke-linecap="round"
				opacity={s.opacity}
			/>
		{/each}
	{/if}
</svg>

<style>
	svg {
		display: block;
		width: 100%;
		height: 100%;
	}
</style>
