import { accountsEnabled } from '#lib/server/db.ts';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => ({
	user: locals.user,
	accountsEnabled: accountsEnabled()
});
