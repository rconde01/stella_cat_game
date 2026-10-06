import { createClient, type Client } from '@libsql/client';
import { dev } from '$app/env';
import { TURSO_AUTH_TOKEN, TURSO_DATABASE_URL } from '$app/env/private';

/**
 * The database (Turso / libSQL). In development it falls back to a local file, so no setup is
 * needed. In production it needs TURSO_DATABASE_URL (+ TURSO_AUTH_TOKEN); without them, accounts are
 * switched off and the game keeps cats in the browser only.
 */

let client: Client | null = null;
let ready: Promise<void> | null = null;

const SCHEMA = [
	`CREATE TABLE IF NOT EXISTS users (
		id TEXT PRIMARY KEY,
		username TEXT NOT NULL,
		username_key TEXT NOT NULL UNIQUE,
		password_hash TEXT NOT NULL,
		created_at INTEGER NOT NULL
	)`,
	`CREATE TABLE IF NOT EXISTS sessions (
		id TEXT PRIMARY KEY,
		user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		expires_at INTEGER NOT NULL
	)`,
	`CREATE TABLE IF NOT EXISTS cats (
		id TEXT PRIMARY KEY,
		user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		data TEXT NOT NULL,
		care TEXT,
		progress TEXT,
		created_at INTEGER NOT NULL,
		updated_at INTEGER NOT NULL
	)`,
	`CREATE INDEX IF NOT EXISTS cats_by_user ON cats(user_id, updated_at)`
];

/** Columns added after a table was first created (SQLite has no ADD COLUMN IF NOT EXISTS). */
const ADDED_COLUMNS = [
	{ table: 'cats', column: 'care', type: 'TEXT' },
	{ table: 'cats', column: 'progress', type: 'TEXT' }
];

async function createSchema(c: Client): Promise<void> {
	await c.batch(SCHEMA, 'write');
	for (const { table, column, type } of ADDED_COLUMNS) {
		const { rows } = await c.execute(`PRAGMA table_info(${table})`);
		if (!rows.some((r) => r.name === column)) {
			await c.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
		}
	}
}

function databaseUrl(): string | undefined {
	return TURSO_DATABASE_URL ?? (dev ? 'file:local.db' : undefined);
}

export function accountsEnabled(): boolean {
	return Boolean(databaseUrl());
}

/** The database client, with tables created on first use. Throws if no database is configured. */
export async function db(): Promise<Client> {
	if (!client) {
		const url = databaseUrl();
		if (!url) throw new Error('No database configured (set TURSO_DATABASE_URL)');
		client = createClient({ url, authToken: TURSO_AUTH_TOKEN });
	}
	if (!ready) {
		ready = createSchema(client);
		ready.catch(() => (ready = null));
	}
	await ready;
	return client;
}
