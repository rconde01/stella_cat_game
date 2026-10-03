<!--
	Draws a cat as SVG from its data. Pass a changing `t` (seconds) to animate it.
-->
<script lang="ts">
	import { animate } from './animation';
	import { RAINBOW_STOPS, shade } from './color';
	import { blobTransform, layoutCat, limbPath, tailPath, UNIT_PATHS } from './geometry';
	import Head from './parts/Head.svelte';
	import Limb from './parts/Limb.svelte';
	import Part from './parts/Part.svelte';
	import { limbDash, patternPath } from './patterns';
	import { RAINBOW, type Cat } from './types';

	interface Props {
		cat: Cat;
		/** Animation time in seconds. */
		t?: number;
		/** 'cat' crops to the cat (option buttons); 'face' zooms in on the head (mood buttons). */
		focus?: 'full' | 'cat' | 'face';
	}

	let { cat, t = 0, focus = 'full' }: Props = $props();

	const uid = $props.id();

	const layout = $derived(layoutCat(cat));
	const anim = $derived(animate(cat.disposition, t));

	const rainbow = $derived(cat.highlight === RAINBOW);
	const markingFill = $derived(rainbow ? `url(#${uid}-rainbow)` : cat.highlight);
	const limbMarkingFill = $derived(rainbow ? `url(#${uid}-rainbow-world)` : cat.highlight);
	const irisFill = $derived(`url(#${uid}-iris)`);
	const filter = $derived(cat.shape === 'fluffy' ? `url(#${uid}-fluff)` : undefined);

	const viewBox = $derived.by(() => {
		if (focus === 'full') return '0 0 400 400';
		if (focus === 'cat') return '15 50 370 340';
		const { x, y, s } = layout.head;
		return `${x - 1.5 * s} ${y - 1.6 * s} ${3 * s} ${3 * s}`;
	});

	const legDash = $derived(limbDash(cat.pattern, 'leg'));
	const tailDash = $derived(limbDash(cat.pattern, 'tail'));
	const ground = $derived(layout.ground);
</script>

<svg
	{viewBox}
	class:clip={focus !== 'full'}
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
			<stop offset="0" stop-color={shade(cat.eyeColor, -0.55)} />
			<stop offset="0.55" stop-color={cat.eyeColor} />
			<stop offset="1" stop-color={shade(cat.eyeColor, 0.5)} />
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

	<ellipse
		cx={layout.shadow.cx}
		cy={ground}
		rx={layout.shadow.rx}
		ry="10"
		fill="black"
		opacity="0.12"
	/>

	<g transform="translate(0 {ground}) scale(1 {anim.breath}) translate(0 {-ground})">
		<g {filter}>
			<Limb
				d={tailPath(layout.tail, anim.tailSwing)}
				width={layout.tail.width}
				fill={cat.color}
				dash={tailDash}
				markingFill={limbMarkingFill}
			/>
			{#each layout.backLegs as leg, i (i)}
				<Limb
					d={limbPath(leg)}
					width={leg.width}
					fill={shade(cat.color, -0.08)}
					dash={legDash}
					markingFill={limbMarkingFill}
				/>
			{/each}
			<Part
				id="{uid}-body"
				d={UNIT_PATHS[layout.body.path]}
				transform={blobTransform(layout.body)}
				fill={cat.color}
				markings={patternPath(cat.pattern, layout.body.path)}
				{markingFill}
			/>
			{#each layout.haunches as haunch, i (i)}
				<Part
					id="{uid}-haunch-{i}"
					d={UNIT_PATHS[haunch.path]}
					transform={blobTransform(haunch)}
					fill={cat.color}
					markings={patternPath(cat.pattern, haunch.path)}
					{markingFill}
				/>
			{/each}
			{#each layout.frontLegs as leg, i (i)}
				<Limb
					d={limbPath(leg)}
					width={leg.width}
					fill={cat.color}
					dash={legDash}
					markingFill={limbMarkingFill}
				/>
			{/each}
		</g>

		<Head
			{uid}
			head={layout.head}
			{anim}
			coatFill={cat.color}
			{markingFill}
			pattern={cat.pattern}
			disposition={cat.disposition}
			{irisFill}
			{filter}
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
