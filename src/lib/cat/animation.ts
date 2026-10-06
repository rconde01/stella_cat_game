import type { Disposition } from './types';

/** Everything that moves, as a pure function of time (seconds) and the cat's disposition. */
export interface AnimState {
	t: number;
	/** Vertical body scale for breathing (around 1). */
	breath: number;
	/** Tail swing in radians. */
	tailSwing: number;
	/** 0 = eye fully open, 1 = closed. */
	blinkLeft: number;
	blinkRight: number;
	/** Ear rotation in degrees (positive = outward). */
	earLeft: number;
	earRight: number;
	/** Head rotation in degrees, added to the pose's tilt. */
	headTilt: number;
	/** Pupil offset in head units. */
	lookX: number;
	lookY: number;
}

/** Something the cat is doing right now (on its care page), on top of its mood. */
export type CatAction = 'eating' | 'purring' | 'hissing' | null;

/**
 * Adjust the mood's animation for an action, and point the eyes at `look` (pupil offset in head
 * units) if given.
 */
export function react(
	anim: AnimState,
	action: CatAction,
	look: { x: number; y: number } | null
): AnimState {
	const t = anim.t;
	const looked = look ? { ...anim, lookX: look.x, lookY: look.y } : anim;
	switch (action) {
		case 'eating':
			return { ...looked, headTilt: 4 * Math.sin(t * 7), lookY: 0.06 };
		case 'purring':
			return {
				...looked,
				tailSwing: 0.15 * Math.sin(t * 1.2),
				headTilt: 6,
				earLeft: 0,
				earRight: 0
			};
		case 'hissing':
			// Ears flat, tail bristling.
			return {
				...looked,
				earLeft: 45,
				earRight: 45,
				tailSwing: 0.2 * Math.sin(t * 25),
				headTilt: 0,
				blinkLeft: 0,
				blinkRight: 0
			};
		default:
			return looked;
	}
}

/** A short bump (0 → 1 → 0) lasting `dur` seconds, repeating every `period` seconds. */
function pulse(t: number, period: number, dur: number, offset = 0): number {
	const p = (((t + offset) % period) + period) % period;
	return p < dur ? Math.sin((p / dur) * Math.PI) : 0;
}

export function animate(disposition: Disposition, t: number): AnimState {
	const blink = pulse(t, 3.8, 0.2, 1.5);
	const base: AnimState = {
		t,
		breath: 1 + 0.012 * Math.sin(t * 2.1),
		tailSwing: 0,
		blinkLeft: blink,
		blinkRight: blink,
		earLeft: 12 * pulse(t, 7.1, 0.3, 2),
		earRight: 12 * pulse(t, 5.3, 0.3),
		headTilt: 0,
		lookX: 0,
		lookY: 0
	};

	switch (disposition) {
		case 'happy':
			return {
				...base,
				tailSwing: 0.3 * Math.sin(t * 1.8),
				headTilt: 4 * Math.sin(t * 1.3),
				lookX: 0.04 * Math.sin(t * 0.7)
			};
		case 'grumpy':
			return {
				...base,
				// Mostly still, with sharp annoyed flicks.
				tailSwing: 0.4 * Math.sin(t * 3) ** 7 + 0.04 * Math.sin(t),
				earLeft: 18 + base.earLeft,
				earRight: 18 + base.earRight,
				lookY: 0.02
			};
		case 'sleepy':
			return {
				...base,
				breath: 1 + 0.02 * Math.sin(t * 1.4),
				tailSwing: 0.08 * Math.sin(t * 0.8),
				headTilt: 3 * Math.sin(t * 0.9),
				blinkLeft: 1,
				blinkRight: 1
			};
		case 'silly':
			return {
				...base,
				tailSwing: 0.45 * Math.sin(t * 3.2),
				headTilt: 8 * Math.sin(t * 2.4),
				blinkLeft: 1,
				lookX: 0.05 * Math.sin(t * 2.4)
			};
		case 'shy':
			return {
				...base,
				tailSwing: 0.12 * Math.sin(t * 1.2),
				headTilt: -6 + 1.5 * Math.sin(t * 1.1),
				earLeft: 25 + base.earLeft,
				earRight: 25 + base.earRight,
				lookX: -0.07,
				lookY: 0.04
			};
	}
}
