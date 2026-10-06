<!--
	A cat's home: look after it (feed, play, brush, pet), clean up its mischief.
-->
<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import * as sfx from '#lib/audio/engine.ts';
	import {
		addTo,
		advanceCare,
		cleanUp,
		isHappy,
		needs,
		STUFF,
		STUFF_LABELS,
		type Care,
		type Mess,
		type Need,
		type Stuff
	} from '#lib/care/care.ts';
	import StuffView from '#lib/care/StuffView.svelte';
	import type { CatAction } from '#lib/cat/animation.ts';
	import CatView from '#lib/cat/CatView.svelte';
	import { useClock } from '#lib/cat/clock.svelte.ts';
	import { layoutCat } from '#lib/cat/geometry.ts';
	import { catStoreFor, type SavedCat } from '#lib/cat/store.ts';
	import { page } from '$app/state';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	type Tool = 'pet' | 'play' | 'brush';
	interface Particle {
		id: number;
		kind: 'heart' | 'sparkle' | 'tuft';
		x: number;
		y: number;
		born: number;
	}

	const NEED_INFO: Record<Need, { icon: string; ask: string }> = {
		food: { icon: '🐟', ask: "I'm hungry!" },
		play: { icon: '🪶', ask: 'Play with me!' },
		brush: { icon: '🪮', ask: 'My fur is messy!' }
	};

	const clock = useClock();
	const store = $derived(catStoreFor(data.user));

	let saved = $state<SavedCat | null>(null);
	let care = $state<Care | null>(null);
	let notFound = $state(false);
	let tool = $state<Tool>('pet');
	let action = $state<CatAction>(null);
	let actionUntil = 0;
	let feedingUntil = $state(0);
	let pointer = $state<{ x: number; y: number } | null>(null);
	let pressed = false;
	let particles = $state<Particle[]>([]);
	let message = $state('');
	let stage = $state<HTMLDivElement>();

	let annoyance = 0;
	let stopPurr: (() => void) | null = null;
	let lastMeow = 0;
	let lastPurr = 0;
	let lastSwish = 0;
	let lastParticle = 0;
	let lastAdvance = 0;
	let nextParticleId = 0;
	let saveTimer: ReturnType<typeof setTimeout> | undefined;
	let tick: ReturnType<typeof setInterval> | undefined;

	const cat = $derived(saved?.cat);
	const name = $derived(cat?.name || 'Your cat');
	const layout = $derived(cat ? layoutCat(cat) : null);
	const wants = $derived(care ? needs(care) : []);
	const t = $derived(clock.t);

	onMount(async () => {
		try {
			const id = page.url.searchParams.get('id');
			const found = (await store.list()).find((s) => s.id === id);
			if (!found) {
				notFound = true;
				return;
			}
			saved = found;
			const { care: now, newMesses } = advanceCare(found.care, Date.now());
			care = now;
			if (newMesses.length) {
				announceMesses(newMesses);
				saveSoon(0);
			} else if (needs(now).length) {
				message = `${found.cat.name || 'Your cat'} says: ${NEED_INFO[needs(now)[0]].ask}`;
			} else {
				message = `${found.cat.name || 'Your cat'} is happy to see you! 💕`;
			}
		} catch (err) {
			console.error(err);
			message = "Oh no, we couldn't find your cat right now.";
		}
		tick = setInterval(gameTick, 250);
	});

	onDestroy(() => {
		clearInterval(tick);
		stopPurr?.();
		if (saveTimer) {
			clearTimeout(saveTimer);
			save();
		}
	});

	function save() {
		saveTimer = undefined;
		if (saved && care) store.update(saved.id, { care: $state.snapshot(care) }).catch(console.error);
	}

	function saveSoon(delay = 1500) {
		clearTimeout(saveTimer);
		saveTimer = setTimeout(save, delay);
	}

	function setCare(next: Care) {
		care = next;
		saveSoon();
	}

	function announceMesses(messes: Mess[]) {
		const last = messes[messes.length - 1];
		const did = last.kind === 'poop' ? 'pooped' : 'peed';
		message = `Oh no! ${name} ${did} on your ${STUFF_LABELS[last.item]}! 😹`;
		if (last.kind === 'poop') sfx.plop();
		else sfx.trickle();
	}

	// ----- what the cat does -----

	function setAction(next: CatAction, seconds: number) {
		action = next;
		actionUntil = t + seconds;
		if (next !== 'purring') {
			stopPurr?.();
			stopPurr = null;
		}
	}

	function purr(seconds: number) {
		if (action === 'hissing') return;
		setAction('purring', seconds);
		lastPurr = t;
		stopPurr ??= sfx.startPurr();
		spawn('heart', (layout?.head.x ?? 200) + 40, (layout?.head.y ?? 150) - 50);
	}

	function meowNow() {
		const pitch = cat?.shape === 'kitten' ? 1.3 : cat?.disposition === 'grumpy' ? 0.85 : 1;
		sfx.meow(pitch);
		lastMeow = t;
	}

	/** Returns true if this was the last straw and the cat hissed. */
	function annoy(amount: number): boolean {
		annoyance += amount;
		const limit = cat?.disposition === 'grumpy' ? 3.5 : 5;
		if (annoyance < limit) return false;
		annoyance = 1;
		sfx.hiss();
		setAction('hissing', 1.6);
		message = `Hsss! ${name} is annoyed! Give them a little break.`;
		return true;
	}

	function gameTick() {
		if (!care) return;
		annoyance = Math.max(0, annoyance - 0.25);
		if (action && t > actionUntil) {
			action = null;
			stopPurr?.();
			stopPurr = null;
		}
		// Bring needs up to date every few seconds (they only change minute by minute).
		if (t - lastAdvance > 5) {
			lastAdvance = t;
			const { care: next, newMesses } = advanceCare(care, Date.now());
			if (next !== care) {
				care = next;
				if (newMesses.length) {
					announceMesses(newMesses);
					saveSoon(0);
				}
			}
		}
		const current = needs(care);
		if (!action && current.length && t - lastMeow > 12 + Math.random() * 6) {
			meowNow();
			message = `${name} says: ${NEED_INFO[current[0]].ask}`;
		} else if (!action && isHappy(care) && tool === 'pet' && t - lastPurr > 25) {
			purr(3);
		}
	}

	function spawn(kind: Particle['kind'], x: number, y: number) {
		particles = [
			...particles.filter((p) => t - p.born < 1.5),
			{ id: nextParticleId++, kind, x, y, born: t }
		];
	}

	// ----- player actions -----

	function chooseTool(next: Tool) {
		sfx.pop();
		tool = tool === next ? 'pet' : next;
	}

	function feed() {
		if (!care || t < feedingUntil) return;
		if (care.fullness > 90) {
			message = `${name} is full! No more food right now.`;
			annoy(2.5);
			return;
		}
		feedingUntil = t + 2.4;
		setAction('eating', 2.4);
		message = `Nom nom nom…`;
		const crunch = setInterval(() => sfx.nom(), 320);
		setTimeout(() => {
			clearInterval(crunch);
			if (care) setCare(addTo(care, 'food', 35));
			message = `Yum! ${name} loved that.`;
			purr(2.5);
		}, 2400);
	}

	function clean(item: Stuff) {
		if (!care) return;
		sfx.sparkle();
		setCare(cleanUp(care, item));
		message = `Sparkly clean! ✨`;
	}

	// ----- pointer on the stage -----

	function toScene(e: PointerEvent) {
		const r = stage!.getBoundingClientRect();
		return { x: ((e.clientX - r.left) / r.width) * 400, y: ((e.clientY - r.top) / r.height) * 400 };
	}

	function onCat(p: { x: number; y: number }): boolean {
		if (!layout) return false;
		const { head, body } = layout;
		const inHead = Math.hypot(p.x - head.x, p.y - head.y) < head.s * 1.1;
		const inBody =
			((p.x - body.cx) / (body.rx * 1.2)) ** 2 + ((p.y - body.cy) / (body.ry * 1.25)) ** 2 < 1;
		return inHead || inBody;
	}

	function onPointerDown(e: PointerEvent) {
		pressed = true;
		const p = toScene(e);
		pointer = p;
		if (tool !== 'pet' || !care || !onCat(p) || action === 'hissing') return;
		if (annoy(1)) return;
		if (needs(care).length && !isHappy(care)) {
			meowNow();
			message = `${name} says: ${NEED_INFO[needs(care)[0]].ask}`;
		} else {
			purr(2.5);
			message = `${name} loves pets! 💕`;
		}
	}

	function onPointerMove(e: PointerEvent) {
		const p = toScene(e);
		const dist = pointer ? Math.hypot(p.x - pointer.x, p.y - pointer.y) : 0;
		pointer = p;
		if (!care || dist === 0 || action === 'hissing') return;

		if (tool === 'play') {
			if (care.fun >= 100) {
				if (Math.random() < 0.01) message = `${name} is all played out! 😴`;
				return;
			}
			setCare(addTo(care, 'play', dist * 0.05));
			if (t - lastParticle > 0.4) {
				lastParticle = t;
				spawn('sparkle', p.x, p.y);
			}
			if (care.fun >= 100) message = `${name} had so much fun! 🎉`;
		} else if (tool === 'brush' && onCat(p)) {
			if (t - lastSwish > 0.35) {
				lastSwish = t;
				sfx.swish();
			}
			if (t - lastParticle > 0.12) {
				lastParticle = t;
				spawn(Math.random() < 0.5 ? 'sparkle' : 'tuft', p.x, p.y);
			}
			if (care.tidy >= 100) {
				annoy(dist * 0.012);
				return;
			}
			setCare(addTo(care, 'brush', dist * 0.06));
			if (action !== 'purring' || actionUntil - t < 0.5) purr(1.5);
			if (care.tidy >= 100) message = `${name} is super shiny! ✨`;
		} else if (tool === 'pet' && pressed && onCat(p) && action === 'purring') {
			// Stroking keeps the purr going and calms the cat down.
			actionUntil = t + 1.5;
			annoyance = Math.max(0, annoyance - dist * 0.01);
		}
	}

	function onPointerUp() {
		pressed = false;
	}

	function onPointerLeave() {
		pressed = false;
		pointer = null;
	}

	// The cat watches the toy.
	const lookAt = $derived(tool === 'play' && pointer ? pointer : null);
	const hissExpression = $derived(action === 'hissing' ? ('grumpy' as const) : null);
	const bowlFood = $derived(Math.max(0, Math.min(1, (feedingUntil - t) / 2.4)));

	function meterColor(v: number): string {
		return v >= 60 ? '#5fcf80' : v >= 30 ? '#ffc94d' : '#ff7f8f';
	}
</script>

<svelte:head>
	<title>{name} · Rainbow Smiles Funtime Place</title>
</svelte:head>

<main>
	<header>
		<a class="pill" href="/">🏠 My cats</a>
		{#if saved}<a class="pill" href="/design?id={saved.id}">✏️ Change look</a>{/if}
	</header>

	{#if notFound}
		<p class="message">We couldn't find that cat. <a href="/">Back to My cats</a></p>
	{:else if cat && care && layout}
		<div class="room">
			<section class="stage-card">
				<div class="name-banner">{name}</div>
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="stage"
					class:tool-cursor={tool !== 'pet'}
					bind:this={stage}
					onpointerdown={onPointerDown}
					onpointermove={onPointerMove}
					onpointerup={onPointerUp}
					onpointerleave={onPointerLeave}
				>
					<CatView {cat} {t} {action} {lookAt} expression={hissExpression} />
					<svg class="overlay" viewBox="0 0 400 400" aria-hidden="true">
						{#if t < feedingUntil}
							<g transform="translate({layout.head.x} 380)">
								{#each Array.from({ length: Math.ceil(bowlFood * 5) }, (_, i) => i) as i (i)}
									<ellipse
										cx={-24 + i * 12}
										cy="-10"
										rx="7"
										ry="5"
										fill="#ff9f6b"
										stroke="#3b2a40"
										stroke-width="2"
									/>
								{/each}
								<path
									d="M -40 -8 L 40 -8 Q 36 14 0 14 Q -36 14 -40 -8 Z"
									fill="#ff7fb0"
									stroke="#3b2a40"
									stroke-width="3"
								/>
								<path d="M -26 2 L 26 2" stroke="white" stroke-width="3" opacity="0.6" />
							</g>
						{/if}

						{#if wants.length && !action}
							{@const bx = Math.min(layout.head.x + layout.head.s * 1.25, 350)}
							{@const by = Math.max(layout.head.y - layout.head.s * 1.45, 45)}
							<g transform="translate({bx} {by + 3 * Math.sin(t * 3)})">
								<circle cx="-30" cy="38" r="5" fill="white" stroke="#3b2a40" stroke-width="2" />
								<circle cx="-18" cy="26" r="8" fill="white" stroke="#3b2a40" stroke-width="2" />
								<ellipse
									cx="10"
									cy="0"
									rx="34"
									ry="26"
									fill="white"
									stroke="#3b2a40"
									stroke-width="3"
								/>
								<text x="10" y="11" font-size="30" text-anchor="middle">
									{NEED_INFO[wants[0]].icon}
								</text>
							</g>
						{/if}

						{#each particles as p (p.id)}
							{@const age = t - p.born}
							{#if age < 1.5}
								<text
									x={p.x + (p.kind === 'tuft' ? age * 30 : 0)}
									y={p.y - age * 40}
									opacity={1 - age / 1.5}
									font-size={p.kind === 'heart' ? 30 : 20}
									text-anchor="middle"
									fill={p.kind === 'heart'
										? '#ff5c9a'
										: p.kind === 'sparkle'
											? '#ffc400'
											: cat.color}
									stroke={p.kind === 'tuft' ? '#3b2a40' : 'none'}
									stroke-width="1"
									>{p.kind === 'heart' ? '♥' : p.kind === 'sparkle' ? '✦' : '●'}</text
								>
							{/if}
						{/each}

						{#if pointer && tool === 'play'}
							<!-- feather wand -->
							<path
								d="M 420 -20 Q {pointer.x + 60} {pointer.y - 120} {pointer.x} {pointer.y}"
								fill="none"
								stroke="#8a5a3c"
								stroke-width="4"
							/>
							<g transform="translate({pointer.x} {pointer.y}) rotate({20 * Math.sin(t * 9)})">
								<ellipse
									cx="0"
									cy="18"
									rx="8"
									ry="22"
									fill="#ff7fb0"
									stroke="#3b2a40"
									stroke-width="2"
								/>
								<ellipse
									cx="-10"
									cy="14"
									rx="6"
									ry="18"
									fill="#7ad3ff"
									stroke="#3b2a40"
									stroke-width="2"
									transform="rotate(25)"
								/>
								<ellipse
									cx="10"
									cy="14"
									rx="6"
									ry="18"
									fill="#ffd43b"
									stroke="#3b2a40"
									stroke-width="2"
									transform="rotate(-25)"
								/>
							</g>
						{:else if pointer && tool === 'brush'}
							<g transform="translate({pointer.x} {pointer.y}) rotate(-30)">
								<rect
									x="-6"
									y="0"
									width="12"
									height="46"
									rx="6"
									fill="#c98b5a"
									stroke="#3b2a40"
									stroke-width="2.5"
								/>
								<rect
									x="-24"
									y="-22"
									width="48"
									height="24"
									rx="10"
									fill="#ff9cc4"
									stroke="#3b2a40"
									stroke-width="2.5"
								/>
								{#each [-16, -8, 0, 8, 16] as x (x)}
									<path d="M {x} -22 L {x} -32" stroke="#3b2a40" stroke-width="2.5" />
								{/each}
							</g>
						{/if}
					</svg>
				</div>
				{#if message}<p class="message">{message}</p>{/if}
			</section>

			<section class="panel">
				<div class="meters">
					{#each [{ label: 'Food', icon: '🐟', value: care.fullness }, { label: 'Play', icon: '🪶', value: care.fun }, { label: 'Brushed', icon: '🪮', value: care.tidy }] as m (m.label)}
						<div class="meter">
							<span class="meter-icon">{m.icon}</span>
							<span class="meter-label">{m.label}</span>
							<span class="bar">
								<span class="fill" style="width: {m.value}%; background: {meterColor(m.value)}"
								></span>
							</span>
						</div>
					{/each}
				</div>

				<div class="tools">
					<button class="tool" class:busy={t < feedingUntil} onclick={feed}>
						<span class="tool-icon">🐟</span>Feed
					</button>
					<button class="tool" class:active={tool === 'play'} onclick={() => chooseTool('play')}>
						<span class="tool-icon">🪶</span>Play
					</button>
					<button class="tool" class:active={tool === 'brush'} onclick={() => chooseTool('brush')}>
						<span class="tool-icon">🪮</span>Brush
					</button>
					<button class="tool" class:active={tool === 'pet'} onclick={() => chooseTool('pet')}>
						<span class="tool-icon">✋</span>Pet
					</button>
				</div>
				<p class="hint">
					{#if tool === 'play'}Wave the feather around {name}!
					{:else if tool === 'brush'}Rub the brush over {name}'s fur!
					{:else}Tap or stroke {name} to pet. Not too much!{/if}
				</p>

				<h2>Your favorite stuff</h2>
				<div class="stuff">
					{#each STUFF as item (item)}
						{@const mess = care.messes.find((m) => m.item === item)?.kind ?? null}
						<button
							class="thing"
							class:messy={mess}
							disabled={!mess}
							onclick={() => clean(item)}
							aria-label={mess ? `Clean up your ${STUFF_LABELS[item]}` : STUFF_LABELS[item]}
						>
							<StuffView {item} {mess} {t} />
							{#if mess}<span class="clean-tag">🧽 Tap to clean</span>{/if}
						</button>
					{/each}
				</div>
			</section>
		</div>
	{:else}
		<p class="message">Finding your cat…</p>
	{/if}
</main>

<style>
	main {
		max-width: 1200px;
		margin: 0 auto;
		padding: 12px 16px 32px;
	}
	header {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
	}
	.pill {
		font-size: 1.15rem;
		font-weight: 600;
		text-decoration: none;
		color: inherit;
		padding: 6px 14px;
		border-radius: 999px;
		background: #fff;
		box-shadow: 0 2px 8px #e9b6d455;
	}
	.room {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		gap: 20px;
		margin-top: 12px;
	}
	@media (max-width: 800px) {
		.room {
			grid-template-columns: 1fr;
		}
	}
	.stage-card,
	.panel {
		background: var(--card);
		border-radius: 28px;
		box-shadow: 0 6px 24px #e9b6d455;
		padding: 16px;
	}
	.stage-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
	}
	.name-banner {
		font-size: clamp(1.6rem, 5vw, 2.4rem);
		font-weight: 700;
		padding: 2px 26px;
		border-radius: 999px;
		background: #fff;
		border: 4px solid #ffd1e6;
	}
	.stage {
		position: relative;
		width: 100%;
		max-width: 520px;
		aspect-ratio: 1;
		border-radius: 24px;
		overflow: hidden;
		touch-action: none;
		user-select: none;
	}
	.stage.tool-cursor {
		cursor: none;
	}
	.overlay {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}
	.message {
		margin: 4px 0 0;
		font-size: 1.3rem;
		font-weight: 600;
		text-align: center;
	}
	.meters {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.meter {
		display: grid;
		grid-template-columns: 2.2rem 5.5rem 1fr;
		align-items: center;
		font-size: 1.2rem;
		font-weight: 600;
	}
	.meter-icon {
		font-size: 1.6rem;
	}
	.bar {
		height: 22px;
		border-radius: 999px;
		background: #f3e8f6;
		overflow: hidden;
	}
	.fill {
		display: block;
		height: 100%;
		border-radius: 999px;
		transition:
			width 0.3s,
			background 0.3s;
	}
	.tools {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 10px;
		margin-top: 16px;
	}
	.tool {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		font-size: 1.15rem;
		font-weight: 700;
		padding: 10px 4px;
		border-radius: 20px;
		border: 4px solid #f1e4f5;
		background: #fff;
		cursor: pointer;
	}
	.tool-icon {
		font-size: 2.2rem;
	}
	.tool.active {
		border-color: var(--accent);
		background: #fff0f7;
	}
	.tool.busy {
		opacity: 0.6;
	}
	.hint {
		font-size: 1.1rem;
		opacity: 0.8;
	}
	h2 {
		font-size: 1.4rem;
		margin: 16px 0 8px;
	}
	.stuff {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 10px;
	}
	.thing {
		position: relative;
		aspect-ratio: 1;
		padding: 6px;
		border-radius: 18px;
		border: 4px solid #f1e4f5;
		background: #fff;
	}
	.thing.messy {
		border-color: #b6e39b;
		cursor: pointer;
		animation: wobble 1.2s ease-in-out infinite;
	}
	.thing:disabled {
		color: inherit;
	}
	.clean-tag {
		position: absolute;
		left: 50%;
		bottom: -12px;
		transform: translateX(-50%);
		white-space: nowrap;
		font-size: 0.8rem;
		font-weight: 700;
		background: #fff;
		border-radius: 999px;
		padding: 2px 8px;
		box-shadow: 0 2px 6px #0002;
	}
	@keyframes wobble {
		0%,
		100% {
			transform: rotate(0);
		}
		25% {
			transform: rotate(-3deg);
		}
		75% {
			transform: rotate(3deg);
		}
	}
</style>
