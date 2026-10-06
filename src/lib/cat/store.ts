import { sanitizeCare, type Care } from '../care/care';
import { sanitizeProgress, type Progress } from '../game/progress';
import { sanitizeCat } from './sanitize';
import type { Cat } from './types';

/**
 * Where a player's cats are kept. Logged-in players use the server (their account); guests use this
 * browser's localStorage. The UI only talks to the CatStore interface.
 *
 * A saved cat has independent parts: `cat` (how it looks, edited in the designer), `care` (food /
 * play / brushing, on the cat's page) and `progress` (training levels and battle record), so the
 * pages never overwrite each other.
 */

export interface SavedCat {
	id: string;
	cat: Cat;
	care: Care;
	progress: Progress;
	createdAt: number;
}

export interface CatPatch {
	cat?: Cat;
	care?: Care;
	progress?: Progress;
}

export interface CatStore {
	/** Oldest first, so cats stay in the same order. */
	list(): Promise<SavedCat[]>;
	create(cat: Cat, extras?: Omit<CatPatch, 'cat'>): Promise<SavedCat>;
	update(id: string, patch: CatPatch): Promise<void>;
	remove(id: string): Promise<void>;
}

const KEY = 'rainbow-smiles:cats';
/** The first version saved a single cat under this key. */
const OLD_SINGLE_CAT_KEY = 'rainbow-smiles:cat';

function readLocal(): SavedCat[] {
	try {
		const old = localStorage.getItem(OLD_SINGLE_CAT_KEY);
		if (old) {
			const now = Date.now();
			const migrated: SavedCat = {
				id: crypto.randomUUID(),
				cat: sanitizeCat(JSON.parse(old)),
				care: sanitizeCare(null, now),
				progress: sanitizeProgress(null),
				createdAt: now
			};
			writeLocal([migrated, ...readLocalRaw()]);
			localStorage.removeItem(OLD_SINGLE_CAT_KEY);
		}
		return readLocalRaw();
	} catch {
		return [];
	}
}

function readLocalRaw(): SavedCat[] {
	const raw: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]');
	if (!Array.isArray(raw)) return [];
	const now = Date.now();
	return raw.map((s: Partial<SavedCat> & { updatedAt?: number }) => ({
		id: String(s.id),
		cat: sanitizeCat(s.cat),
		care: sanitizeCare(s.care, now),
		progress: sanitizeProgress(s.progress),
		createdAt: Number(s.createdAt ?? s.updatedAt) || 0
	}));
}

function writeLocal(cats: SavedCat[]): void {
	try {
		localStorage.setItem(KEY, JSON.stringify(cats));
	} catch {
		// Storage can be unavailable (private mode, quota); the game still works without saving.
	}
}

export const localCatStore: CatStore & { clear(): void } = {
	async list() {
		return readLocal().sort((a, b) => a.createdAt - b.createdAt);
	},
	async create(cat, extras) {
		const now = Date.now();
		const saved: SavedCat = {
			id: crypto.randomUUID(),
			cat,
			care: extras?.care ?? sanitizeCare(null, now),
			progress: extras?.progress ?? sanitizeProgress(null),
			createdAt: now
		};
		writeLocal([...readLocal(), saved]);
		return saved;
	},
	async update(id, patch) {
		writeLocal(readLocal().map((s) => (s.id === id ? { ...s, ...patch } : s)));
	},
	async remove(id) {
		writeLocal(readLocal().filter((s) => s.id !== id));
	},
	clear() {
		writeLocal([]);
	}
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
	const res = await fetch(path, {
		...init,
		headers: { 'content-type': 'application/json', ...init?.headers }
	});
	if (!res.ok) throw new Error(`${init?.method ?? 'GET'} ${path} failed: ${res.status}`);
	return res.status === 204 ? (undefined as T) : res.json();
}

export const accountCatStore: CatStore = {
	list: () => api<SavedCat[]>('/api/cats'),
	create: (cat, extras) =>
		api<SavedCat>('/api/cats', { method: 'POST', body: JSON.stringify({ cat, ...extras }) }),
	update: (id, patch) =>
		api<void>(`/api/cats/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
	remove: (id) => api<void>(`/api/cats/${id}`, { method: 'DELETE' })
};

export function catStoreFor(user: { id: string } | null): CatStore {
	return user ? accountCatStore : localCatStore;
}

/**
 * After logging in, move any cats made as a guest on this device into the account.
 * Returns how many were moved.
 */
export async function moveGuestCatsToAccount(): Promise<number> {
	const guestCats = await localCatStore.list();
	for (const saved of guestCats) {
		await accountCatStore.create(saved.cat, { care: saved.care, progress: saved.progress });
	}
	localCatStore.clear();
	return guestCats.length;
}
