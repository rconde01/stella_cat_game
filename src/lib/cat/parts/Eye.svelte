<!--
	One big anime eye, drawn in head units as the cat's right eye (viewer's right).
	`side = -1` mirrors it into the left eye; "inner" (toward the nose) is always local -x.
-->
<script lang="ts">
	import { OUTLINE, PUPIL } from '../style';

	interface Props {
		clipId: string;
		x: number;
		y: number;
		side: 1 | -1;
		irisFill: string;
		/** 0 = open, 1 = closed. */
		blink: number;
		lookX: number;
		lookY: number;
		lid: 'none' | 'angry';
		wink?: boolean;
		/** Blissful closed eyes, curved like ^ ^ (purring). */
		happyClosed?: boolean;
	}

	let {
		clipId,
		x,
		y,
		side,
		irisFill,
		blink,
		lookX,
		lookY,
		lid,
		wink = false,
		happyClosed = false
	}: Props = $props();

	const open = $derived(1 - blink);
	// Mirror the look direction so both eyes look the same way on screen.
	const lx = $derived(lookX * side);
	const lidClip = $derived(
		lid === 'angry'
			? 'M -0.5 0.06 L 0.5 -0.26 L 0.5 0.6 L -0.5 0.6 Z'
			: 'M -0.5 -0.6 H 0.5 V 0.6 H -0.5 Z'
	);
</script>

<g
	transform="translate({x} {y}) scale({side} 1)"
	stroke={OUTLINE}
	stroke-linecap="round"
	stroke-linejoin="round"
	fill="none"
>
	{#if happyClosed}
		<path
			d="M -0.24 0.06 Q 0 -0.24 0.24 0.06"
			stroke-width="5"
			vector-effect="non-scaling-stroke"
		/>
	{:else if wink}
		<path
			d="M 0.2 -0.17 L -0.14 0 L 0.2 0.17"
			stroke-width="5"
			vector-effect="non-scaling-stroke"
		/>
	{:else if open < 0.2}
		<path
			d="M -0.24 -0.02 Q 0 0.2 0.25 -0.04"
			stroke-width="5"
			vector-effect="non-scaling-stroke"
		/>
		<path d="M 0.23 -0.03 L 0.33 -0.11" stroke-width="4" vector-effect="non-scaling-stroke" />
	{:else}
		<g transform="scale(1 {open})">
			<clipPath id={clipId}><path d={lidClip} /></clipPath>
			<g clip-path="url(#{clipId})">
				<ellipse
					rx="0.23"
					ry="0.28"
					fill={irisFill}
					stroke-width="2.5"
					vector-effect="non-scaling-stroke"
				/>
				<ellipse cx={lx} cy={0.03 + lookY} rx="0.1" ry="0.17" fill={PUPIL} stroke="none" />
				<circle cx={-0.08 + lx * 0.5} cy={-0.11 + lookY} r="0.085" fill="white" stroke="none" />
				<circle cx={0.09 + lx * 0.5} cy={0.12 + lookY} r="0.04" fill="white" stroke="none" />
				<circle cx={-0.12} cy={0.08} r="0.022" fill="white" stroke="none" opacity="0.8" />
			</g>
			{#if lid === 'angry'}
				<path d="M -0.3 0.03 L 0.33 -0.2" stroke-width="5.5" vector-effect="non-scaling-stroke" />
			{:else}
				<path
					d="M -0.26 -0.06 C -0.18 -0.34 0.16 -0.37 0.28 -0.1"
					stroke-width="5.5"
					vector-effect="non-scaling-stroke"
				/>
				<path d="M 0.26 -0.13 L 0.37 -0.2" stroke-width="4" vector-effect="non-scaling-stroke" />
			{/if}
		</g>
	{/if}
</g>
