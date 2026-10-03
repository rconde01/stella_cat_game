<!--
	Bits of s'mores stuck in the fur: graham crackers, marshmallows and chocolate.
	Positions are in the parent's coordinates; `size` is how big one piece is in those coordinates.
-->
<script lang="ts" module>
	export interface SmorePiece {
		x: number;
		y: number;
		rot: number;
		kind: 'graham' | 'marshmallow' | 'chocolate';
	}
</script>

<script lang="ts">
	import { OUTLINE } from '../style';

	interface Props {
		pieces: SmorePiece[];
		size: number;
	}

	let { pieces, size }: Props = $props();

	const ln = { 'vector-effect': 'non-scaling-stroke' } as const;
</script>

{#each pieces as p, i (i)}
	<!-- each piece is drawn in a 20x20 box around its center -->
	<g
		transform="translate({p.x} {p.y}) rotate({p.rot}) scale({size / 20})"
		stroke={OUTLINE}
		stroke-width="2"
	>
		{#if p.kind === 'graham'}
			<rect x="-9" y="-9" width="18" height="18" rx="2.5" fill="#d9a066" {...ln} />
			<path d="M 0 -7 L 0 7" stroke="#a8693a" stroke-dasharray="2 3" {...ln} />
			{#each [[-4.5, -4.5], [4.5, -4.5], [-4.5, 4.5], [4.5, 4.5]] as [cx, cy], j (j)}
				<circle {cx} {cy} r="1.2" fill="#a8693a" stroke="none" />
			{/each}
		{:else if p.kind === 'marshmallow'}
			<rect x="-8" y="-7" width="16" height="14" rx="5" fill="#fffaf2" {...ln} />
			<path d="M -7 -3 Q 0 -6 7 -3" stroke="#e3b47a" stroke-width="3" fill="none" {...ln} />
		{:else}
			<rect x="-8" y="-6" width="16" height="12" rx="1.5" fill="#6b3e26" {...ln} />
			<path d="M 0 -6 L 0 6 M -8 0 L 8 0" stroke="#4a2716" stroke-width="1.5" {...ln} />
		{/if}
	</g>
{/each}
