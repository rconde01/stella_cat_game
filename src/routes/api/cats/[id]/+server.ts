import { error } from '@sveltejs/kit';
import { deleteCat, updateCat } from '#lib/server/cats.ts';
import type { RequestHandler } from './$types';

/** Body: { cat?, care?, progress? } — only the given parts change. */
export const PATCH: RequestHandler = async ({ locals, params, request }) => {
	if (!locals.user) error(401, 'Not logged in');
	const body = (await request.json()) ?? {};
	const patch = { cat: body.cat, care: body.care, progress: body.progress };
	if (!(await updateCat(locals.user.id, params.id, patch))) {
		error(404, 'Cat not found');
	}
	return new Response(null, { status: 204 });
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) error(401, 'Not logged in');
	await deleteCat(locals.user.id, params.id);
	return new Response(null, { status: 204 });
};
