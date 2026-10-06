/**
 * All game sounds, synthesized with the Web Audio API (no audio files).
 * Browsers only allow audio after the player interacts with the page, so the AudioContext is created
 * lazily by `unlock()` on the first tap/click (see settings.svelte.ts).
 */

let ctx: AudioContext | null = null;
let sfxBus: GainNode;
let musicBus: GainNode;
let whiteNoise: AudioBuffer;
let brownNoise: AudioBuffer;

export function audio(): { ctx: AudioContext; sfx: GainNode; music: GainNode } | null {
	return ctx ? { ctx, sfx: sfxBus, music: musicBus } : null;
}

export function unlock(): void {
	if (typeof window === 'undefined') return;
	if (!ctx) {
		ctx = new AudioContext();
		const master = ctx.createGain();
		master.gain.value = 0.9;
		master.connect(ctx.destination);
		sfxBus = ctx.createGain();
		sfxBus.connect(master);
		musicBus = ctx.createGain();
		musicBus.gain.value = 0.16;
		musicBus.connect(master);
		whiteNoise = makeNoise(ctx, false);
		brownNoise = makeNoise(ctx, true);
		document.addEventListener('visibilitychange', () => {
			if (document.hidden) ctx?.suspend();
			else ctx?.resume();
		});
	}
	if (ctx.state === 'suspended') ctx.resume();
}

export function setVolumes(sfxOn: boolean, musicOn: boolean): void {
	if (!ctx) return;
	sfxBus.gain.setTargetAtTime(sfxOn ? 1 : 0, ctx.currentTime, 0.05);
	musicBus.gain.setTargetAtTime(musicOn ? 0.16 : 0, ctx.currentTime, 0.3);
}

function makeNoise(c: AudioContext, brown: boolean): AudioBuffer {
	const buffer = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
	const data = buffer.getChannelData(0);
	let last = 0;
	for (let i = 0; i < data.length; i++) {
		const white = Math.random() * 2 - 1;
		if (brown) {
			last = (last + 0.02 * white) / 1.02;
			data[i] = last * 3.5;
		} else {
			data[i] = white;
		}
	}
	return buffer;
}

function noise(c: AudioContext, brown = false, loop = false): AudioBufferSourceNode {
	const src = c.createBufferSource();
	src.buffer = brown ? brownNoise : whiteNoise;
	src.loop = loop;
	return src;
}

/** A gain node with an attack / hold / release envelope. */
function envelope(
	c: AudioContext,
	at: number,
	peak: number,
	attack: number,
	hold: number,
	release: number
) {
	const g = c.createGain();
	g.gain.setValueAtTime(0.0001, at);
	g.gain.exponentialRampToValueAtTime(peak, at + attack);
	g.gain.setValueAtTime(peak, at + attack + hold);
	g.gain.exponentialRampToValueAtTime(0.0001, at + attack + hold + release);
	return g;
}

/**
 * Meow: a buzzy voice gliding up then down ("mee-OW"), shaped by two vowel-like filters that sweep
 * from an "ee" toward an "ow". `pitch` > 1 for kittens, < 1 for a grumpier cat.
 */
export function meow(pitch = 1): void {
	if (!ctx) return;
	const t = ctx.currentTime + 0.01;
	const dur = 0.55 + Math.random() * 0.2;
	const base = 520 * pitch * (0.92 + Math.random() * 0.16);

	const osc = ctx.createOscillator();
	osc.type = 'sawtooth';
	osc.frequency.setValueAtTime(base * 0.8, t);
	osc.frequency.exponentialRampToValueAtTime(base * 1.35, t + dur * 0.3);
	osc.frequency.exponentialRampToValueAtTime(base * 0.75, t + dur);

	const vibrato = ctx.createOscillator();
	vibrato.frequency.value = 6;
	const vibratoDepth = ctx.createGain();
	vibratoDepth.gain.value = base * 0.02;
	vibrato.connect(vibratoDepth).connect(osc.frequency);

	const f1 = ctx.createBiquadFilter();
	f1.type = 'bandpass';
	f1.Q.value = 6;
	f1.frequency.setValueAtTime(500, t);
	f1.frequency.linearRampToValueAtTime(1000, t + dur * 0.4);
	f1.frequency.linearRampToValueAtTime(700, t + dur);
	const f2 = ctx.createBiquadFilter();
	f2.type = 'bandpass';
	f2.Q.value = 8;
	f2.frequency.setValueAtTime(2300, t);
	f2.frequency.linearRampToValueAtTime(1400, t + dur);
	const f2Gain = ctx.createGain();
	f2Gain.gain.value = 0.6;

	const env = envelope(ctx, t, 0.5, 0.06, dur - 0.2, 0.14);
	osc.connect(f1).connect(env);
	osc.connect(f2).connect(f2Gain).connect(env);
	env.connect(sfxBus);
	osc.start(t);
	vibrato.start(t);
	osc.stop(t + dur + 0.1);
	vibrato.stop(t + dur + 0.1);
}

/** Hiss: a burst of airy high noise. */
export function hiss(): void {
	if (!ctx) return;
	const t = ctx.currentTime + 0.01;
	const src = noise(ctx);
	const hp = ctx.createBiquadFilter();
	hp.type = 'highpass';
	hp.frequency.value = 2500;
	const bp = ctx.createBiquadFilter();
	bp.type = 'bandpass';
	bp.frequency.value = 5000;
	bp.Q.value = 0.6;
	const env = envelope(ctx, t, 0.6, 0.04, 0.55, 0.35);
	src.connect(hp).connect(bp).connect(env).connect(sfxBus);
	src.start(t);
	src.stop(t + 1.1);
}

/**
 * Purr: low rumbling noise pulsing ~25 times a second. Returns a function that stops it.
 */
export function startPurr(): () => void {
	if (!ctx) return () => {};
	const c = ctx;
	const t = c.currentTime + 0.01;
	const src = noise(c, true, true);
	const lp = c.createBiquadFilter();
	lp.type = 'lowpass';
	lp.frequency.value = 350;
	const pulse = c.createGain();
	pulse.gain.value = 0.5;
	const lfo = c.createOscillator();
	lfo.frequency.value = 25;
	const lfoDepth = c.createGain();
	lfoDepth.gain.value = 0.5;
	lfo.connect(lfoDepth).connect(pulse.gain);
	// Breathing in and out: the purr swells slowly.
	const breath = c.createOscillator();
	breath.frequency.value = 0.6;
	const breathDepth = c.createGain();
	breathDepth.gain.value = 0.25;
	const level = c.createGain();
	level.gain.setValueAtTime(0.0001, t);
	level.gain.exponentialRampToValueAtTime(0.9, t + 0.4);
	breath.connect(breathDepth).connect(level.gain);
	src.connect(lp).connect(pulse).connect(level).connect(sfxBus);
	src.start(t);
	lfo.start(t);
	breath.start(t);
	let stopped = false;
	return () => {
		if (stopped) return;
		stopped = true;
		const end = c.currentTime;
		level.gain.cancelScheduledValues(end);
		level.gain.setTargetAtTime(0.0001, end, 0.15);
		for (const node of [src, lfo, breath]) node.stop(end + 0.8);
	};
}

function tone(
	type: OscillatorType,
	from: number,
	to: number,
	at: number,
	dur: number,
	peak: number
): void {
	if (!ctx) return;
	const osc = ctx.createOscillator();
	osc.type = type;
	osc.frequency.setValueAtTime(from, at);
	osc.frequency.exponentialRampToValueAtTime(to, at + dur);
	const env = envelope(ctx, at, peak, 0.01, dur * 0.4, dur * 0.6);
	osc.connect(env).connect(sfxBus);
	osc.start(at);
	osc.stop(at + dur + 0.05);
}

/** Munching sounds. */
export function nom(): void {
	if (!ctx) return;
	const t = ctx.currentTime + 0.01;
	for (let i = 0; i < 2; i++) tone('square', 220, 140, t + i * 0.11, 0.07, 0.12);
}

/** A soft brush stroke. */
export function swish(): void {
	if (!ctx) return;
	const t = ctx.currentTime + 0.01;
	const src = noise(ctx);
	const bp = ctx.createBiquadFilter();
	bp.type = 'bandpass';
	bp.Q.value = 1.5;
	bp.frequency.setValueAtTime(900, t);
	bp.frequency.exponentialRampToValueAtTime(2600, t + 0.22);
	const env = envelope(ctx, t, 0.15, 0.05, 0.08, 0.12);
	src.connect(bp).connect(env).connect(sfxBus);
	src.start(t);
	src.stop(t + 0.3);
}

/** Twinkly "all clean!" arpeggio. */
export function sparkle(): void {
	if (!ctx) return;
	const t = ctx.currentTime + 0.01;
	[1047, 1319, 1568, 2093].forEach((f, i) => tone('sine', f, f, t + i * 0.07, 0.3, 0.18));
}

/** A cheerful little "boop" for buttons. */
export function pop(): void {
	if (!ctx) return;
	tone('sine', 520, 880, ctx.currentTime + 0.01, 0.08, 0.2);
}

/** Uh-oh: a silly "plop" followed by a little "pfrrt". */
export function plop(): void {
	if (!ctx) return;
	const t = ctx.currentTime + 0.01;
	tone('sine', 420, 70, t, 0.22, 0.45);
	const osc = ctx.createOscillator();
	osc.type = 'sawtooth';
	osc.frequency.setValueAtTime(110, t + 0.3);
	osc.frequency.linearRampToValueAtTime(80, t + 0.65);
	const lp = ctx.createBiquadFilter();
	lp.type = 'lowpass';
	lp.frequency.value = 600;
	const flutter = ctx.createGain();
	const lfo = ctx.createOscillator();
	lfo.frequency.value = 28;
	const depth = ctx.createGain();
	depth.gain.value = 0.5;
	lfo.connect(depth).connect(flutter.gain);
	const env = envelope(ctx, t + 0.3, 0.3, 0.02, 0.2, 0.15);
	osc.connect(lp).connect(flutter).connect(env).connect(sfxBus);
	osc.start(t + 0.3);
	lfo.start(t + 0.3);
	osc.stop(t + 0.75);
	lfo.stop(t + 0.75);
}

/** Uh-oh: a trickle. */
export function trickle(): void {
	if (!ctx) return;
	const t = ctx.currentTime + 0.01;
	const src = noise(ctx);
	const bp = ctx.createBiquadFilter();
	bp.type = 'bandpass';
	bp.frequency.value = 2800;
	bp.Q.value = 3;
	const wobble = ctx.createGain();
	const lfo = ctx.createOscillator();
	lfo.frequency.value = 13;
	const depth = ctx.createGain();
	depth.gain.value = 0.5;
	lfo.connect(depth).connect(wobble.gain);
	const env = envelope(ctx, t, 0.3, 0.1, 1.0, 0.4);
	src.connect(bp).connect(wobble).connect(env).connect(sfxBus);
	src.start(t);
	lfo.start(t);
	src.stop(t + 1.6);
	lfo.stop(t + 1.6);
}

/** Mouse squeak (caught one!). */
export function squeak(): void {
	if (!ctx) return;
	const t = ctx.currentTime + 0.01;
	tone('sine', 1800, 2600, t, 0.08, 0.2);
	tone('sine', 2200, 3000, t + 0.09, 0.07, 0.15);
}

/** Springy jump. */
export function boing(): void {
	if (!ctx) return;
	tone('triangle', 220, 660, ctx.currentTime + 0.01, 0.25, 0.3);
}

/** A tug on the rope. */
export function tug(): void {
	if (!ctx) return;
	tone('square', 160, 110, ctx.currentTime + 0.01, 0.06, 0.08);
}

/** Bump into an obstacle. */
export function bonk(): void {
	if (!ctx) return;
	tone('sine', 300, 120, ctx.currentTime + 0.01, 0.15, 0.3);
}

/** The four Copycat notes (C E G C). */
export function note(index: number, dur = 0.35): void {
	if (!ctx) return;
	const f = [523, 659, 784, 1047][index] ?? 523;
	tone('triangle', f, f, ctx.currentTime + 0.01, dur, 0.3);
}

/** Ta-da! */
export function levelUp(): void {
	if (!ctx) return;
	const t = ctx.currentTime + 0.01;
	[523, 659, 784, 1047, 1319].forEach((f, i) => tone('square', f, f, t + i * 0.09, 0.2, 0.08));
	tone('triangle', 1047, 1047, t + 0.5, 0.6, 0.25);
}

/** A swipe and a thump, for a battle round. */
export function whoosh(): void {
	if (!ctx) return;
	const t = ctx.currentTime + 0.01;
	const src = noise(ctx);
	const bp = ctx.createBiquadFilter();
	bp.type = 'bandpass';
	bp.Q.value = 2;
	bp.frequency.setValueAtTime(400, t);
	bp.frequency.exponentialRampToValueAtTime(3000, t + 0.2);
	const env = envelope(ctx, t, 0.3, 0.05, 0.05, 0.12);
	src.connect(bp).connect(env).connect(sfxBus);
	src.start(t);
	src.stop(t + 0.3);
	tone('sine', 160, 50, t + 0.2, 0.18, 0.5);
}

/** Victory fanfare. */
export function cheer(): void {
	if (!ctx) return;
	const t = ctx.currentTime + 0.01;
	const tune = [523, 523, 523, 659, 784, 659, 784, 1047];
	const times = [0, 0.12, 0.24, 0.36, 0.6, 0.78, 0.9, 1.05];
	tune.forEach((f, i) =>
		tone('square', f, f, t + times[i], i === tune.length - 1 ? 0.6 : 0.14, 0.09)
	);
}

/** "Wah wah wah waaah" — sad but silly. */
export function sadTrombone(): void {
	if (!ctx) return;
	const t = ctx.currentTime + 0.01;
	[392, 370, 349].forEach((f, i) => tone('sawtooth', f, f * 0.97, t + i * 0.4, 0.35, 0.08));
	tone('sawtooth', 330, 300, t + 1.2, 1.0, 0.08);
}
