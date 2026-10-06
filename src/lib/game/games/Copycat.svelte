<!--
	Smarts training: watch the pattern light up, then copy it. It gets one longer each time.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import * as sfx from '../../audio/engine';
	import CatView from '../../cat/CatView.svelte';
	import type { Cat } from '../../cat/types';

	interface Props {
		cat: Cat;
		onDone: (score: number) => void;
	}

	let { cat, onDone }: Props = $props();

	const PADS = [
		{ icon: '🐟', color: '#74c0fc' },
		{ icon: '🧶', color: '#ff9cc4' },
		{ icon: '🐭', color: '#ffd43b' },
		{ icon: '🥛', color: '#8ce99a' }
	];
	const MAX_ROUNDS = 6;

	let sequence = $state<number[]>([]);
	let lit = $state<number | null>(null);
	let phase = $state<'watch' | 'copy' | 'done'>('watch');
	let step = $state(0);
	let rounds = $state(0);
	let feedback = $state('');
	let timers: ReturnType<typeof setTimeout>[] = [];

	const wait = (ms: number) => new Promise((r) => timers.push(setTimeout(r, ms)));
	const randomPad = () => Math.floor(Math.random() * PADS.length);

	onMount(() => {
		sequence = [randomPad(), randomPad()];
		play();
		return () => timers.forEach(clearTimeout);
	});

	async function play() {
		phase = 'watch';
		feedback = 'Watch…';
		await wait(700);
		for (const pad of sequence) {
			lit = pad;
			sfx.note(pad);
			await wait(450);
			lit = null;
			await wait(200);
		}
		phase = 'copy';
		step = 0;
		feedback = 'Your turn!';
	}

	async function press(pad: number) {
		if (phase !== 'copy') return;
		sfx.note(pad, 0.2);
		lit = pad;
		timers.push(setTimeout(() => (lit = null), 180));
		if (pad !== sequence[step]) {
			phase = 'done';
			feedback = rounds ? `Good try! You remembered ${rounds + 1} in a row.` : 'Good try!';
			await wait(1400);
			onDone(Math.min(100, rounds * 17 + 5));
			return;
		}
		step++;
		if (step < sequence.length) return;
		rounds++;
		if (rounds >= MAX_ROUNDS) {
			phase = 'done';
			feedback = 'Genius cat! 🧠✨';
			sfx.levelUp();
			await wait(1400);
			onDone(100);
			return;
		}
		feedback = 'Great! ⭐';
		sequence = [...sequence, randomPad()];
		await wait(600);
		play();
	}
</script>

<div class="game">
	<div class="hud">
		<span>🧠 {rounds}</span>
		<span>{feedback}</span>
	</div>
	<div class="layout">
		<div class="watcher">
			<CatView
				{cat}
				scenery={false}
				focus="face"
				action={feedback.startsWith('Great') ? 'purring' : null}
			/>
		</div>
		<div class="pads">
			{#each PADS as pad, i (i)}
				<button
					class="pad"
					class:lit={lit === i}
					style="--c: {pad.color}"
					disabled={phase !== 'copy'}
					onpointerdown={() => press(i)}
					aria-label={pad.icon}
				>
					{pad.icon}
				</button>
			{/each}
		</div>
	</div>
</div>

<style>
	.hud {
		display: flex;
		justify-content: space-between;
		font-size: 1.5rem;
		font-weight: 700;
		padding: 0 8px 6px;
	}
	.layout {
		display: grid;
		grid-template-columns: 1fr 2fr;
		gap: 12px;
		align-items: center;
	}
	.watcher {
		aspect-ratio: 1;
	}
	.pads {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
	}
	.pad {
		aspect-ratio: 1;
		font-size: clamp(2.5rem, 8vw, 4rem);
		border-radius: 24px;
		border: 5px solid #3b2a40;
		background: color-mix(in srgb, var(--c) 45%, white);
		cursor: pointer;
		transition:
			transform 0.1s,
			background 0.1s;
		touch-action: manipulation;
	}
	.pad.lit {
		background: var(--c);
		transform: scale(1.08);
		box-shadow: 0 0 24px var(--c);
	}
	.pad:disabled {
		cursor: default;
		color: inherit;
	}
</style>
