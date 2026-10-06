import type { SavedCat } from '../cat/store';
import { catStoreFor } from '../cat/store';
import type { Cat } from '../cat/types';
import type { BattleResult } from './battle';
import type { Progress } from './progress';

export interface BattleOutcome {
	opponent: { cat: Cat; progress: Progress; wild: boolean };
	result: BattleResult;
	progress: Progress;
}

/** Ask the server for a battle against a random cat, and save our cat's new record. */
export async function requestBattle(
	user: { id: string } | null,
	saved: SavedCat
): Promise<BattleOutcome> {
	const res = await fetch('/api/battle', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(user ? { catId: saved.id } : { progress: saved.progress })
	});
	if (!res.ok) throw new Error(`Battle failed: ${res.status}`);
	const outcome: BattleOutcome = await res.json();
	// Logged-in records are saved by the server; guests keep theirs in this browser.
	if (!user) await catStoreFor(null).update(saved.id, { progress: outcome.progress });
	return outcome;
}
