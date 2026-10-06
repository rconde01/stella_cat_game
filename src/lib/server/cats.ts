import { randomUUID } from 'node:crypto';
import { sanitizeCare } from '../care/care';
import { randomCat } from '../cat/options';
import { sanitizeCat } from '../cat/sanitize';
import type { CatPatch, SavedCat } from '../cat/store';
import type { Cat } from '../cat/types';
import { fight, recordResult, type BattleResult } from '../game/battle';
import { sanitizeProgress, TRAITS, type Progress } from '../game/progress';
import { accountsEnabled, db } from './db';

/** Saved cats belonging to one user. Every query is scoped by user id. */

export const MAX_CATS_PER_USER = 100;

function toSavedCat(row: Record<string, unknown>): SavedCat {
	const json = (v: unknown) => (v ? JSON.parse(String(v)) : null);
	return {
		id: String(row.id),
		cat: sanitizeCat(json(row.data)),
		care: sanitizeCare(json(row.care), Date.now()),
		progress: sanitizeProgress(json(row.progress)),
		createdAt: Number(row.created_at)
	};
}

const COLUMNS = 'id, data, care, progress, created_at';

export async function listCats(userId: string): Promise<SavedCat[]> {
	const client = await db();
	const { rows } = await client.execute({
		sql: `SELECT ${COLUMNS} FROM cats WHERE user_id = ? ORDER BY created_at`,
		args: [userId]
	});
	return rows.map((r) => toSavedCat(r));
}

/** Returns null when the user already has the maximum number of cats. */
export async function createCat(
	userId: string,
	body: { cat?: unknown; care?: unknown; progress?: unknown }
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
		progress: sanitizeProgress(body.progress),
		createdAt: now
	};
	await client.execute({
		sql: `INSERT INTO cats (id, user_id, data, care, progress, created_at, updated_at)
			VALUES (?, ?, ?, ?, ?, ?, ?)`,
		args: [
			saved.id,
			userId,
			JSON.stringify(saved.cat),
			JSON.stringify(saved.care),
			JSON.stringify(saved.progress),
			now,
			now
		]
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
	if (patch.progress !== undefined) {
		sets.push('progress = ?');
		args.push(JSON.stringify(sanitizeProgress(patch.progress)));
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

// ----- battles -----

/** What a player gets to see about the cat they're battling (never who owns it). */
export interface Opponent {
	cat: Cat;
	progress: Progress;
	/** True for a made-up "wild" cat, used when there's nobody else to battle. */
	wild: boolean;
}

export interface BattleOutcome {
	opponent: Opponent;
	result: BattleResult;
	/** The player's cat's progress after the battle. */
	progress: Progress;
}

const WILD_NAMES = ['Wild Whiskers', 'Alley Ace', 'Shadow Paws', 'Captain Fluff', 'Rumble Tum'];

/** A made-up cat with levels close to the player's, for when there's nobody else to battle. */
function wildCat(near: Progress): Opponent {
	const progress = sanitizeProgress(null);
	for (const t of TRAITS) {
		const level = near.traits[t].level + Math.floor(Math.random() * 3) - 1;
		progress.traits[t] = { level: Math.max(1, level), xp: 0 };
	}
	const name = WILD_NAMES[Math.floor(Math.random() * WILD_NAMES.length)];
	return { cat: randomCat(name), progress, wild: true };
}

/** A random cat that doesn't belong to `excludeUserId` (or any cat, for guests). */
async function randomOpponentRow(excludeUserId: string | null) {
	if (!accountsEnabled()) return null;
	const client = await db();
	const { rows } = await client.execute({
		sql: `SELECT ${COLUMNS} FROM cats WHERE user_id != ? ORDER BY RANDOM() LIMIT 1`,
		args: [excludeUserId ?? '']
	});
	return rows[0] ? toSavedCat(rows[0]) : null;
}

/**
 * A logged-in player's cat battles a random cat from another player. Both cats' records are
 * updated. Returns null if the cat isn't this player's.
 */
export async function battleForUser(userId: string, catId: string): Promise<BattleOutcome | null> {
	const client = await db();
	const { rows } = await client.execute({
		sql: `SELECT ${COLUMNS} FROM cats WHERE id = ? AND user_id = ?`,
		args: [catId, userId]
	});
	if (!rows[0]) return null;
	const me = toSavedCat(rows[0]);
	const theirs = await randomOpponentRow(userId);
	const opponent: Opponent = theirs
		? { cat: theirs.cat, progress: theirs.progress, wild: false }
		: wildCat(me.progress);

	const result = fight(me.progress, opponent.progress);
	const progress = recordResult(me.progress, result.winner === 'a');
	const now = Date.now();
	await client.execute({
		sql: 'UPDATE cats SET progress = ?, updated_at = ? WHERE id = ?',
		args: [JSON.stringify(progress), now, me.id]
	});
	if (theirs) {
		const theirProgress = recordResult(theirs.progress, result.winner === 'b');
		await client.execute({
			sql: 'UPDATE cats SET progress = ? WHERE id = ?',
			args: [JSON.stringify(theirProgress), theirs.id]
		});
		opponent.progress = theirProgress;
	}
	return { opponent, result, progress };
}

/**
 * A guest's cat (kept in their browser) battles a random cat from the game. Only the guest's own
 * record changes (they save it themselves); the opponent's record is left alone.
 */
export async function battleForGuest(rawProgress: unknown): Promise<BattleOutcome> {
	const mine = sanitizeProgress(rawProgress);
	const theirs = await randomOpponentRow(null);
	const opponent: Opponent = theirs
		? { cat: theirs.cat, progress: theirs.progress, wild: false }
		: wildCat(mine);
	const result = fight(mine, opponent.progress);
	return { opponent, result, progress: recordResult(mine, result.winner === 'a') };
}
