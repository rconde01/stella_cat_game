import {
	COAT_COLORS,
	DEFAULT_CAT,
	EYE_COLORS,
	HIGHLIGHT_COLORS,
	toggleAccessory,
	type Option
} from './options';
import {
	ACCESSORIES,
	BACKGROUNDS,
	DISPOSITIONS,
	PATTERNS,
	POSES,
	SHAPES,
	type Accessory,
	type Cat
} from './types';

/** Where cats are saved. Swap the implementation for a server-backed one later; the UI won't change. */
export interface CatStore {
	load(): Cat | null;
	save(cat: Cat): void;
}

const KEY = 'rainbow-smiles:cat';

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
	return allowed.includes(value as T) ? (value as T) : fallback;
}

function colorOf(value: unknown, options: Option<string>[], fallback: string): string {
	return oneOf(
		value,
		options.map((o) => o.id),
		fallback
	);
}

/** Turn anything (e.g. old or hand-edited saved data) into a valid Cat. */
export function sanitizeCat(raw: unknown): Cat {
	const r = (raw ?? {}) as Partial<Record<keyof Cat, unknown>>;
	const d = DEFAULT_CAT;
	return {
		name: typeof r.name === 'string' ? r.name.slice(0, 30) : d.name,
		shape: oneOf(r.shape, SHAPES, d.shape),
		pose: oneOf(r.pose, POSES, d.pose),
		pattern: oneOf(r.pattern, PATTERNS, d.pattern),
		color: colorOf(r.color, COAT_COLORS, d.color),
		highlight: colorOf(r.highlight, HIGHLIGHT_COLORS, d.highlight),
		eyeColor: colorOf(r.eyeColor, EYE_COLORS, d.eyeColor),
		disposition: oneOf(r.disposition, DISPOSITIONS, d.disposition),
		// Re-adding one at a time keeps the one-per-slot rule even for bad data.
		accessories: (Array.isArray(r.accessories) ? r.accessories : [])
			.filter((a): a is Accessory => ACCESSORIES.includes(a))
			.reduce<Accessory[]>((worn, a) => (worn.includes(a) ? worn : toggleAccessory(worn, a)), []),
		background: oneOf(r.background, BACKGROUNDS, d.background)
	};
}

export const localCatStore: CatStore = {
	load() {
		try {
			const json = localStorage.getItem(KEY);
			return json ? sanitizeCat(JSON.parse(json)) : null;
		} catch {
			return null;
		}
	},
	save(cat) {
		try {
			localStorage.setItem(KEY, JSON.stringify(cat));
		} catch {
			// Storage can be unavailable (private mode, quota); the game still works without saving.
		}
	}
};
