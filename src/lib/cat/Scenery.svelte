<!--
	Backgrounds behind the cat, in the 400x400 scene. The cat stands on y = 362.
-->
<script lang="ts">
	import type { Background } from './types';

	interface Props {
		uid: string;
		background: Background;
		t: number;
	}

	let { uid, background, t }: Props = $props();

	const PAW =
		'M 0 6 C -9 6 -11 -2 -5 -4 C -2 -5 2 -5 5 -4 C 11 -2 9 6 0 6 Z ' +
		'M -10 -8 a 3.2 4 0 1 0 0.1 0 Z M -3.5 -13 a 3.2 4 0 1 0 0.1 0 Z ' +
		'M 3.5 -13 a 3.2 4 0 1 0 0.1 0 Z M 10 -8 a 3.2 4 0 1 0 0.1 0 Z';
	const HEART = 'M 0 9 C -14 0 -10 -11 0 -4 C 10 -11 14 0 0 9 Z';
	const FLOWERS = [
		[30, 378, '#ff9cc4'],
		[95, 392, '#ffd43b'],
		[300, 384, '#c8b6ff'],
		[365, 372, '#ff9cc4'],
		[250, 396, '#ffffff']
	] as const;
	const STARS = [
		[40, 40],
		[120, 80],
		[200, 30],
		[260, 110],
		[330, 60],
		[370, 150],
		[30, 160],
		[160, 150],
		[90, 220],
		[300, 200],
		[230, 190],
		[370, 260]
	] as const;

	const cloudX = (start: number, speed: number) => ((start + t * speed) % 520) - 60;
</script>

{#snippet cloud(x: number, y: number, s: number)}
	<g transform="translate({x} {y}) scale({s})" fill="white" opacity="0.95">
		<ellipse cx="0" cy="0" rx="28" ry="16" />
		<ellipse cx="22" cy="-8" rx="20" ry="16" />
		<ellipse cx="-20" cy="2" rx="16" ry="11" />
		<ellipse cx="40" cy="2" rx="16" ry="11" />
	</g>
{/snippet}

{#snippet flower(x: number, y: number, color: string)}
	<g transform="translate({x} {y})">
		{#each [0, 72, 144, 216, 288] as a (a)}
			<ellipse cx="0" cy="-5" rx="3.5" ry="5" fill={color} transform="rotate({a})" />
		{/each}
		<circle r="3" fill="#ffb84d" />
	</g>
{/snippet}

{#if background === 'lawn'}
	<defs>
		<linearGradient id="{uid}-sky" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#9fdcff" />
			<stop offset="1" stop-color="#e8f7ff" />
		</linearGradient>
	</defs>
	<rect width="400" height="400" fill="url(#{uid}-sky)" />
	<g transform="translate(345 58) rotate({t * 10})">
		{#each [0, 45, 90, 135, 180, 225, 270, 315] as a (a)}
			<rect x="-3" y="-46" width="6" height="12" rx="3" fill="#ffd43b" transform="rotate({a})" />
		{/each}
	</g>
	<circle cx="345" cy="58" r="28" fill="#ffe066" />
	{@render cloud(cloudX(40, 6), 70, 1)}
	{@render cloud(cloudX(300, 4), 120, 0.7)}
	<path d="M 0 300 Q 100 250 210 295 Q 300 255 400 290 L 400 400 L 0 400 Z" fill="#a8e29a" />
	<path d="M 0 338 Q 100 326 200 336 Q 300 346 400 332 L 400 400 L 0 400 Z" fill="#7ccf6b" />
	{#each FLOWERS as [x, y, c], i (i)}
		{@render flower(x, y, c)}
	{/each}
{:else if background === 'woods'}
	<rect width="400" height="400" fill="#d8f0e4" />
	{@render cloud(cloudX(120, 3), 50, 0.8)}
	{#each [[20, 1.1], [95, 0.9], [170, 1.2], [250, 1], [330, 1.15], [395, 0.95]] as [x, s], i (i)}
		<g transform="translate({x} 300) scale({s})">
			<rect x="-6" y="-20" width="12" height="30" fill="#8a5a3c" />
			<path d="M 0 -150 L 45 -60 L -45 -60 Z M 0 -115 L 52 -20 L -52 -20 Z" fill="#5fa877" />
		</g>
	{/each}
	<path d="M 0 320 Q 200 300 400 320 L 400 400 L 0 400 Z" fill="#8bc277" />
	<path
		d="M 150 400 Q 190 360 230 345 Q 260 340 300 342 Q 250 360 230 400 Z"
		fill="#d9c08f"
		opacity="0.7"
	/>
	{#each [[40, 360, 1], [355, 352, 0.8]] as [x, y, s], i (i)}
		<g transform="translate({x} {y}) scale({s})">
			<rect x="-4" y="-8" width="8" height="14" rx="3" fill="#fff4e0" />
			<path d="M -15 -6 Q 0 -26 15 -6 Z" fill="#ff5d5d" />
			<circle cx="-5" cy="-12" r="2.5" fill="white" />
			<circle cx="5" cy="-10" r="2" fill="white" />
		</g>
	{/each}
{:else if background === 'bedroom'}
	<rect width="400" height="400" fill="#ffe4ef" />
	{#each [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as i (i)}
		<rect x={i * 44 + 10} y="0" width="18" height="300" fill="#ffd3e5" opacity="0.6" />
	{/each}
	<rect
		x="40"
		y="50"
		width="110"
		height="100"
		rx="6"
		fill="#bfe6ff"
		stroke="#b98a6a"
		stroke-width="8"
	/>
	<path d="M 95 50 L 95 150 M 40 100 L 150 100" stroke="#b98a6a" stroke-width="5" />
	{@render cloud(70 + 15 * Math.sin(t * 0.3), 82, 0.4)}
	<path
		d="M 30 42 Q 60 100 44 160 L 30 160 Z M 160 42 Q 130 100 146 160 L 160 160 Z"
		fill="#ff9cc4"
	/>
	<rect
		x="270"
		y="70"
		width="70"
		height="56"
		rx="4"
		fill="#fff8e7"
		stroke="#d6a86a"
		stroke-width="6"
	/>
	<path d="M 285 115 L 300 92 L 312 108 L 320 98 L 330 115 Z" fill="#7ccf6b" />
	<rect x="0" y="300" width="400" height="100" fill="#d9a679" />
	<path
		d="M 40 345 L 40 240 Q 200 200 360 240 L 360 345 Z"
		fill="#b48cff"
		stroke="#8f66e0"
		stroke-width="5"
	/>
	<rect
		x="25"
		y="330"
		width="350"
		height="70"
		rx="16"
		fill="#a5d8ff"
		stroke="#6fb4e8"
		stroke-width="5"
	/>
	{#each [60, 120, 180, 240, 300] as x (x)}
		<circle cx={x} cy="372" r="7" fill="#ffffff" opacity="0.7" />
	{/each}
	<ellipse cx="70" cy="328" rx="38" ry="16" fill="white" stroke="#e3d3ef" stroke-width="4" />
{:else if background === 'rainbow'}
	<rect width="400" height="400" fill="#eaf7ff" />
	{#each ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7', '#9775fa'] as color, i (i)}
		<path
			d="M {20 + i * 16} 330 A {180 - i * 16} {180 - i * 16} 0 0 1 {380 - i * 16} 330"
			fill="none"
			stroke={color}
			stroke-width="16"
		/>
	{/each}
	{@render cloud(40, 320, 1.1)}
	{@render cloud(350, 320, 1.1)}
	<path d="M 0 340 Q 200 325 400 340 L 400 400 L 0 400 Z" fill="#9be08a" />
{:else if background === 'starry-night'}
	<defs>
		<linearGradient id="{uid}-night" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#1d1b4b" />
			<stop offset="1" stop-color="#4a3b8f" />
		</linearGradient>
	</defs>
	<rect width="400" height="400" fill="url(#{uid}-night)" />
	{#each STARS as [x, y], i (i)}
		<circle
			cx={x}
			cy={y}
			r={2 + (i % 3)}
			fill="#fff6c2"
			opacity={0.5 + 0.5 * Math.sin(t * 2 + i * 1.7)}
		/>
	{/each}
	<path d="M 320 46 A 34 34 0 1 0 352 92 A 30 30 0 0 1 320 46 Z" fill="#fff3b0" />
	<path d="M 0 345 Q 200 320 400 345 L 400 400 L 0 400 Z" fill="#2f2a6b" />
{:else if background === 'paw-prints' || background === 'hearts'}
	{@const paws = background === 'paw-prints'}
	<defs>
		<pattern id="{uid}-tile" width="70" height="70" patternUnits="userSpaceOnUse">
			<g transform="translate(18 20) rotate(-20)" fill={paws ? '#ff9cc4' : '#ffaacb'}>
				<path d={paws ? PAW : HEART} />
			</g>
			<g transform="translate(53 55) rotate(15)" fill={paws ? '#ffb8d6' : '#ffc6dc'}>
				<path d={paws ? PAW : HEART} />
			</g>
		</pattern>
	</defs>
	<rect width="400" height="400" fill={paws ? '#ffeef6' : '#fff2f7'} />
	<rect width="400" height="400" fill="url(#{uid}-tile)" />
{/if}
