import { fail, redirect } from '@sveltejs/kit';
import {
	checkLogin,
	createUser,
	MIN_PASSWORD,
	startSession,
	USERNAME_RULES
} from '#lib/server/auth.ts';
import { accountsEnabled } from '#lib/server/db.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	if (locals.user) redirect(303, '/');
};

function readForm(data: FormData) {
	return {
		username: String(data.get('username') ?? '').trim(),
		password: String(data.get('password') ?? '')
	};
}

export const actions: Actions = {
	login: async ({ request, cookies }) => {
		if (!accountsEnabled())
			return fail(503, { username: '', message: 'Accounts are not switched on yet.' });
		const { username, password } = readForm(await request.formData());
		const user = await checkLogin(username, password);
		if (!user) {
			return fail(400, {
				username,
				message: "Hmm, that name and password don't match. Try again!"
			});
		}
		await startSession(cookies, user.id);
		redirect(303, '/');
	},

	register: async ({ request, cookies }) => {
		if (!accountsEnabled())
			return fail(503, { username: '', message: 'Accounts are not switched on yet.' });
		const { username, password } = readForm(await request.formData());
		if (!USERNAME_RULES.test(username)) {
			return fail(400, {
				username,
				message: 'Names need 3 to 20 letters or numbers (no spaces).'
			});
		}
		if (password.length < MIN_PASSWORD) {
			return fail(400, { username, message: `Passwords need at least ${MIN_PASSWORD} letters.` });
		}
		const user = await createUser(username, password);
		if (!user)
			return fail(400, { username, message: 'Someone already has that name. Try another!' });
		await startSession(cookies, user.id);
		redirect(303, '/');
	}
};
