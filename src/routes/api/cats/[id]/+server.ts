import { error, json } from '@sveltejs/kit';
import { deleteCat, updateCat } from '#lib/server/cats.ts';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ locals, params, request }) => {
	if (!locals.user) error(401, 'Not logged in');
	const saved = await updateCat(locals.user.id, params.id, await request.json());
	if (!saved) error(404, 'Cat not found');
	return json(saved);
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) error(401, 'Not logged in');
	await deleteCat(locals.user.id, params.id);
	return new Response(null, { status: 204 });
};
