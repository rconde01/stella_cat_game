import { randomUUID } from 'node:crypto';
import { sanitizeCat } from '../cat/sanitize';
import type { SavedCat } from '../cat/store';
import type { Cat } from '../cat/types';
import { db } from './db';

/** Saved cats belonging to one user. Every query is scoped by user id. */

export const MAX_CATS_PER_USER = 100;

function toSavedCat(row: Record<string, unknown>): SavedCat {
	return {
		id: String(row.id),
		cat: sanitizeCat(JSON.parse(String(row.data))),
		updatedAt: Number(row.updated_at)
	};
}

export async function listCats(userId: string): Promise<SavedCat[]> {
	const client = await db();
	const { rows } = await client.execute({
		sql: 'SELECT id, data, updated_at FROM cats WHERE user_id = ? ORDER BY updated_at DESC',
		args: [userId]
	});
	return rows.map((r) => toSavedCat(r));
}

/** Returns null when the user already has the maximum number of cats. */
export async function createCat(userId: string, raw: unknown): Promise<SavedCat | null> {
	const client = await db();
	const { rows } = await client.execute({
		sql: 'SELECT COUNT(*) AS n FROM cats WHERE user_id = ?',
		args: [userId]
	});
	if (Number(rows[0].n) >= MAX_CATS_PER_USER) return null;
	const saved: SavedCat = { id: randomUUID(), cat: sanitizeCat(raw), updatedAt: Date.now() };
	await client.execute({
		sql: 'INSERT INTO cats (id, user_id, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
		args: [saved.id, userId, JSON.stringify(saved.cat), saved.updatedAt, saved.updatedAt]
	});
	return saved;
}

/** Returns null if the cat doesn't exist or isn't this user's. */
export async function updateCat(
	userId: string,
	id: string,
	raw: unknown
): Promise<SavedCat | null> {
	const client = await db();
	const cat: Cat = sanitizeCat(raw);
	const updatedAt = Date.now();
	const result = await client.execute({
		sql: 'UPDATE cats SET data = ?, updated_at = ? WHERE id = ? AND user_id = ?',
		args: [JSON.stringify(cat), updatedAt, id, userId]
	});
	return result.rowsAffected === 1 ? { id, cat, updatedAt } : null;
}

export async function deleteCat(userId: string, id: string): Promise<void> {
	const client = await db();
	await client.execute({
		sql: 'DELETE FROM cats WHERE id = ? AND user_id = ?',
		args: [id, userId]
	});
}
