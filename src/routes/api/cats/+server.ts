import { error, json } from '@sveltejs/kit';
import { createCat, listCats, MAX_CATS_PER_USER } from '#lib/server/cats.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) error(401, 'Not logged in');
	return json(await listCats(locals.user.id));
};

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) error(401, 'Not logged in');
	const saved = await createCat(locals.user.id, await request.json());
	if (!saved) error(409, `You can have up to ${MAX_CATS_PER_USER} cats`);
	return json(saved, { status: 201 });
};
