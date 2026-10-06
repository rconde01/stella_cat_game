/**
 * Training levels and battle record. Four traits, each trained by its own mini-game.
 */

export const TRAITS = ['speed', 'strength', 'agility', 'smarts'] as const;
export type Trait = (typeof TRAITS)[number];

export const TRAIT_INFO: Record<
	Trait,
	{ label: string; icon: string; game: string; move: string }
> = {
	speed: { label: 'Speed', icon: '🏃', game: 'Mouse Chase', move: 'Zoomies Dash' },
	strength: { label: 'Strength', icon: '💪', game: 'Tug of War', move: 'Mighty Paw' },
	agility: { label: 'Agility', icon: '🤸', game: 'Hop Hop Hop', move: 'Backflip Dodge' },
	smarts: { label: 'Smarts', icon: '🧠', game: 'Copycat', move: 'Sneaky Trick' }
};

export const MAX_LEVEL = 20;

export interface TraitProgress {
	level: number;
	/** XP toward the next level. */
	xp: number;
}

export interface Progress {
	traits: Record<Trait, TraitProgress>;
	wins: number;
	losses: number;
}

export function freshProgress(): Progress {
	return {
		traits: {
			speed: { level: 1, xp: 0 },
			strength: { level: 1, xp: 0 },
			agility: { level: 1, xp: 0 },
			smarts: { level: 1, xp: 0 }
		},
		wins: 0,
		losses: 0
	};
}

/** XP needed to go from `level` to `level + 1`. Grows slowly so early levels come quickly. */
export function xpToNext(level: number): number {
	return 40 + level * 20;
}

/** The cat's overall level: starts at 1 and goes up by one for every trait level gained. */
export function catLevel(p: Progress): number {
	return TRAITS.reduce((sum, t) => sum + p.traits[t].level, 0) - TRAITS.length + 1;
}

/** XP earned from a training game, given how well it went (0–100). Always worth something. */
export function xpForScore(score: number): number {
	return Math.round(15 + Math.max(0, Math.min(100, score)) * 0.6);
}

export function addXp(
	p: Progress,
	trait: Trait,
	xp: number
): { progress: Progress; levelsGained: number } {
	let { level, xp: current } = p.traits[trait];
	current += xp;
	let levelsGained = 0;
	while (level < MAX_LEVEL && current >= xpToNext(level)) {
		current -= xpToNext(level);
		level++;
		levelsGained++;
	}
	if (level >= MAX_LEVEL) current = 0;
	return {
		progress: { ...p, traits: { ...p.traits, [trait]: { level, xp: current } } },
		levelsGained
	};
}

export function sanitizeProgress(raw: unknown): Progress {
	const fresh = freshProgress();
	if (!raw || typeof raw !== 'object') return fresh;
	const r = raw as {
		traits?: Record<string, Partial<TraitProgress>>;
		wins?: unknown;
		losses?: unknown;
	};
	const whole = (v: unknown, min: number, max: number, fallback: number) =>
		typeof v === 'number' && Number.isFinite(v)
			? Math.max(min, Math.min(max, Math.floor(v)))
			: fallback;
	const traits = { ...fresh.traits };
	for (const t of TRAITS) {
		const level = whole(r.traits?.[t]?.level, 1, MAX_LEVEL, 1);
		traits[t] = { level, xp: whole(r.traits?.[t]?.xp, 0, xpToNext(level) - 1, 0) };
	}
	return {
		traits,
		wins: whole(r.wins, 0, 1_000_000, 0),
		losses: whole(r.losses, 0, 1_000_000, 0)
	};
}
