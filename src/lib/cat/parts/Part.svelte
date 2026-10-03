<!--
	A filled, outlined shape drawn in unit coordinates, with optional pattern markings and costume
	(`children`) clipped inside it.
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
		children?: Snippet;
	}

	let { id, d, transform, fill, markings = '', markingFill = 'none', children }: Props = $props();
</script>

<g {transform}>
	<clipPath {id}><path {d} /></clipPath>
	<path {d} {fill} />
	{#if markings}
		<path d={markings} fill={markingFill} clip-path="url(#{id})" />
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
