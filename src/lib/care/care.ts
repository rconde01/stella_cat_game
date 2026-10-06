/**
 * Looking after a cat, Tamagotchi-style. Pure functions of time so the same rules run live and when
 * catching up after the player has been away.
 *
 * The cat can never get sick or die. Neglect only leads to mischief: when a need stays low for a
 * while, the cat poops or pees on one of the player's favorite things.
 */

export const STUFF = ['teddy', 'slippers', 'backpack', 'pillow'] as const;
export type Stuff = (typeof STUFF)[number];

export const STUFF_LABELS: Record<Stuff, string> = {
	teddy: 'teddy bear',
	slippers: 'slippers',
	backpack: 'backpack',
	pillow: 'pillow'
};

export type MessKind = 'poop' | 'pee';

export interface Mess {
	item: Stuff;
	kind: MessKind;
}

export interface Care {
	/** 0 = starving-ish (but never harmful), 100 = stuffed. */
	fullness: number;
	/** How played-with the cat feels. */
	fun: number;
	/** How brushed / shiny the fur is. */
	tidy: number;
	/** Minutes of neglect built up toward the next mess. */
	mischief: number;
	messes: Mess[];
	/** When these numbers were last brought up to date (ms since epoch). */
	updatedAt: number;
}

export type Need = 'food' | 'play' | 'brush';

/** How fast each need goes down, in points per minute (100 → 0 in 3h / 2h / 5h). */
export const DECAY = { fullness: 100 / 180, fun: 100 / 120, tidy: 100 / 300 };
/** Below this, a need counts as neglected and builds mischief. */
export const LOW = 20;
/** Below this, the cat asks for it (meows, thought bubble). */
export const WANTS = 45;
/** Minutes of neglect per mess. */
export const MINUTES_PER_MESS = 12;
/** Don't simulate more than this when catching up (the cat can't make more messes than items anyway). */
const MAX_CATCH_UP_MINUTES = 3 * 24 * 60;

const clamp = (n: number) => Math.max(0, Math.min(100, n));

/** Small deterministic random number generator (mulberry32). */
function seeded(seed: number): () => number {
	let a = Math.floor(seed / 1000) >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let r = Math.imul(a ^ (a >>> 15), 1 | a);
		r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
		return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
	};
}

export function freshCare(now: number): Care {
	return { fullness: 90, fun: 90, tidy: 90, mischief: 0, messes: [], updatedAt: now };
}

/** Any input → valid Care (missing or broken care becomes a fresh, happy cat). */
export function sanitizeCare(raw: unknown, now: number): Care {
	if (!raw || typeof raw !== 'object') return freshCare(now);
	const r = raw as Partial<Record<keyof Care, unknown>>;
	const num = (v: unknown, fallback: number) =>
		typeof v === 'number' && Number.isFinite(v) ? v : fallback;
	const messes = (Array.isArray(r.messes) ? r.messes : [])
		.filter((m): m is Mess => STUFF.includes(m?.item) && (m?.kind === 'poop' || m?.kind === 'pee'))
		.filter((m, i, all) => all.findIndex((o) => o.item === m.item) === i)
		.map((m) => ({ item: m.item, kind: m.kind }));
	return {
		fullness: clamp(num(r.fullness, 90)),
		fun: clamp(num(r.fun, 90)),
		tidy: clamp(num(r.tidy, 90)),
		mischief: Math.max(0, num(r.mischief, 0)),
		messes,
		updatedAt: Math.min(num(r.updatedAt, now), now)
	};
}

/**
 * Bring care up to date. Steps minute by minute: needs go down, and while any need is low the cat
 * builds up mischief until it makes a mess on a clean item. Returns the messes made along the way.
 */
export function advanceCare(care: Care, now: number): { care: Care; newMesses: Mess[] } {
	const minutes = Math.min(Math.floor((now - care.updatedAt) / 60_000), MAX_CATCH_UP_MINUTES);
	if (minutes <= 0) return { care, newMesses: [] };

	let { fullness, fun, tidy, mischief } = care;
	const messes = [...care.messes];
	const newMesses: Mess[] = [];
	for (let i = 0; i < minutes; i++) {
		fullness = clamp(fullness - DECAY.fullness);
		fun = clamp(fun - DECAY.fun);
		tidy = clamp(tidy - DECAY.tidy);
		if (Math.min(fullness, fun, tidy) < LOW) mischief++;
		if (mischief >= MINUTES_PER_MESS) {
			mischief = 0;
			const clean = STUFF.filter((s) => !messes.some((m) => m.item === s));
			if (clean.length) {
				// "Random" choice seeded by the minute it happens, so catching up in one go or in small
				// steps (or on different pages) always makes the same mess.
				const random = seeded(care.updatedAt + (i + 1) * 60_000);
				const mess: Mess = {
					item: clean[Math.floor(random() * clean.length)],
					kind: random() < 0.5 ? 'poop' : 'pee'
				};
				messes.push(mess);
				newMesses.push(mess);
			}
		}
	}
	// Keep the leftover part of a minute so time isn't lost between frequent updates.
	const updatedAt =
		now - care.updatedAt > MAX_CATCH_UP_MINUTES * 60_000 ? now : care.updatedAt + minutes * 60_000;
	return { care: { fullness, fun, tidy, mischief, messes, updatedAt }, newMesses };
}

/** What the cat wants, most urgent first. */
export function needs(care: Care): Need[] {
	const list: [Need, number][] = [
		['food', care.fullness],
		['play', care.fun],
		['brush', care.tidy]
	];
	return list
		.filter(([, v]) => v < WANTS)
		.sort((a, b) => a[1] - b[1])
		.map(([n]) => n);
}

/** Happy when every need is well looked after. */
export function isHappy(care: Care): boolean {
	return Math.min(care.fullness, care.fun, care.tidy) >= 60;
}

export function addTo(care: Care, need: Need, amount: number): Care {
	const key = need === 'food' ? 'fullness' : need === 'play' ? 'fun' : 'tidy';
	const value = clamp(care[key] + amount);
	// Looking after the cat calms it down, so mischief builds back up from zero.
	return { ...care, [key]: value, mischief: Math.max(0, care.mischief - amount / 5) };
}

export function cleanUp(care: Care, item: Stuff): Care {
	return { ...care, messes: care.messes.filter((m) => m.item !== item) };
}
