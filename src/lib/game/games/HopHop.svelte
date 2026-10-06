<!--
	Agility training: tap to jump over yarn balls, cucumbers and shoes rolling toward the cat.
	Bumping into one doesn't end the game, it just doesn't count.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import * as sfx from '../../audio/engine';
	import CatView from '../../cat/CatView.svelte';
	import type { Cat } from '../../cat/types';
	import { onFrame } from '../loop';

	interface Props {
		cat: Cat;
		onDone: (score: number) => void;
	}

	let { cat, onDone }: Props = $props();

	type Kind = 'yarn' | 'cucumber' | 'shoe';
	interface Obstacle {
		id: number;
		kind: Kind;
		x: number;
		h: number;
		hit: boolean;
		passed: boolean;
	}

	const DURATION = 20;
	const GROUND = 250;
	const CAT_X = 95;
	const HEIGHTS: Record<Kind, number> = { yarn: 30, cucumber: 24, shoe: 36 };

	let elapsed = $state(0);
	let height = $state(0);
	let obstacles = $state<Obstacle[]>([]);
	let cleared = $state(0);
	let bumps = $state(0);
	let vy = 0;
	let nextSpawn = 1.2;
	let nextId = 0;
	let finished = false;

	onMount(() =>
		onFrame((dt, t) => {
			if (finished) return;
			elapsed = t;
			if (t >= DURATION) {
				finished = true;
				onDone(Math.max(0, Math.min(100, cleared * 11 - bumps * 3)));
				return;
			}
			// Jump physics (height above the ground, in scene units).
			if (height > 0 || vy > 0) {
				vy -= 1500 * dt;
				height = Math.max(0, height + vy * dt);
				if (height === 0) vy = 0;
			}
			const speed = 170 + t * 7;
			if (t > nextSpawn) {
				nextSpawn = t + 1.3 + Math.random() * 1.0;
				const kinds: Kind[] = ['yarn', 'cucumber', 'shoe'];
				const kind = kinds[Math.floor(Math.random() * kinds.length)];
				obstacles.push({ id: nextId++, kind, x: 430, h: HEIGHTS[kind], hit: false, passed: false });
			}
			for (const o of obstacles) {
				o.x -= speed * dt;
				if (!o.hit && !o.passed && Math.abs(o.x - CAT_X) < 26 && height < o.h) {
					o.hit = true;
					bumps++;
					sfx.bonk();
				}
				if (!o.passed && o.x < CAT_X - 30) {
					o.passed = true;
					if (!o.hit) {
						cleared++;
						sfx.sparkle();
					}
				}
			}
			obstacles = obstacles.filter((o) => o.x > -40);
		})
	);

	function jump() {
		if (finished || height > 0) return;
		vy = 560;
		height = 0.01;
		sfx.boing();
	}
</script>

<div class="game">
	<div class="hud">
		<span>🤸 {cleared}</span>
		<span>⏱️ {Math.max(0, Math.ceil(DURATION - elapsed))}</span>
	</div>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="area" onpointerdown={jump}>
		<svg viewBox="0 0 400 300">
			<rect width="400" height="300" fill="#e3f2ff" />
			<path d="M 0 {GROUND} L 400 {GROUND} L 400 300 L 0 300 Z" fill="#a8e29a" />
			<ellipse cx={CAT_X} cy={GROUND} rx={30 - height * 0.15} ry="5" fill="black" opacity="0.15" />
			{#each obstacles as o (o.id)}
				<g transform="translate({o.x} {GROUND}) rotate({o.hit ? 25 : 0})">
					{#if o.kind === 'yarn'}
						<g transform="rotate({-o.x * 2} 0 -15)">
							<circle cx="0" cy="-15" r="15" fill="#ff7fb0" stroke="#3b2a40" stroke-width="2.5" />
							<path
								d="M -12 -22 Q 0 -10 12 -22 M -14 -12 Q 0 0 14 -12"
								fill="none"
								stroke="#c2185b"
								stroke-width="2"
							/>
						</g>
					{:else if o.kind === 'cucumber'}
						<rect
							x="-26"
							y="-24"
							width="52"
							height="24"
							rx="12"
							fill="#69db7c"
							stroke="#3b2a40"
							stroke-width="2.5"
						/>
						<circle cx="-8" cy="-14" r="2" fill="#2b8a3e" />
						<circle cx="8" cy="-10" r="2" fill="#2b8a3e" />
					{:else}
						<path
							d="M -22 0 L -22 -36 L -6 -36 L -4 -16 Q 18 -16 22 -6 L 22 0 Z"
							fill="#9b7bff"
							stroke="#3b2a40"
							stroke-width="2.5"
						/>
						<path d="M -22 -4 L 22 -4" stroke="white" stroke-width="3" />
					{/if}
				</g>
			{/each}
		</svg>
		<div class="jumper" style="bottom: {((300 - GROUND + height) / 300) * 100}%">
			<CatView
				cat={{ ...cat, pose: 'standing' }}
				scenery={false}
				focus="cat"
				action={height > 0 ? 'celebrating' : null}
			/>
		</div>
	</div>
	<p class="tip">Tap to jump!</p>
</div>

<style>
	.game {
		width: 100%;
	}
	.area {
		position: relative;
		touch-action: manipulation;
		user-select: none;
		cursor: pointer;
		overflow: hidden;
		border-radius: 20px;
	}
	svg {
		display: block;
		width: 100%;
	}
	.jumper {
		position: absolute;
		left: calc(95 / 400 * 100% - 14%);
		width: 28%;
		aspect-ratio: 370 / 340;
		pointer-events: none;
		/* The standing pose faces left; flip it to face the obstacles. */
		transform: scaleX(-1) translateY(9%);
	}
	.hud {
		display: flex;
		justify-content: space-between;
		font-size: 1.6rem;
		font-weight: 700;
		padding: 0 8px 6px;
	}
	.tip {
		text-align: center;
		font-size: 1.2rem;
		font-weight: 600;
	}
</style>
