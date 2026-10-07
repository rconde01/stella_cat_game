<!--
	A filled, outlined shape drawn in unit coordinates, with optional pattern markings and costume
	(`children`) clipped inside it. Anime-style cel shading: a soft shadow band along the bottom and a
	glossy highlight near the top.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { OUTLINE } from '../style';

	interface Props {
		id: string;
		d: string;
		transform: string;
		fill: string;
		markings?: string;
		markingFill?: string;
		/** How strong the shadow band is (0 = none). */
		shading?: number;
		children?: Snippet;
	}

	let {
		id,
		d,
		transform,
		fill,
		markings = '',
		markingFill = 'none',
		shading = 0.14,
		children
	}: Props = $props();
</script>

<g {transform}>
	<clipPath {id}><path {d} /></clipPath>
	<path {d} {fill} />
	{#if markings}
		<path d={markings} fill={markingFill} clip-path="url(#{id})" />
	{/if}
	{#if shading > 0}
		<g clip-path="url(#{id})">
			<path
				d="M -1.3 0.32 C -0.5 0.78 0.6 0.72 1.3 0.08 L 1.3 1.3 L -1.3 1.3 Z"
				fill={OUTLINE}
				opacity={shading}
			/>
			<ellipse
				cx="-0.38"
				cy="-0.6"
				rx="0.34"
				ry="0.14"
				fill="white"
				opacity="0.3"
				transform="rotate(-22 -0.38 -0.6)"
			/>
		</g>
	{/if}
	{#if children}
		<g clip-path="url(#{id})">{@render children()}</g>
	{/if}
	<path
		{d}
		fill="none"
		stroke={OUTLINE}
		stroke-width="4"
		stroke-linejoin="round"
		vector-effect="non-scaling-stroke"
	/>
</g>
