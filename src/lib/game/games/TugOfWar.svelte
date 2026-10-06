<!--
	Strength training: tap as fast as you can to pull the rope away from the big toy fish.
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

	const DURATION = 15;
	/** Rope position: -1 = the cat wins, +1 = the toy wins. */
	let rope = $state(0);
	let elapsed = $state(0);
	let finished = false;

	function finish(score: number) {
		if (finished) return;
		finished = true;
		onDone(Math.round(score));
	}

	onMount(() =>
		onFrame((dt, t) => {
			if (finished) return;
			elapsed = t;
			// The toy pulls harder as time goes on.
			// About 3–4 taps a second keeps up; faster wins.
			rope = Math.min(1, rope + dt * 0.2 * (1 + (0.5 * t) / DURATION));
			if (rope <= -1) finish(100);
			else if (rope >= 1) finish(15);
			else if (t >= DURATION) finish(((1 - rope) / 2) * 100);
		})
	);

	function pull() {
		if (finished) return;
		rope = Math.max(-1, rope - 0.08);
		sfx.tug();
	}

	const flagX = $derived(200 + rope * 130);
</script>

<div class="game">
	<div class="hud">
		<span>💪 Pull!</span>
		<span>⏱️ {Math.max(0, Math.ceil(DURATION - elapsed))}</span>
	</div>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="area" onpointerdown={pull}>
		<svg viewBox="0 0 400 300">
			<rect width="400" height="300" fill="#fff4e0" />
			<path d="M 0 240 L 400 240 L 400 300 L 0 300 Z" fill="#f1d6a8" />
			<path d="M 200 225 L 200 255" stroke="#e86a92" stroke-width="4" stroke-dasharray="6 4" />
			<path
				d="M 95 {170 + Math.sin(elapsed * 20) * 2} L 285 170"
				stroke="#c9a06a"
				stroke-width="9"
				stroke-linecap="round"
			/>
			<path
				d="M {flagX} 170 l -10 34 l 20 0 Z"
				fill="#ff6b6b"
				stroke="#3b2a40"
				stroke-width="2.5"
			/>
			<!-- big plush fish -->
			<g transform="translate(320 165) rotate({-8 + 6 * Math.sin(elapsed * 6)})">
				<path
					d="M 30 0 L 62 -24 L 58 0 L 62 24 Z"
					fill="#4dabf7"
					stroke="#3b2a40"
					stroke-width="3"
				/>
				<ellipse cx="0" cy="0" rx="38" ry="26" fill="#74c0fc" stroke="#3b2a40" stroke-width="3" />
				<circle cx="-18" cy="-6" r="6" fill="white" stroke="#3b2a40" stroke-width="2" />
				<circle cx="-19" cy="-6" r="3" fill="#3b2a40" />
				<path d="M -34 6 Q -28 12 -22 8" fill="none" stroke="#3b2a40" stroke-width="2.5" />
			</g>
		</svg>
		<div class="puller" style="transform: translateX({rope * 6}%)">
			<CatView {cat} scenery={false} focus="cat" action={rope < -0.6 ? 'celebrating' : null} />
		</div>
	</div>
	<button class="pull" onclick={pull}>💪 PULL!</button>
</div>

<style>
	.game {
		width: 100%;
	}
	.area {
		position: relative;
		touch-action: manipulation;
		user-select: none;
	}
	svg {
		display: block;
		width: 100%;
		border-radius: 20px;
	}
	.puller {
		position: absolute;
		left: 0;
		bottom: 6%;
		width: 36%;
		aspect-ratio: 1;
		pointer-events: none;
	}
	.hud {
		display: flex;
		justify-content: space-between;
		font-size: 1.6rem;
		font-weight: 700;
		padding: 0 8px 6px;
	}
	.pull {
		display: block;
		width: 100%;
		margin-top: 10px;
		font-size: 2rem;
		font-weight: 700;
		padding: 14px;
		border: none;
		border-radius: 999px;
		background: var(--accent);
		color: white;
		box-shadow: 0 5px 0 var(--accent-dark);
		touch-action: manipulation;
	}
	.pull:active {
		transform: translateY(4px);
		box-shadow: 0 1px 0 var(--accent-dark);
	}
</style>
