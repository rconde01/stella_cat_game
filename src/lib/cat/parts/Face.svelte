<!--
	Eyes, nose, mouth, whiskers and mood extras, in head units. The disposition decides the expression.
-->
<script lang="ts">
	import type { AnimState, CatAction } from '../animation';
	import { BLUSH, MOUTH, NOSE, OUTLINE, TONGUE } from '../style';
	import type { Disposition } from '../types';
	import Eye from './Eye.svelte';

	interface Props {
		uid: string;
		disposition: Disposition;
		irisFill: string;
		anim: AnimState;
		/** Something the cat is doing right now; overrides parts of the mood's face. */
		action?: CatAction;
	}

	let { uid, disposition, irisFill, anim, action = null }: Props = $props();

	const t = $derived(anim.t);
	const angry = $derived(disposition === 'grumpy' || action === 'hissing');
	const lid = $derived(angry ? 'angry' : 'none');
	const chomp = $derived(Math.sin(t * 14) > 0);
	const blush = $derived(
		{ happy: 0.45, grumpy: 0, sleepy: 0.3, silly: 0.45, shy: 0.75 }[disposition]
	);

	const zs = $derived(
		[0, 1, 2].map((i) => {
			const p = (t * 0.45 + i / 3) % 1;
			return {
				x: 0.9 + p * 0.4,
				y: -0.75 - p * 0.65,
				size: 0.22 + p * 0.14,
				opacity: Math.sin(p * Math.PI)
			};
		})
	);
	const bubble = $derived(0.06 + 0.12 * (0.5 + 0.5 * Math.sin(t * 1.4)));

	const ln = { 'vector-effect': 'non-scaling-stroke' } as const;
</script>

<g stroke={OUTLINE} stroke-linecap="round" stroke-linejoin="round" fill="none">
	<!-- whiskers -->
	{#each [1, -1] as side (side)}
		<g transform="scale({side} 1)" stroke-width="2" opacity="0.7">
			<path d="M 0.7 0.3 L 1.3 0.2" {...ln} />
			<path d="M 0.72 0.38 L 1.33 0.38" {...ln} />
			<path d="M 0.7 0.46 L 1.28 0.56" {...ln} />
		</g>
	{/each}

	<!-- blush -->
	{#if blush > 0}
		{#each [1, -1] as side (side)}
			<g transform="scale({side} 1)">
				<ellipse
					cx="0.66"
					cy="0.36"
					rx="0.17"
					ry="0.09"
					fill={BLUSH}
					stroke="none"
					opacity={blush}
				/>
				{#if disposition === 'shy'}
					<g stroke={BLUSH} stroke-width="2">
						<path d="M 0.56 0.41 L 0.6 0.31" {...ln} />
						<path d="M 0.65 0.41 L 0.69 0.31" {...ln} />
						<path d="M 0.74 0.41 L 0.78 0.31" {...ln} />
					</g>
				{/if}
			</g>
		{/each}
	{/if}

	<!-- eyes -->
	<Eye
		clipId="{uid}-eye-l"
		x={-0.42}
		y={0.02}
		side={-1}
		{irisFill}
		blink={anim.blinkLeft}
		lookX={anim.lookX}
		lookY={anim.lookY}
		{lid}
		wink={disposition === 'silly' && !action}
		happyClosed={action === 'purring'}
	/>
	<Eye
		clipId="{uid}-eye-r"
		x={0.42}
		y={0.02}
		side={1}
		{irisFill}
		blink={anim.blinkRight}
		lookX={anim.lookX}
		lookY={anim.lookY}
		{lid}
		happyClosed={action === 'purring'}
	/>

	{#if angry}
		<g stroke-width="6">
			<path d="M 0.2 -0.36 L 0.62 -0.5" {...ln} />
			<path d="M -0.2 -0.36 L -0.62 -0.5" {...ln} />
		</g>
	{/if}

	<!-- nose -->
	<path
		d="M -0.065 0.31 Q 0 0.29 0.065 0.31 Q 0.03 0.38 0 0.39 Q -0.03 0.38 -0.065 0.31 Z"
		fill={NOSE}
		stroke-width="2"
		{...ln}
	/>

	<!-- mouth -->
	<g stroke-width="3">
		{#if action === 'eating'}
			{#if chomp}
				<ellipse cx="0" cy="0.55" rx="0.1" ry="0.09" fill={MOUTH} {...ln} />
			{:else}
				<path d="M -0.14 0.47 Q -0.07 0.56 0 0.48 Q 0.07 0.56 0.14 0.47" {...ln} />
			{/if}
		{:else if action === 'hissing'}
			<path
				d="M -0.2 0.47 Q 0 0.42 0.2 0.47 Q 0.16 0.74 0 0.75 Q -0.16 0.74 -0.2 0.47 Z"
				fill="#a8243f"
				{...ln}
			/>
			<path d="M -0.13 0.47 L -0.1 0.57 L -0.07 0.47 Z" fill="white" stroke-width="1.5" {...ln} />
			<path d="M 0.13 0.47 L 0.1 0.57 L 0.07 0.47 Z" fill="white" stroke-width="1.5" {...ln} />
		{:else if action === 'purring'}
			<path d="M -0.2 0.43 Q -0.1 0.57 0 0.45 Q 0.1 0.57 0.2 0.43" {...ln} />
		{:else if disposition === 'happy'}
			<path d="M -0.07 0.49 Q 0 0.66 0.07 0.49 Z" fill={MOUTH} {...ln} />
			<path d="M -0.2 0.43 Q -0.1 0.57 0 0.45 Q 0.1 0.57 0.2 0.43" {...ln} />
		{:else if disposition === 'grumpy'}
			<path d="M -0.18 0.57 Q -0.09 0.45 0 0.51 Q 0.09 0.45 0.18 0.57" {...ln} />
		{:else if disposition === 'sleepy'}
			<ellipse cx="0" cy="0.53" rx="0.05" ry="0.06" fill={MOUTH} {...ln} />
		{:else if disposition === 'silly'}
			<g transform="rotate({10 * Math.sin(t * 5)} 0 0.49)">
				<path d="M -0.08 0.48 L -0.08 0.6 Q 0 0.74 0.08 0.6 L 0.08 0.48" fill={TONGUE} {...ln} />
				<path d="M 0 0.53 L 0 0.62" stroke-width="2" {...ln} />
			</g>
			<path d="M -0.2 0.43 Q -0.1 0.57 0 0.45 Q 0.1 0.57 0.2 0.43" {...ln} />
		{:else}
			<path d="M -0.12 0.52 Q -0.06 0.46 0 0.52 Q 0.06 0.58 0.12 0.52" {...ln} />
		{/if}
	</g>

	<!-- mood extras (an action replaces them, except the anger mark when hissing) -->
	{#if action && action !== 'hissing'}
		<!-- none -->
	{:else if angry}
		<g
			transform="translate(0.62 -0.66) scale({0.9 + 0.12 * Math.sin(t * 6)})"
			stroke="#e5383b"
			stroke-width="4"
		>
			<path d="M -0.05 -0.2 Q -0.05 -0.05 -0.2 -0.05" {...ln} />
			<path d="M 0.05 -0.2 Q 0.05 -0.05 0.2 -0.05" {...ln} />
			<path d="M -0.05 0.2 Q -0.05 0.05 -0.2 0.05" {...ln} />
			<path d="M 0.05 0.2 Q 0.05 0.05 0.2 0.05" {...ln} />
		</g>
	{:else if disposition === 'sleepy'}
		<circle
			cx={0.14 + bubble}
			cy="0.42"
			r={bubble}
			fill="#cdeeff"
			fill-opacity="0.6"
			stroke="#7fbfe8"
			stroke-width="2"
			{...ln}
		/>
		<circle
			cx={0.1 + bubble * 1.3}
			cy={0.42 - bubble * 0.4}
			r={bubble * 0.2}
			fill="white"
			stroke="none"
		/>
		{#each zs as z, i (i)}
			<text
				x={z.x}
				y={z.y}
				font-size={z.size}
				font-weight="700"
				fill="#8a7dff"
				stroke="none"
				opacity={z.opacity}
				font-family="Fredoka, system-ui, sans-serif">z</text
			>
		{/each}
	{:else if disposition === 'shy'}
		<path
			d="M 0.86 -0.42 Q 0.98 -0.22 0.98 -0.16 A 0.12 0.12 0 0 1 0.74 -0.16 Q 0.74 -0.22 0.86 -0.42 Z"
			fill="#a8dcff"
			stroke="#5aa8e0"
			stroke-width="2"
			{...ln}
		/>
	{/if}
</g>
