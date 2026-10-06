import { error, json } from '@sveltejs/kit';
import { battleForGuest, battleForUser } from '#lib/server/cats.ts';
import type { RequestHandler } from './$types';

/**
 * Start a battle against a random cat.
 * Logged in: body { catId } — the server updates both cats' records.
 * Guest: body { progress } — the server just decides the result; the guest saves their own record.
 */
export const POST: RequestHandler = async ({ locals, request }) => {
	const body = (await request.json()) ?? {};
	if (locals.user) {
		const outcome = await battleForUser(locals.user.id, String(body.catId));
		if (!outcome) error(404, 'Cat not found');
		return json(outcome);
	}
	return json(await battleForGuest(body.progress));
};
