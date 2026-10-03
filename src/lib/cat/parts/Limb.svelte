<!--
	A leg or tail: a thick rounded stroke with an outline, plus extra stroke layers on top
	(pattern markings, costume pieces).
-->
<script lang="ts" module>
	export interface LimbLayer {
		stroke: string;
		/** Width relative to the limb's width. */
		widthScale: number;
		/** Dash pattern in pathLength=100 units; omit for a solid layer. */
		dasharray?: string;
		dashoffset?: number;
		cap: 'butt' | 'round';
	}
</script>

<script lang="ts">
	import { OUTLINE } from '../style';

	interface Props {
		d: string;
		width: number;
		fill: string;
		layers: LimbLayer[];
	}

	let { d, width, fill, layers }: Props = $props();
</script>

<path {d} fill="none" stroke={OUTLINE} stroke-width={width + 8} stroke-linecap="round" />
<path {d} fill="none" stroke={fill} stroke-width={width} stroke-linecap="round" />
{#each layers as layer, i (i)}
	<path
		{d}
		fill="none"
		pathLength="100"
		stroke={layer.stroke}
		stroke-width={width * layer.widthScale}
		stroke-linecap={layer.cap}
		stroke-dasharray={layer.dasharray}
		stroke-dashoffset={layer.dashoffset}
	/>
{/each}
