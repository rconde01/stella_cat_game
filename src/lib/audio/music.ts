import { audio } from './engine';

/**
 * A cheerful 8-bar loop, synthesized. Notes are scheduled slightly ahead of time with a
 * look-ahead timer so playback stays steady even when the page is busy.
 */

const BPM = 104;
const STEP = 60 / BPM / 2; // one eighth note, in seconds

// Melody, one entry per eighth note (MIDI note numbers; null = rest).
// prettier-ignore
const MELODY: (number | null)[] = [
	76, null, 79, null, 81, 79, 76, null, //  C
	72, null, 76, null, 74, 72, 69, null, //  Am
	69, 72, 77, null, 76, null, 72, null, //  F
	74, null, 79, null, 77, 76, 74, null, //  G
	76, 79, 84, null, 83, null, 79, null, //  C
	81, null, 79, 76, null, 72, 74, null, //  Am
	72, null, 69, null, 71, null, 74, null, // F  G
	72, null, null, null, 67, null, 72, null // C
];

/** Chord per half bar (root note for the bass, then chord tones for the sparkly arpeggio). */
// prettier-ignore
const CHORDS: number[][] = [
	[48, 60, 64, 67], [48, 60, 64, 67], // C
	[45, 57, 60, 64], [45, 57, 60, 64], // Am
	[41, 57, 60, 65], [41, 57, 60, 65], // F
	[43, 59, 62, 67], [43, 59, 62, 67], // G
	[48, 60, 64, 67], [48, 60, 64, 67], // C
	[45, 57, 60, 64], [45, 57, 60, 64], // Am
	[41, 57, 60, 65], [43, 59, 62, 67], // F G
	[48, 60, 64, 67], [48, 60, 64, 67] //  C
];

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

let timer: ReturnType<typeof setInterval> | null = null;
let step = 0;
let nextTime = 0;

function note(type: OscillatorType, midi: number, at: number, dur: number, peak: number): void {
	const a = audio();
	if (!a) return;
	const osc = a.ctx.createOscillator();
	osc.type = type;
	osc.frequency.value = hz(midi);
	const g = a.ctx.createGain();
	g.gain.setValueAtTime(0.0001, at);
	g.gain.exponentialRampToValueAtTime(peak, at + 0.02);
	g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
	osc.connect(g).connect(a.music);
	osc.start(at);
	osc.stop(at + dur + 0.05);
}

function scheduleStep(i: number, at: number): void {
	const melody = MELODY[i];
	if (melody !== null) {
		const held = MELODY[(i + 1) % MELODY.length] === null ? 2 : 1;
		note('triangle', melody, at, STEP * held * 0.95, 0.5);
	}
	const chord = CHORDS[Math.floor(i / 4)];
	if (i % 4 === 0) note('sine', chord[0], at, STEP * 3.6, 0.6); // bass on each half bar
	if (i % 2 === 1) note('sine', chord[1 + ((i >> 1) % 3)] + 12, at, STEP * 1.5, 0.12); // sparkle
}

export function startMusic(): void {
	const a = audio();
	if (!a || timer) return;
	step = 0;
	nextTime = a.ctx.currentTime + 0.1;
	timer = setInterval(() => {
		while (nextTime < a.ctx.currentTime + 0.15) {
			scheduleStep(step, nextTime);
			nextTime += STEP;
			step = (step + 1) % MELODY.length;
		}
	}, 25);
}

export function stopMusic(): void {
	if (timer) clearInterval(timer);
	timer = null;
}
