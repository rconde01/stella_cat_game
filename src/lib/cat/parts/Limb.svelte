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
		/** For legs: where the paw is and which way the leg points, to draw little toe lines. */
		paw?: { x: number; y: number; dx: number; dy: number } | null;
	}

	let { d, width, fill, layers, paw = null }: Props = $props();

	const toes = $derived.by(() => {
		if (!paw) return [];
		const len = Math.hypot(paw.dx, paw.dy) || 1;
		const [ux, uy] = [paw.dx / len, paw.dy / len];
		const [px, py] = [-uy, ux];
		return [-0.18, 0.18].map((k) => {
			const sx = paw.x + px * width * k + ux * width * 0.12;
			const sy = paw.y + py * width * k + uy * width * 0.12;
			return `M ${sx} ${sy} L ${sx + ux * width * 0.3} ${sy + uy * width * 0.3}`;
		});
	});
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
{#each toes as toe, i (i)}
	<path d={toe} stroke={OUTLINE} stroke-width="2.5" stroke-linecap="round" opacity="0.8" />
{/each}
