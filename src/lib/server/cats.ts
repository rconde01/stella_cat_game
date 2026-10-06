import { randomUUID } from 'node:crypto';
import { sanitizeCare } from '../care/care';
import { sanitizeCat } from '../cat/sanitize';
import type { CatPatch, SavedCat } from '../cat/store';
import { db } from './db';

/** Saved cats belonging to one user. Every query is scoped by user id. */

export const MAX_CATS_PER_USER = 100;

function toSavedCat(row: Record<string, unknown>): SavedCat {
	return {
		id: String(row.id),
		cat: sanitizeCat(JSON.parse(String(row.data))),
		care: sanitizeCare(row.care ? JSON.parse(String(row.care)) : null, Date.now()),
		createdAt: Number(row.created_at)
	};
}

export async function listCats(userId: string): Promise<SavedCat[]> {
	const client = await db();
	const { rows } = await client.execute({
		sql: 'SELECT id, data, care, created_at FROM cats WHERE user_id = ? ORDER BY created_at',
		args: [userId]
	});
	return rows.map((r) => toSavedCat(r));
}

/** Returns null when the user already has the maximum number of cats. */
export async function createCat(
	userId: string,
	body: { cat?: unknown; care?: unknown }
): Promise<SavedCat | null> {
	const client = await db();
	const { rows } = await client.execute({
		sql: 'SELECT COUNT(*) AS n FROM cats WHERE user_id = ?',
		args: [userId]
	});
	if (Number(rows[0].n) >= MAX_CATS_PER_USER) return null;
	const now = Date.now();
	const saved: SavedCat = {
		id: randomUUID(),
		cat: sanitizeCat(body.cat),
		care: sanitizeCare(body.care, now),
		createdAt: now
	};
	await client.execute({
		sql: `INSERT INTO cats (id, user_id, data, care, created_at, updated_at)
			VALUES (?, ?, ?, ?, ?, ?)`,
		args: [saved.id, userId, JSON.stringify(saved.cat), JSON.stringify(saved.care), now, now]
	});
	return saved;
}

/** Updates whichever parts are given. Returns false if the cat doesn't exist or isn't this user's. */
export async function updateCat(
	userId: string,
	id: string,
	patch: { [K in keyof CatPatch]?: unknown }
): Promise<boolean> {
	const sets: string[] = ['updated_at = ?'];
	const args: (string | number)[] = [Date.now()];
	if (patch.cat !== undefined) {
		sets.push('data = ?');
		args.push(JSON.stringify(sanitizeCat(patch.cat)));
	}
	if (patch.care !== undefined) {
		sets.push('care = ?');
		args.push(JSON.stringify(sanitizeCare(patch.care, Date.now())));
	}
	const client = await db();
	const result = await client.execute({
		sql: `UPDATE cats SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`,
		args: [...args, id, userId]
	});
	return result.rowsAffected === 1;
}

export async function deleteCat(userId: string, id: string): Promise<void> {
	const client = await db();
	await client.execute({
		sql: 'DELETE FROM cats WHERE id = ? AND user_id = ?',
		args: [id, userId]
	});
}
