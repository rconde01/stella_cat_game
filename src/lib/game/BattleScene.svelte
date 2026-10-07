<!--
	Battle arenas, drawn in an 800×400 scene. The floor (where the cats stand) is at y = 345.
-->
<script lang="ts">
	import type { Location } from './moves';

	interface Props {
		location: Location;
		t: number;
	}

	let { location, t }: Props = $props();

	const O = '#3b2a40';
	const wrap = (x: number, w = 1000) => (((x % w) + w) % w) - 100;
</script>

{#snippet cloud(x: number, y: number, s: number)}
	<g transform="translate({x} {y}) scale({s})" fill="white">
		<ellipse cx="0" cy="0" rx="40" ry="20" />
		<ellipse cx="30" cy="-12" rx="28" ry="22" />
		<ellipse cx="-28" cy="4" rx="22" ry="14" />
		<ellipse cx="56" cy="4" rx="22" ry="14" />
	</g>
{/snippet}

{#snippet crate(x: number, y: number, s: number)}
	<g transform="translate({x} {y}) scale({s})" stroke={O} stroke-width="3">
		<rect x="0" y="0" width="80" height="80" fill="#d6a46a" />
		<path d="M 0 0 L 80 80 M 80 0 L 0 80" stroke="#a8743f" stroke-width="5" />
		<rect x="0" y="0" width="80" height="80" fill="none" />
	</g>
{/snippet}

{#if location === 'warehouse'}
	<rect width="800" height="400" fill="#c9ccd6" />
	{#each [0, 1, 2, 3, 4, 5, 6, 7] as i (i)}
		<rect x={i * 100} y="0" width="6" height="345" fill="#b3b7c4" />
	{/each}
	{#each [180, 400, 620] as x (x)}
		<path d="M {x} 0 L {x} 40" stroke="#555" stroke-width="3" />
		<path
			d="M {x - 30} 60 L {x + 30} 60 L {x + 18} 40 L {x - 18} 40 Z"
			fill="#7d808c"
			stroke={O}
			stroke-width="3"
		/>
		<ellipse
			cx={x}
			cy="64"
			rx="70"
			ry="14"
			fill="#fff6b0"
			opacity={0.35 + 0.1 * Math.sin(t * 2 + x)}
		/>
	{/each}
	{@render crate(20, 185, 1)}
	{@render crate(20, 265, 1)}
	{@render crate(100, 265, 1)}
	{@render crate(670, 225, 1.5)}
	<g stroke={O} stroke-width="3">
		<rect x="560" y="290" width="90" height="55" fill="#d9b47f" />
		<path
			d="M 560 290 L 580 270 L 670 270 L 650 290 M 650 290 L 670 270 L 670 325 L 650 345"
			fill="#c49a5f"
		/>
	</g>
	<rect y="345" width="800" height="55" fill="#9aa0ab" />
	<path d="M 0 345 L 800 345" stroke={O} stroke-width="3" />
	<path
		d="M 120 372 L 260 372 M 480 388 L 620 388"
		stroke="#ffd43b"
		stroke-width="6"
		stroke-dasharray="20 14"
	/>
{:else if location === 'field'}
	<rect width="800" height="400" fill="#a5dcff" />
	<circle cx="690" cy="70" r="40" fill="#ffe066" />
	{@render cloud(wrap(120 + t * 10), 80, 1)}
	{@render cloud(wrap(520 + t * 6), 120, 0.7)}
	<path d="M 0 280 Q 200 220 420 270 Q 620 230 800 270 L 800 400 L 0 400 Z" fill="#9be08a" />
	<g stroke="#a8743f" stroke-width="6">
		{#each [30, 110, 190] as x (x)}
			<path d="M {x} 330 L {x} 270" />
		{/each}
		<path d="M 20 285 L 200 285 M 20 310 L 200 310" />
	</g>
	<g transform="translate(650 300)" stroke={O} stroke-width="3">
		<rect x="0" y="0" width="110" height="60" rx="14" fill="#f2d16b" />
		<path d="M 10 15 L 100 15 M 10 30 L 100 30 M 10 45 L 100 45" stroke="#d1a838" />
	</g>
	<rect y="345" width="800" height="55" fill="#7ccf6b" />
	{#each [60, 250, 420, 560, 740] as x, i (x)}
		<g transform="translate({x} {370 + (i % 2) * 15})">
			{#each [0, 72, 144, 216, 288] as a (a)}
				<ellipse
					cx="0"
					cy="-5"
					rx="4"
					ry="6"
					fill={['#ff9cc4', '#ffd43b', '#c8b6ff'][i % 3]}
					transform="rotate({a})"
				/>
			{/each}
			<circle r="3.5" fill="#ffb84d" />
		</g>
	{/each}
{:else if location === 'bathroom'}
	<rect width="800" height="400" fill="#d6f0ff" />
	{#each Array.from({ length: 14 }, (_, i) => i) as i (i)}
		<path d="M {i * 60} 0 L {i * 60} 345" stroke="#b8e0f5" stroke-width="3" />
	{/each}
	{#each [60, 120, 180, 240, 300] as y (y)}
		<path d="M 0 {y} L 800 {y}" stroke="#b8e0f5" stroke-width="3" />
	{/each}
	<rect
		x="330"
		y="40"
		width="140"
		height="110"
		rx="12"
		fill="#eef9ff"
		stroke="#9ec5d9"
		stroke-width="8"
	/>
	<path d="M 350 60 L 380 90 M 365 55 L 400 90" stroke="white" stroke-width="6" opacity="0.8" />
	<!-- bathtub with bubbles -->
	<g stroke={O} stroke-width="3">
		<path d="M 10 250 L 230 250 L 220 330 Q 120 345 20 330 Z" fill="white" />
		<rect x="0" y="240" width="240" height="16" rx="8" fill="#f1f3f5" />
		<path d="M 30 330 L 22 345 M 210 330 L 218 345" stroke-width="5" />
	</g>
	{#each [0, 1, 2, 3, 4, 5] as i (i)}
		<circle
			cx={30 + i * 35}
			cy={232 - 8 * Math.abs(Math.sin(t * 1.5 + i))}
			r={14 + (i % 3) * 5}
			fill="white"
			stroke="#b8e0f5"
			stroke-width="2"
		/>
	{/each}
	<g transform="translate(150 {205 + 4 * Math.sin(t * 2)})" stroke={O} stroke-width="2.5">
		<ellipse cx="0" cy="0" rx="18" ry="12" fill="#ffd43b" />
		<circle cx="12" cy="-12" r="9" fill="#ffd43b" />
		<path d="M 20 -12 L 28 -10 L 20 -8 Z" fill="#ff922b" />
	</g>
	<!-- toilet -->
	<g transform="translate(660 230)" stroke={O} stroke-width="3">
		<rect x="40" y="0" width="70" height="60" rx="8" fill="white" />
		<path d="M 0 70 L 110 70 Q 110 110 60 115 L 50 115 Q 0 110 0 70 Z" fill="white" />
		<rect x="35" y="112" width="45" height="3" fill="white" />
	</g>
	<rect x="540" y="120" width="10" height="80" fill="#c0c4cc" />
	<rect x="520" y="110" width="50" height="70" rx="6" fill="#ff9cc4" stroke={O} stroke-width="3" />
	<rect y="345" width="800" height="55" fill="#f3f3f3" />
	{#each Array.from({ length: 20 }, (_, i) => i) as i (i)}
		<path d="M {i * 40} 345 L {i * 40} 400" stroke="#dcdcdc" stroke-width="2" />
	{/each}
	<path d="M 0 345 L 800 345" stroke={O} stroke-width="3" />
{:else if location === 'plane'}
	<defs>
		<linearGradient id="sky-plane" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#4dabf7" />
			<stop offset="1" stop-color="#d0ebff" />
		</linearGradient>
	</defs>
	<rect width="800" height="400" fill="url(#sky-plane)" />
	<!-- clouds whooshing past -->
	{@render cloud(wrap(900 - t * 260), 90, 1.2)}
	{@render cloud(wrap(400 - t * 200), 200, 0.8)}
	{@render cloud(wrap(700 - t * 320), 300, 1.4)}
	{#each [0, 1, 2, 3] as i (i)}
		<path
			d="M {wrap(800 - t * 600 - i * 260)} {60 + i * 70} l -80 0"
			stroke="white"
			stroke-width="4"
			stroke-linecap="round"
			opacity="0.7"
		/>
	{/each}
	<!-- the plane: body behind, wing as the floor -->
	<path d="M -20 250 L 820 250 L 820 330 L -20 330 Z" fill="#f1f3f5" stroke={O} stroke-width="3" />
	{#each [60, 160, 260, 560, 660, 760] as x (x)}
		<rect {x} y="268" width="34" height="26" rx="10" fill="#74c0fc" stroke={O} stroke-width="2.5" />
	{/each}
	<path
		d="M -20 345 L 820 345 L 820 375 Q 400 395 -20 375 Z"
		fill="#dee2e6"
		stroke={O}
		stroke-width="3"
	/>
	<path d="M 0 360 L 800 360" stroke="#adb5bd" stroke-width="3" stroke-dasharray="30 20" />
	<g transform="translate(400 340)" stroke={O} stroke-width="3">
		<rect x="-40" y="-12" width="80" height="24" rx="12" fill="#adb5bd" />
		<circle cx="44" cy="0" r={6 + 2 * Math.sin(t * 40)} fill="#868e96" />
	</g>
{:else}
	<!-- dojo -->
	<rect width="800" height="400" fill="#fff4e0" />
	{#each [0, 1, 2, 3, 4] as i (i)}
		<rect
			x={i * 170 + 15}
			y="40"
			width="140"
			height="230"
			fill="#fffaf0"
			stroke="#8a5a3c"
			stroke-width="6"
		/>
		<path
			d="M {i * 170 + 85} 40 L {i * 170 + 85} 270 M {i * 170 + 15} 117 L {i * 170 + 155} 117 M {i *
				170 +
				15} 194 L {i * 170 + 155} 194"
			stroke="#c9a06a"
			stroke-width="3"
		/>
	{/each}
	<rect x="0" y="0" width="800" height="40" fill="#8a5a3c" />
	<!-- hanging scroll -->
	<g transform="translate(400 50)">
		<rect x="-40" y="0" width="80" height="150" fill="#fdf6e3" stroke={O} stroke-width="3" />
		<rect x="-48" y="-6" width="96" height="10" rx="5" fill="#8a5a3c" />
		<text x="0" y="95" text-anchor="middle" font-size="64" fill="#c92a2a" font-family="serif"
			>猫</text
		>
	</g>
	{#each [120, 680] as x (x)}
		<g transform="translate({x} {50 + 4 * Math.sin(t * 1.5 + x)})">
			<path d="M 0 -10 L 0 0" stroke={O} stroke-width="3" />
			<ellipse cx="0" cy="24" rx="20" ry="26" fill="#ff6b6b" stroke={O} stroke-width="3" />
			<path
				d="M -18 24 L 18 24 M -14 12 L 14 12 M -14 36 L 14 36"
				stroke="#c92a2a"
				stroke-width="2"
			/>
		</g>
	{/each}
	<rect y="270" width="800" height="75" fill="#e8c38f" />
	<rect y="345" width="800" height="55" fill="#c9a06a" />
	{#each Array.from({ length: 9 }, (_, i) => i) as i (i)}
		<path d="M {i * 100} 345 L {i * 100 - 40} 400" stroke="#a8743f" stroke-width="3" />
	{/each}
	<path d="M 0 345 L 800 345" stroke={O} stroke-width="3" />
{/if}
