<!--
	Speed training: tap the scurrying mouse as many times as you can. It gets faster each catch.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import * as sfx from '../../audio/engine';
	import CatView from '../../cat/CatView.svelte';
	import type { Cat } from '../../cat/types';
	import { onFrame, scenePoint } from '../loop';

	interface Props {
		cat: Cat;
		onDone: (score: number) => void;
	}

	let { cat, onDone }: Props = $props();

	const DURATION = 20;
	let elapsed = $state(0);
	let catches = $state(0);
	let mouse = $state({ x: 300, y: 150, vx: -120, vy: 60 });
	let pops = $state<{ id: number; x: number; y: number; at: number }[]>([]);
	let area: SVGSVGElement;
	let finished = false;
	let nextTurn = 1;

	function speed() {
		return 130 + catches * 22;
	}

	function aim(angle: number) {
		mouse.vx = Math.cos(angle) * speed();
		mouse.vy = Math.sin(angle) * speed();
	}

	onMount(() =>
		onFrame((dt, t) => {
			elapsed = t;
			if (t >= DURATION) {
				if (!finished) {
					finished = true;
					onDone(Math.min(100, catches * 9));
				}
				return;
			}
			mouse.x += mouse.vx * dt;
			mouse.y += mouse.vy * dt;
			if (mouse.x < 25 || mouse.x > 375) mouse.vx *= -1;
			if (mouse.y < 40 || mouse.y > 270) mouse.vy *= -1;
			mouse.x = Math.max(25, Math.min(375, mouse.x));
			mouse.y = Math.max(40, Math.min(270, mouse.y));
			if (t > nextTurn) {
				nextTurn = t + 0.6 + Math.random() * 0.9;
				aim(Math.random() * Math.PI * 2);
			}
		})
	);

	function tap(e: PointerEvent) {
		if (finished) return;
		const p = scenePoint(e, area);
		if (Math.hypot(p.x - mouse.x, p.y - mouse.y) > 38) return;
		catches++;
		sfx.squeak();
		pops = [
			...pops.filter((s) => elapsed - s.at < 0.8),
			{ id: catches, x: mouse.x, y: mouse.y, at: elapsed }
		];
		mouse.x = mouse.x > 200 ? 40 + Math.random() * 100 : 260 + Math.random() * 100;
		mouse.y = 60 + Math.random() * 180;
		aim(Math.random() * Math.PI * 2);
	}
</script>

<div class="game">
	<div class="hud">
		<span>🐭 {catches}</span>
		<span>⏱️ {Math.max(0, Math.ceil(DURATION - elapsed))}</span>
	</div>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<svg viewBox="0 0 400 300" bind:this={area} onpointerdown={tap}>
		<rect width="400" height="300" fill="#e9f8e4" />
		<path d="M 0 250 Q 200 235 400 250 L 400 300 L 0 300 Z" fill="#bfe8b0" />
		<g transform="translate({mouse.x} {mouse.y}) scale({mouse.vx < 0 ? -1 : 1} 1)">
			<path
				d="M -20 4 Q -40 0 -44 -14"
				fill="none"
				stroke="#c98fa0"
				stroke-width="3"
				stroke-linecap="round"
			/>
			<ellipse cx="0" cy="0" rx="22" ry="14" fill="#a9adb8" stroke="#3b2a40" stroke-width="2.5" />
			<circle cx="14" cy="-12" r="8" fill="#ffb3c8" stroke="#3b2a40" stroke-width="2.5" />
			<circle cx="20" cy="-2" r="2.5" fill="#3b2a40" />
			<circle cx="27" cy="3" r="2.5" fill="#ff7fa3" />
		</g>
		{#each pops as p (p.id)}
			{@const age = elapsed - p.at}
			{#if age < 0.8}
				<text x={p.x} y={p.y - age * 50} font-size="26" text-anchor="middle" opacity={1 - age / 0.8}
					>✨</text
				>
			{/if}
		{/each}
	</svg>
	<div class="watcher">
		<CatView {cat} scenery={false} focus="face" lookAt={{ x: mouse.x, y: mouse.y }} />
	</div>
</div>

<style>
	.game {
		position: relative;
		width: 100%;
	}
	svg {
		display: block;
		width: 100%;
		border-radius: 20px;
		touch-action: none;
		cursor: crosshair;
	}
	.hud {
		display: flex;
		justify-content: space-between;
		font-size: 1.6rem;
		font-weight: 700;
		padding: 0 8px 6px;
	}
	.watcher {
		position: absolute;
		left: 8px;
		bottom: 8px;
		width: 22%;
		aspect-ratio: 1;
		pointer-events: none;
	}
</style>
