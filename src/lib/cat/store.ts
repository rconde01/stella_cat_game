import { sanitizeCat } from './sanitize';
import type { Cat } from './types';

/**
 * Where a player's cats are kept. Logged-in players use the server (their account); guests use this
 * browser's localStorage. The UI only talks to the CatStore interface.
 */

export interface SavedCat {
	id: string;
	cat: Cat;
	updatedAt: number;
}

export interface CatStore {
	/** Newest first. */
	list(): Promise<SavedCat[]>;
	/** Creates the cat when `id` is null. */
	save(id: string | null, cat: Cat): Promise<SavedCat>;
	remove(id: string): Promise<void>;
}

const KEY = 'rainbow-smiles:cats';
/** The first version saved a single cat under this key. */
const OLD_SINGLE_CAT_KEY = 'rainbow-smiles:cat';

function readLocal(): SavedCat[] {
	try {
		const old = localStorage.getItem(OLD_SINGLE_CAT_KEY);
		if (old) {
			const migrated = [
				{ id: crypto.randomUUID(), cat: sanitizeCat(JSON.parse(old)), updatedAt: Date.now() }
			];
			writeLocal([...migrated, ...readLocalRaw()]);
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
	return raw.map((s: Partial<SavedCat>) => ({
		id: String(s.id),
		cat: sanitizeCat(s.cat),
		updatedAt: Number(s.updatedAt) || 0
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
		return readLocal().sort((a, b) => b.updatedAt - a.updatedAt);
	},
	async save(id, cat) {
		const saved: SavedCat = { id: id ?? crypto.randomUUID(), cat, updatedAt: Date.now() };
		writeLocal([saved, ...readLocal().filter((s) => s.id !== saved.id)]);
		return saved;
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
	save: (id, cat) =>
		id
			? api<SavedCat>(`/api/cats/${id}`, { method: 'PUT', body: JSON.stringify(cat) })
			: api<SavedCat>('/api/cats', { method: 'POST', body: JSON.stringify(cat) }),
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
	for (const saved of guestCats.reverse()) {
		await accountCatStore.save(null, saved.cat);
	}
	localCatStore.clear();
	return guestCats.length;
}
