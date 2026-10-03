<!--
	Hats and other things worn on the head, plus robot head parts. Drawn in head units, on top of the
	face. The top of the head is at y = -0.92; the ears are at x = ±0.6.
-->
<script lang="ts">
	import type { Costume } from '../costume';
	import { ROBOT_DARK, ROBOT_METAL } from '../costume';
	import { accessorySlot } from '../options';
	import { OUTLINE } from '../style';
	import type { Accessory } from '../types';

	interface Props {
		uid: string;
		accessories: Accessory[];
		costume: Costume | null;
		t: number;
	}

	let { uid, accessories, costume, t }: Props = $props();

	const has = (a: Accessory) => accessories.includes(a);
	const ln = { 'vector-effect': 'non-scaling-stroke' } as const;
	const sparkle = $derived(0.6 + 0.4 * Math.sin(t * 3));
</script>

<g stroke={OUTLINE} stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round">
	{#if costume === 'robot'}
		{#if !accessories.some((a) => accessorySlot(a) === 'head')}
			<!-- antenna with a blinking ball, wobbling on its spring (hidden under hats) -->
			{@const tip = { x: 0.08 * Math.sin(t * 3), y: -1.42 }}
			<path d="M 0 -0.9 Q 0.05 -1.15 {tip.x} {tip.y}" fill="none" stroke-width="3" {...ln} />
			<circle
				cx={tip.x}
				cy={tip.y}
				r="0.09"
				fill={Math.sin(t * 5) > 0 ? '#ff5d73' : '#ffb3bf'}
				{...ln}
			/>
		{/if}
		<!-- ear bolts -->
		{#each [-1, 1] as side (side)}
			<g transform="translate({side * 1.07} 0.12)">
				<circle r="0.11" fill={ROBOT_METAL} {...ln} />
				<path
					d="M -0.06 0 L 0.06 0 M 0 -0.06 L 0 0.06"
					stroke={ROBOT_DARK}
					stroke-width="2.5"
					{...ln}
				/>
			</g>
		{/each}
	{/if}

	{#if has('party-hat')}
		<g transform="rotate(-14 0 -0.85)">
			<path d="M -0.34 -0.82 L 0.34 -0.82 L 0 -1.75 Z" fill="#7ad3ff" {...ln} />
			{#each [[-0.12, -1.0], [0.13, -1.15], [-0.04, -1.38], [0.12, -0.9], [-0.18, -0.88]] as [cx, cy], i (i)}
				<circle {cx} {cy} r="0.055" fill="#ffd43b" stroke="none" />
			{/each}
			<circle cx="0" cy="-1.78" r="0.11" fill="#ff7fb0" {...ln} />
		</g>
	{:else if has('top-hat')}
		<g transform="rotate(6 0 -0.85)">
			<path
				d="M -0.38 -0.88 L -0.35 -1.62 Q 0 -1.69 0.35 -1.62 L 0.38 -0.88 Z"
				fill="#2b2533"
				{...ln}
			/>
			<path d="M -0.38 -1.08 L 0.38 -1.08 L 0.38 -0.9 L -0.38 -0.9 Z" fill="#e8467c" {...ln} />
			<ellipse cx="0" cy="-0.86" rx="0.62" ry="0.12" fill="#2b2533" {...ln} />
			<path d="M -0.24 -1.55 L -0.24 -1.2" stroke="white" stroke-width="3" opacity="0.35" {...ln} />
		</g>
	{:else if has('crown')}
		<path
			d="M -0.45 -0.8 L -0.52 -1.3 L -0.25 -1.06 L 0 -1.42 L 0.25 -1.06 L 0.52 -1.3 L 0.45 -0.8 Z"
			fill="#ffd43b"
			{...ln}
		/>
		<path d="M -0.46 -0.92 L 0.46 -0.92" stroke="#e0a800" stroke-width="3" {...ln} />
		{#each [[-0.52, -1.3], [0, -1.42], [0.52, -1.3]] as [cx, cy], i (i)}
			<circle {cx} {cy} r="0.055" fill="#fff3b0" {...ln} />
		{/each}
		<circle cx="0" cy="-1.04" r="0.075" fill="#ff4f6d" {...ln} />
		<circle cx="-0.28" cy="-0.98" r="0.05" fill="#4dabf7" {...ln} />
		<circle cx="0.28" cy="-0.98" r="0.05" fill="#69db7c" {...ln} />
	{:else if has('bow')}
		<g transform="translate(0.48 -0.86) rotate(18) scale(1.1)">
			<path d="M 0 0 C -0.12 0.2 -0.2 0.32 -0.1 0.38 L 0.02 0.08 Z" fill="#ff7fb0" {...ln} />
			<path d="M 0 0 C 0.12 0.2 0.22 0.3 0.16 0.38 L 0.02 0.08 Z" fill="#ff7fb0" {...ln} />
			<path d="M 0 0 C -0.35 -0.32 -0.45 0.22 0 0 Z" fill="#ff9cc4" {...ln} />
			<path d="M 0 0 C 0.35 -0.32 0.45 0.22 0 0 Z" fill="#ff9cc4" {...ln} />
			<circle r="0.08" fill="#ff7fb0" {...ln} />
		</g>
	{:else if has('unicorn-horn')}
		<defs>
			<linearGradient id="{uid}-horn" x1="0" y1="1" x2="0" y2="0">
				<stop offset="0" stop-color="#ffd6f0" />
				<stop offset="0.5" stop-color="#d9c2ff" />
				<stop offset="1" stop-color="#b8f0ff" />
			</linearGradient>
		</defs>
		<path d="M -0.15 -0.84 L 0 -1.8 L 0.15 -0.84 Z" fill="url(#{uid}-horn)" {...ln} />
		{#each [-1.0, -1.2, -1.4, -1.6] as y, i (i)}
			{@const w = 0.15 * ((y + 1.8) / 0.96)}
			<path d="M {-w} {y + 0.04} L {w} {y - 0.06}" stroke-width="2.5" {...ln} />
		{/each}
		<g
			transform="translate(0.28 -1.62) scale({sparkle})"
			fill="#fff6a8"
			stroke="#ffc94d"
			stroke-width="2"
		>
			<path
				d="M 0 -0.12 L 0.03 -0.03 L 0.12 0 L 0.03 0.03 L 0 0.12 L -0.03 0.03 L -0.12 0 L -0.03 -0.03 Z"
				{...ln}
			/>
		</g>
	{/if}
</g>
