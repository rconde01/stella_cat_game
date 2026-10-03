import { defineEnvVars } from '@sveltejs/kit/env';

/** Environment variables, read from `$app/env/private` on the server. */
export const variables = defineEnvVars({
	TURSO_DATABASE_URL: {
		description:
			'libSQL URL of the Turso database (libsql://…). Unset in production = accounts switched off; ' +
			'unset in dev = use the local file local.db.',
		schema: (value) => value || undefined
	},
	TURSO_AUTH_TOKEN: {
		description: 'Auth token for the Turso database.',
		schema: (value) => value || undefined
	}
});
