<!--
	Draws a cat (and its background) as SVG from its data. Pass a changing `t` (seconds) to animate it.
-->
<script lang="ts">
	import CostumeBody from './accessories/CostumeBody.svelte';
	import Smores, { type SmorePiece } from './accessories/Smores.svelte';
	import { animate, react, type CatAction } from './animation';
	import { RAINBOW_STOPS, shade } from './color';
	import { costumeLimbLayers, costumeOf } from './costume';
	import {
		blobPoint,
		blobTransform,
		layoutCat,
		limbPath,
		tailPath,
		UNIT_PATHS,
		type Blob
	} from './geometry';
	import Head from './parts/Head.svelte';
	import Limb, { type LimbLayer } from './parts/Limb.svelte';
	import Part from './parts/Part.svelte';
	import { limbDash, patternPath } from './patterns';
	import Scenery from './Scenery.svelte';
	import { RAINBOW, type Cat, type Disposition } from './types';

	interface Props {
		cat: Cat;
		/** Animation time in seconds. */
		t?: number;
		/** 'cat' crops to the cat (option buttons); 'face' zooms in on the head (mood buttons). */
		focus?: 'full' | 'cat' | 'face';
		/** Draw the cat's background. */
		scenery?: boolean;
		/** Show this mood instead of the cat's own (e.g. while hissing). */
		expression?: Disposition | null;
		/** Something the cat is doing right now. */
		action?: CatAction;
		/** A point in the 400×400 scene for the cat to look at (e.g. a toy). */
		lookAt?: { x: number; y: number } | null;
		/** A gold medal on the chest (after winning a battle). */
		medal?: boolean;
	}

	let {
		cat,
		t = 0,
		focus = 'full',
		scenery = true,
		expression = null,
		action = null,
		lookAt = null,
		medal = false
	}: Props = $props();

	const uid = $props.id();

	const layout = $derived(layoutCat(cat));
	const mood = $derived(expression ?? cat.disposition);
	const look = $derived.by(() => {
		if (!lookAt) return null;
		const { x, y, s } = layout.head;
		const clamp = (v: number, m: number) => Math.max(-m, Math.min(m, v));
		return { x: clamp((lookAt.x - x) / s / 6, 0.08), y: clamp((lookAt.y - y) / s / 6, 0.07) };
	});
	const anim = $derived(react(animate(mood, t), action, look));
	const costume = $derived(costumeOf(cat.accessories));
	const showScenery = $derived(scenery && cat.background !== 'none');

	const rainbow = $derived(cat.highlight === RAINBOW);
	const markingFill = $derived(rainbow ? `url(#${uid}-rainbow)` : cat.highlight);
	const limbMarkingFill = $derived(rainbow ? `url(#${uid}-rainbow-world)` : cat.highlight);
	const irisColor = $derived(cat.accessories.includes('laser-eyes') ? '#ff2d55' : cat.eyeColor);
	const fluffy = $derived(cat.shape === 'fluffy' ? `url(#${uid}-fluff)` : undefined);

	const viewBox = $derived.by(() => {
		if (focus === 'full') return '0 0 400 400';
		if (focus === 'cat') return '15 50 370 340';
		const { x, y, s } = layout.head;
		return `${x - 1.5 * s} ${y - 1.6 * s} ${3 * s} ${3 * s}`;
	});

	function limbLayers(area: 'leg' | 'tail'): LimbLayer[] {
		const dash = limbDash(cat.pattern, area);
		const pattern: LimbLayer[] = dash ? [{ ...dash, stroke: limbMarkingFill }] : [];
		return [...pattern, ...costumeLimbLayers(costume, area)];
	}
	const legLayers = $derived(limbLayers('leg'));
	const tailLayers = $derived(limbLayers('tail'));

	type SmoreSpot = Omit<SmorePiece, 'x' | 'y'> & { ux: number; uy: number };
	const SMORE_SPOTS: Record<Blob['path'], SmoreSpot[]> = {
		pear: [
			{ ux: -0.5, uy: -0.45, rot: -15, kind: 'graham' },
			{ ux: 0.55, uy: -0.2, rot: 20, kind: 'marshmallow' },
			{ ux: 0.62, uy: 0.5, rot: 30, kind: 'chocolate' }
		],
		loaf: [
			{ ux: -0.45, uy: -0.6, rot: -10, kind: 'marshmallow' },
			{ ux: 0.05, uy: -0.75, rot: 15, kind: 'graham' },
			{ ux: 0.45, uy: -0.35, rot: -20, kind: 'chocolate' },
			{ ux: 0.2, uy: 0.2, rot: 25, kind: 'marshmallow' }
		],
		ellipse: []
	};
	const bodySmores = $derived(
		SMORE_SPOTS[layout.body.path].map(({ ux, uy, rot, kind }) => ({
			...blobPoint(layout.body, ux, uy),
			rot,
			kind
		}))
	);
	const ground = $derived(layout.ground);
</script>

<svg
	{viewBox}
	class:clip={focus !== 'full' || showScenery || cat.accessories.includes('laser-eyes')}
	xmlns="http://www.w3.org/2000/svg"
	role="img"
	aria-label="{cat.name}, a {cat.disposition} cat"
>
	<defs>
		<linearGradient id="{uid}-rainbow" x1="0" y1="0" x2="1" y2="0">
			{#each RAINBOW_STOPS as color, i (i)}
				<stop offset={i / (RAINBOW_STOPS.length - 1)} stop-color={color} />
			{/each}
		</linearGradient>
		<linearGradient
			id="{uid}-rainbow-world"
			gradientUnits="userSpaceOnUse"
			x1="60"
			y1="0"
			x2="340"
			y2="0"
		>
			{#each RAINBOW_STOPS as color, i (i)}
				<stop offset={i / (RAINBOW_STOPS.length - 1)} stop-color={color} />
			{/each}
		</linearGradient>
		<linearGradient id="{uid}-iris" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color={shade(irisColor, -0.55)} />
			<stop offset="0.55" stop-color={irisColor} />
			<stop offset="1" stop-color={shade(irisColor, 0.5)} />
		</linearGradient>
		<linearGradient id="{uid}-steel" x1="0" y1="0" x2="1" y2="1">
			<stop offset="0" stop-color="#f4f7fb" />
			<stop offset="0.5" stop-color="#c3ccd8" />
			<stop offset="1" stop-color="#8d98a8" />
		</linearGradient>
		<linearGradient id="{uid}-metal" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#dbe6f0" />
			<stop offset="1" stop-color="#9fb2c6" />
		</linearGradient>
		<filter id="{uid}-fluff" x="-15%" y="-15%" width="130%" height="130%">
			<feTurbulence
				type="fractalNoise"
				baseFrequency="0.09"
				numOctaves="2"
				seed="4"
				result="noise"
			/>
			<feDisplacementMap
				in="SourceGraphic"
				in2="noise"
				scale="10"
				xChannelSelector="R"
				yChannelSelector="G"
			/>
		</filter>
	</defs>

	{#if showScenery}
		<Scenery {uid} background={cat.background} {t} />
	{/if}

	<ellipse
		cx={layout.shadow.cx}
		cy={ground}
		rx={layout.shadow.rx}
		ry="10"
		fill="black"
		opacity="0.12"
	/>

	<g transform="translate(0 {ground}) scale(1 {anim.breath}) translate(0 {-ground})">
		<!-- Costumes are smooth metal, so they skip the fluffy filter. -->
		<g filter={costume ? undefined : fluffy}>
			<Limb
				d={tailPath(layout.tail, anim.tailSwing)}
				width={layout.tail.width}
				fill={cat.color}
				layers={tailLayers}
			/>
			{#each layout.backLegs as leg, i (i)}
				<Limb
					d={limbPath(leg)}
					width={leg.width}
					fill={shade(cat.color, -0.08)}
					layers={legLayers}
				/>
			{/each}
			{#each [layout.body, ...layout.haunches] as blob, i (i)}
				<Part
					id="{uid}-blob-{i}"
					d={UNIT_PATHS[blob.path]}
					transform={blobTransform(blob)}
					fill={cat.color}
					markings={patternPath(cat.pattern, blob.path)}
					{markingFill}
				>
					{#if costume}
						<CostumeBody {uid} {costume} {blob} t={anim.t} />
					{/if}
				</Part>
			{/each}
			{#each layout.frontLegs as leg, i (i)}
				<Limb d={limbPath(leg)} width={leg.width} fill={cat.color} layers={legLayers} />
			{/each}
		</g>

		{#if cat.accessories.includes('smores')}
			<Smores pieces={bodySmores} size={22} />
		{/if}

		{#if medal}
			{@const m = {
				x: layout.head.x,
				y: layout.head.y + layout.head.s * 1.12,
				r: layout.head.s * 0.2
			}}
			<g stroke="#3b2a40" stroke-width="2.5" stroke-linejoin="round">
				<path
					d="M {m.x - m.r * 1.3} {m.y - m.r * 3} L {m.x - m.r * 0.2} {m.y} L {m.x +
						m.r * 0.4} {m.y - m.r * 0.3} L {m.x - m.r * 0.5} {m.y - m.r * 3} Z"
					fill="#4dabf7"
				/>
				<path
					d="M {m.x + m.r * 1.3} {m.y - m.r * 3} L {m.x + m.r * 0.2} {m.y} L {m.x -
						m.r * 0.4} {m.y - m.r * 0.3} L {m.x + m.r * 0.5} {m.y - m.r * 3} Z"
					fill="#ff6b6b"
				/>
				<circle cx={m.x} cy={m.y + m.r * 0.6} r={m.r} fill="#ffd43b" />
				<circle cx={m.x} cy={m.y + m.r * 0.6} r={m.r * 0.7} fill="#ffe680" stroke-width="1.5" />
				<path
					d="M {m.x} {m.y + m.r * 0.15} l {m.r * 0.13} {m.r * 0.28} l {m.r * 0.3} {m.r *
						0.03} l -{m.r * 0.23} {m.r * 0.2} l {m.r * 0.08} {m.r * 0.3} l -{m.r * 0.28} -{m.r *
						0.16} l -{m.r * 0.28} {m.r * 0.16} l {m.r * 0.08} -{m.r * 0.3} l -{m.r * 0.23} -{m.r *
						0.2} l {m.r * 0.3} -{m.r * 0.03} Z"
					fill="#f08c00"
					stroke-width="1"
				/>
			</g>
		{/if}

		<Head
			{uid}
			head={layout.head}
			{anim}
			coatFill={cat.color}
			{markingFill}
			pattern={cat.pattern}
			disposition={mood}
			{action}
			irisFill="url(#{uid}-iris)"
			accessories={cat.accessories}
			{costume}
			filter={fluffy}
		/>
	</g>
</svg>

<style>
	svg {
		display: block;
		width: 100%;
		height: 100%;
		overflow: visible;
	}
	svg.clip {
		overflow: hidden;
	}
</style>
