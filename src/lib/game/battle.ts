import { TRAITS, type Progress, type Trait } from './progress';

/**
 * A battle is three rounds, each testing a different trait. In each round both cats roll: twice
 * their trait level plus a dice roll (1–8), so training matters but a lower-level cat can still win
 * sometimes. Best of three wins.
 */

export interface Round {
	trait: Trait;
	/** Power of the player's cat (a) and the opponent (b) this round. */
	a: number;
	b: number;
	winner: 'a' | 'b';
}

export interface BattleResult {
	rounds: Round[];
	winner: 'a' | 'b';
}

export function fight(a: Progress, b: Progress, random: () => number = Math.random): BattleResult {
	const traits = [...TRAITS].sort(() => random() - 0.5).slice(0, 3);
	const roll = () => 1 + Math.floor(random() * 8);
	const rounds: Round[] = traits.map((trait) => {
		let pa = a.traits[trait].level * 2 + roll();
		let pb = b.traits[trait].level * 2 + roll();
		while (pa === pb) {
			pa += roll();
			pb += roll();
		}
		return { trait, a: pa, b: pb, winner: pa > pb ? 'a' : 'b' };
	});
	const aWins = rounds.filter((r) => r.winner === 'a').length;
	return { rounds, winner: aWins >= 2 ? 'a' : 'b' };
}

/** Record a battle in a cat's win/loss tally. */
export function recordResult(p: Progress, won: boolean): Progress {
	return won ? { ...p, wins: p.wins + 1 } : { ...p, losses: p.losses + 1 };
}
