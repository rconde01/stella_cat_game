import type { Handle } from '@sveltejs/kit/hooks';
import { SESSION_COOKIE, userFromSession } from '#lib/server/auth.ts';
import { accountsEnabled } from '#lib/server/db.ts';

/** Work out who is logged in (if anyone) for every request. */
export const handle: Handle = async ({ event, resolve }) => {
	event.locals.user = null;
	const token = event.cookies.get(SESSION_COOKIE);
	if (token && accountsEnabled()) {
		try {
			event.locals.user = await userFromSession(token);
		} catch (err) {
			// A database hiccup shouldn't take the whole game down; treat it as logged out.
			console.error('Session lookup failed', err);
		}
	}
	return resolve(event);
};
