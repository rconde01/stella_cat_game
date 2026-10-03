<!--
	A leg or tail: a thick rounded stroke with an outline, plus optional dashed pattern markings.
-->
<script lang="ts">
	import type { LimbDash } from '../patterns';
	import { OUTLINE } from '../style';

	interface Props {
		d: string;
		width: number;
		fill: string;
		dash: LimbDash | null;
		markingFill: string;
	}

	let { d, width, fill, dash, markingFill }: Props = $props();
</script>

<path {d} fill="none" stroke={OUTLINE} stroke-width={width + 8} stroke-linecap="round" />
<path {d} fill="none" stroke={fill} stroke-width={width} stroke-linecap="round" />
{#if dash}
	<path
		{d}
		fill="none"
		pathLength="100"
		stroke={markingFill}
		stroke-width={width * dash.widthScale}
		stroke-linecap={dash.cap}
		stroke-dasharray={dash.dasharray}
		stroke-dashoffset={dash.dashoffset}
	/>
{/if}
