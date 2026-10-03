<!--
	Glasses, heart sunglasses or laser eyes, in head units. Eyes are at (±0.42, 0.02).
-->
<script lang="ts">
	import { OUTLINE } from '../style';
	import type { Accessory } from '../types';

	interface Props {
		accessories: Accessory[];
		t: number;
	}

	let { accessories, t }: Props = $props();

	const has = (a: Accessory) => accessories.includes(a);
	const ln = { 'vector-effect': 'non-scaling-stroke' } as const;
	const HEART = 'M 0 0.3 C -0.52 -0.02 -0.36 -0.4 0 -0.16 C 0.36 -0.4 0.52 -0.02 0 0.3 Z';
	const beam = $derived(1 + 0.25 * Math.sin(t * 22));
</script>

<g stroke={OUTLINE} stroke-linejoin="round" stroke-linecap="round" fill="none">
	{#if has('glasses')}
		{#each [-1, 1] as side (side)}
			<circle
				cx={side * 0.42}
				cy="0.02"
				r="0.3"
				fill="#d6efff"
				fill-opacity="0.25"
				stroke-width="4"
				{...ln}
			/>
			<path
				d="M {side * 0.42 - 0.16} -0.12 L {side * 0.42 - 0.06} -0.2"
				stroke="white"
				stroke-width="3"
				{...ln}
			/>
			<path d="M {side * 0.72} -0.02 L {side * 1.06} -0.12" stroke-width="3.5" {...ln} />
		{/each}
		<path d="M -0.13 0 Q 0 -0.1 0.13 0" stroke-width="3.5" {...ln} />
	{:else if has('heart-sunglasses')}
		{#each [-1, 1] as side (side)}
			<g transform="translate({side * 0.43} 0.04) scale(0.95)">
				<path d={HEART} fill="#ff4f9a" fill-opacity="0.95" stroke-width="3.5" {...ln} />
				<path d="M -0.2 -0.1 Q -0.15 -0.18 -0.07 -0.14" stroke="white" stroke-width="3" {...ln} />
			</g>
			<path d="M {side * 0.78} -0.04 L {side * 1.06} -0.12" stroke-width="3.5" {...ln} />
		{/each}
		<path d="M -0.12 -0.04 Q 0 -0.12 0.12 -0.04" stroke-width="3.5" {...ln} />
	{:else if has('laser-eyes')}
		{#each [-1, 1] as side (side)}
			{@const d = `M ${side * 0.42} 0.02 L ${side * 1.5} 2.7`}
			<g stroke-linecap="round">
				<path {d} stroke="#ff2d55" stroke-opacity="0.3" stroke-width={22 * beam} {...ln} />
				<path {d} stroke="#ff2d55" stroke-width={9 * beam} {...ln} />
				<path {d} stroke="#fff0f3" stroke-width={3 * beam} {...ln} />
			</g>
			<circle
				cx={side * 0.42}
				cy="0.02"
				r={0.2 * beam}
				fill="#ff2d55"
				fill-opacity="0.45"
				stroke="none"
			/>
			<g transform="translate({side * 1.5} 2.7) rotate({t * 200})" fill="#ffe066" stroke="none">
				<path
					d="M 0 -0.25 L 0.06 -0.06 L 0.25 0 L 0.06 0.06 L 0 0.25 L -0.06 0.06 L -0.25 0 L -0.06 -0.06 Z"
					transform="scale({beam})"
				/>
			</g>
		{/each}
	{/if}
</g>
