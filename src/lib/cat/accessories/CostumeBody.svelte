<!--
	Armour plates or robot panels over a blob-shaped part. Drawn in the part's unit coordinates (and
	clipped to it by Part); round details are drawn in pixels so they don't get squashed.
-->
<script lang="ts">
	import type { Costume } from '../costume';
	import { ROBOT_DARK, STEEL_DARK } from '../costume';
	import type { Blob } from '../geometry';
	import { OUTLINE } from '../style';

	interface Props {
		uid: string;
		costume: Costume;
		blob: Blob;
		t: number;
	}

	let { uid, costume, blob, t }: Props = $props();

	const px = (ux: number, uy: number) => ({ x: ux * blob.rx, y: uy * blob.ry });

	/** Seams across the part, plus rivet positions along them (unit coordinates). */
	const seams = $derived.by(() => {
		if (blob.path === 'pear') {
			return [-0.3, 0.2, 0.65].map((y) => ({
				d: `M -1.2 ${y} Q 0 ${y + 0.18} 1.2 ${y}`,
				rivets: [-0.6, 0, 0.6].map((x) => ({ x, y: y + 0.09 * (1 - (x / 1.2) ** 2) - 0.08 }))
			}));
		}
		if (blob.path === 'loaf') {
			return [-0.4, 0.1, 0.6].map((x) => ({
				d: `M ${x} -1.2 Q ${x + 0.15} 0 ${x} 1.2`,
				rivets: [-0.5, 0, 0.5].map((y) => ({ x: x + 0.075 * (1 - (y / 1.2) ** 2) + 0.07, y }))
			}));
		}
		return [{ d: 'M -1.2 0.1 Q 0 0.45 1.2 0.1', rivets: [] }];
	});

	const panel = $derived(
		blob.path === 'pear' ? px(0, 0.05) : blob.path === 'loaf' ? px(-0.15, -0.1) : null
	);
	const LIGHTS = ['#ff5d73', '#ffd43b', '#5cf29a'];
</script>

{#if costume === 'armour'}
	<rect x="-1.2" y="-1.2" width="2.4" height="2.4" fill="url(#{uid}-steel)" />
	{#each seams as seam, i (i)}
		<path
			d={seam.d}
			fill="none"
			stroke={STEEL_DARK}
			stroke-width="2.5"
			vector-effect="non-scaling-stroke"
		/>
	{/each}
	<ellipse
		cx="-0.4"
		cy="-0.55"
		rx="0.28"
		ry="0.12"
		fill="white"
		opacity="0.55"
		transform="rotate(-20 -0.4 -0.55)"
	/>
	<g transform="scale({1 / blob.rx} {1 / blob.ry})">
		{#each seams as seam, i (i)}
			{#each seam.rivets as r, j (j)}
				<circle cx={px(r.x, r.y).x} cy={px(r.x, r.y).y} r="2.6" fill={STEEL_DARK} />
			{/each}
		{/each}
	</g>
{:else}
	<rect x="-1.2" y="-1.2" width="2.4" height="2.4" fill="url(#{uid}-metal)" />
	<g transform="scale({1 / blob.rx} {1 / blob.ry})">
		{#if panel}
			{@const w = Math.min(blob.rx * 0.8, 56)}
			{@const h = Math.min(blob.ry * 0.55, 32)}
			<rect
				x={panel.x - w / 2}
				y={panel.y - h / 2}
				width={w}
				height={h}
				rx="6"
				fill="#2e3a4a"
				stroke={OUTLINE}
				stroke-width="2"
			/>
			{#each LIGHTS as color, i (i)}
				<circle
					cx={panel.x + (i - 1) * (w / 3.4)}
					cy={panel.y}
					r={Math.min(h / 4, 6)}
					fill={color}
					opacity={Math.sin(t * 4 + i * 2.1) > 0 ? 1 : 0.25}
				/>
			{/each}
		{/if}
		{#each [px(-0.7, -0.6), px(0.7, -0.6), px(-0.6, 0.6), px(0.6, 0.6)] as b, i (i)}
			<circle cx={b.x} cy={b.y} r="3.2" fill={ROBOT_DARK} />
		{/each}
	</g>
{/if}
