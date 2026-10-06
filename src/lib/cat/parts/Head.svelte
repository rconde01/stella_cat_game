<!--
	Ears, head shape (with markings) and face. Head shape is drawn in head units (about -1..1).
-->
<script lang="ts">
	import Eyewear from '../accessories/Eyewear.svelte';
	import HeadGear from '../accessories/HeadGear.svelte';
	import Smores, { type SmorePiece } from '../accessories/Smores.svelte';
	import type { AnimState, CatAction } from '../animation';
	import type { Costume } from '../costume';
	import type { Head } from '../geometry';
	import { patternPath } from '../patterns';
	import { INNER_EAR, OUTLINE } from '../style';
	import type { Accessory, Disposition, Pattern } from '../types';
	import Face from './Face.svelte';
	import Part from './Part.svelte';

	interface Props {
		uid: string;
		head: Head;
		anim: AnimState;
		coatFill: string;
		markingFill: string;
		pattern: Pattern;
		disposition: Disposition;
		irisFill: string;
		accessories: Accessory[];
		costume: Costume | null;
		action?: CatAction;
		filter?: string;
	}

	let {
		uid,
		head,
		anim,
		coatFill,
		markingFill,
		pattern,
		disposition,
		irisFill,
		accessories,
		costume,
		action = null,
		filter
	}: Props = $props();

	const SMORES: SmorePiece[] = [
		{ x: -0.64, y: -0.52, rot: -20, kind: 'marshmallow' },
		{ x: 0.72, y: -0.42, rot: 15, kind: 'chocolate' },
		{ x: -0.78, y: 0.55, rot: 10, kind: 'graham' }
	];

	const HEAD_PATH =
		'M -1.05 -0.05 C -1.05 -0.65 -0.6 -0.92 0 -0.92 C 0.6 -0.92 1.05 -0.65 1.05 -0.05 ' +
		'C 1.05 0.2 1.18 0.3 1.12 0.38 C 0.95 0.75 0.5 0.85 0 0.85 ' +
		'C -0.5 0.85 -0.95 0.75 -1.12 0.38 C -1.18 0.3 -1.05 0.2 -1.05 -0.05 Z';

	// Right ear; the left ear is the same shape mirrored.
	const mid = { x: 0.615, y: -0.59 };
	const ear = $derived.by(() => {
		const tipX = mid.x + 0.2 * head.ear;
		const tipY = mid.y - 0.72 * head.ear;
		return (
			`M 0.25 -0.8 Q 0.42 ${tipY + 0.2} ${tipX} ${tipY} ` +
			`Q ${tipX + 0.2} ${tipY + 0.4} 0.98 -0.38 Z`
		);
	});
	const ears = $derived([
		{ side: 1, deg: anim.earRight, fill: coatFill },
		{ side: -1, deg: anim.earLeft, fill: pattern === 'patches' ? markingFill : coatFill }
	]);
</script>

<g transform="translate({head.x} {head.y}) rotate({head.tilt + anim.headTilt})">
	<g {filter}>
		<g transform="scale({head.s})">
			{#each ears as e (e.side)}
				<g transform="scale({e.side} 1) rotate({e.deg} {mid.x} {mid.y})">
					<path
						d={ear}
						fill={e.fill}
						stroke={OUTLINE}
						stroke-width="4"
						stroke-linejoin="round"
						vector-effect="non-scaling-stroke"
					/>
					<path
						d={ear}
						fill={INNER_EAR}
						transform="translate({mid.x} {mid.y + 0.06}) scale(0.55) translate({-mid.x} {-mid.y})"
					/>
				</g>
			{/each}
			<Part
				id="{uid}-head"
				d={HEAD_PATH}
				transform=""
				fill={coatFill}
				markings={patternPath(pattern, 'head')}
				{markingFill}
			/>
		</g>
	</g>
	<g transform="scale({head.s})">
		<Face {uid} {disposition} {irisFill} {anim} {action} />
		{#if accessories.includes('smores')}
			<Smores pieces={SMORES} size={22 / head.s} />
		{/if}
		<Eyewear {accessories} t={anim.t} />
		<HeadGear {uid} {accessories} {costume} t={anim.t} />
	</g>
</g>
