import { describe, expect, it } from 'vitest';
import { fight, recordResult } from './battle';
import {
	addXp,
	catLevel,
	freshProgress,
	MAX_LEVEL,
	sanitizeProgress,
	xpForScore,
	xpToNext,
	type Progress
} from './progress';

function trained(level: number): Progress {
	const p = freshProgress();
	for (const t of Object.keys(p.traits) as (keyof Progress['traits'])[])
		p.traits[t] = { level, xp: 0 };
	return p;
}

describe('training', () => {
	it('levels up when XP passes the threshold, carrying the rest over', () => {
		const { progress, levelsGained } = addXp(freshProgress(), 'speed', xpToNext(1) + 5);
		expect(levelsGained).toBe(1);
		expect(progress.traits.speed).toEqual({ level: 2, xp: 5 });
		expect(catLevel(progress)).toBe(2);
	});

	it('stops at the max level', () => {
		const { progress } = addXp(freshProgress(), 'smarts', 1_000_000);
		expect(progress.traits.smarts.level).toBe(MAX_LEVEL);
	});

	it('always gives some XP, more for doing well', () => {
		expect(xpForScore(0)).toBeGreaterThan(0);
		expect(xpForScore(100)).toBeGreaterThan(xpForScore(50));
	});
});

describe('battles', () => {
	it('has three rounds with different traits and a best-of-three winner', () => {
		const result = fight(freshProgress(), freshProgress());
		expect(result.rounds).toHaveLength(3);
		expect(new Set(result.rounds.map((r) => r.trait)).size).toBe(3);
		const aWins = result.rounds.filter((r) => r.winner === 'a').length;
		expect(result.winner).toBe(aWins >= 2 ? 'a' : 'b');
	});

	it('usually goes to the better-trained cat, but not always', () => {
		let strongWins = 0;
		for (let i = 0; i < 2000; i++) if (fight(trained(4), trained(2)).winner === 'a') strongWins++;
		expect(strongWins).toBeGreaterThan(1500);
		expect(strongWins).toBeLessThan(2000);
	});

	it('records wins and losses', () => {
		const p = recordResult(recordResult(freshProgress(), true), false);
		expect([p.wins, p.losses]).toEqual([1, 1]);
	});
});

describe('sanitizeProgress', () => {
	it('fixes bad data', () => {
		const p = sanitizeProgress({
			traits: { speed: { level: 99, xp: -5 } },
			wins: 'lots',
			losses: 2.7
		});
		expect(p.traits.speed).toEqual({ level: MAX_LEVEL, xp: 0 });
		expect(p.traits.agility.level).toBe(1);
		expect([p.wins, p.losses]).toEqual([0, 2]);
	});
});
