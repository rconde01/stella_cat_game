import { createHash, randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import type { Cookies } from '@sveltejs/kit';
import { dev } from '$app/env';
import { db } from './db';

/**
 * Username + password accounts with cookie sessions.
 * Passwords are hashed with scrypt; the session cookie holds a random token and the database stores
 * only its SHA-256 hash, so a leaked database can't be used to log in.
 */

export interface User {
	id: string;
	username: string;
}

const scryptAsync = promisify(scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

export const SESSION_COOKIE = 'session';
const SESSION_DAYS = 60;

export const USERNAME_RULES = /^[a-zA-Z0-9_-]{3,20}$/;
export const MIN_PASSWORD = 6;

async function hashPassword(password: string): Promise<string> {
	const salt = randomBytes(16);
	const hash = await scryptAsync(password, salt, 32);
	return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
	const [saltHex, hashHex] = stored.split(':');
	const expected = Buffer.from(hashHex, 'hex');
	const actual = await scryptAsync(password, Buffer.from(saltHex, 'hex'), expected.length);
	return timingSafeEqual(actual, expected);
}

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export async function createUser(username: string, password: string): Promise<User | null> {
	const client = await db();
	const user = { id: randomUUID(), username };
	const result = await client.execute({
		sql: `INSERT INTO users (id, username, username_key, password_hash, created_at)
			VALUES (?, ?, ?, ?, ?) ON CONFLICT(username_key) DO NOTHING`,
		args: [user.id, username, username.toLowerCase(), await hashPassword(password), Date.now()]
	});
	return result.rowsAffected === 1 ? user : null;
}

export async function checkLogin(username: string, password: string): Promise<User | null> {
	const client = await db();
	const { rows } = await client.execute({
		sql: 'SELECT id, username, password_hash FROM users WHERE username_key = ?',
		args: [username.toLowerCase()]
	});
	const row = rows[0];
	if (!row || !(await verifyPassword(password, String(row.password_hash)))) return null;
	return { id: String(row.id), username: String(row.username) };
}

export async function startSession(cookies: Cookies, userId: string): Promise<void> {
	const token = randomBytes(32).toString('base64url');
	const expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
	const client = await db();
	await client.execute({
		sql: 'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)',
		args: [hashToken(token), userId, expires]
	});
	cookies.set(SESSION_COOKIE, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: !dev,
		expires: new Date(expires)
	});
}

export async function userFromSession(token: string): Promise<User | null> {
	const client = await db();
	const { rows } = await client.execute({
		sql: `SELECT users.id, users.username, sessions.expires_at FROM sessions
			JOIN users ON users.id = sessions.user_id WHERE sessions.id = ?`,
		args: [hashToken(token)]
	});
	const row = rows[0];
	if (!row || Number(row.expires_at) < Date.now()) return null;
	return { id: String(row.id), username: String(row.username) };
}

export async function endSession(cookies: Cookies): Promise<void> {
	const token = cookies.get(SESSION_COOKIE);
	if (token) {
		const client = await db();
		await client.execute({ sql: 'DELETE FROM sessions WHERE id = ?', args: [hashToken(token)] });
	}
	cookies.delete(SESSION_COOKIE, { path: '/' });
}
