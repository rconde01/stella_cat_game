import { describe, expect, it } from 'vitest';
import {
	addTo,
	advanceCare,
	cleanUp,
	freshCare,
	isHappy,
	MINUTES_PER_MESS,
	needs,
	sanitizeCare,
	STUFF
} from './care';

const MIN = 60_000;
const T0 = Date.UTC(2026, 9, 6, 12, 0, 0);

describe('advanceCare', () => {
	it('does nothing within the same minute', () => {
		const care = freshCare(T0);
		expect(advanceCare(care, T0 + 59_000).care).toBe(care);
	});

	it('lowers needs over time but never below zero', () => {
		const { care } = advanceCare(freshCare(T0), T0 + 2 * 24 * 60 * MIN);
		expect(care.fullness).toBe(0);
		expect(care.fun).toBe(0);
		expect(care.tidy).toBe(0);
	});

	it('makes no messes while the cat is looked after', () => {
		const { newMesses } = advanceCare(freshCare(T0), T0 + 60 * MIN);
		expect(newMesses).toEqual([]);
	});

	it('makes messes when neglected, at most one per item', () => {
		const { care, newMesses } = advanceCare(freshCare(T0), T0 + 3 * 24 * 60 * MIN);
		expect(newMesses.length).toBe(STUFF.length);
		expect(new Set(care.messes.map((m) => m.item)).size).toBe(STUFF.length);
	});

	it('gives the same result caught up in one go or in small steps', () => {
		const start = { ...freshCare(T0), fun: 0 };
		const end = T0 + 5 * MINUTES_PER_MESS * MIN + 30_000;
		const once = advanceCare(start, end).care;
		let stepped = start;
		for (let t = T0; t <= end; t += 7_000) stepped = advanceCare(stepped, t).care;
		stepped = advanceCare(stepped, end).care;
		expect(stepped).toEqual(once);
	});
});

describe('needs and happiness', () => {
	it('asks for the most urgent need first', () => {
		const care = { ...freshCare(T0), fullness: 30, fun: 10 };
		expect(needs(care)).toEqual(['play', 'food']);
		expect(isHappy(care)).toBe(false);
	});

	it('feeding, playing and brushing raise needs, capped at 100', () => {
		let care = { ...freshCare(T0), fullness: 10 };
		care = addTo(care, 'food', 35);
		expect(care.fullness).toBe(45);
		expect(addTo(care, 'brush', 500).tidy).toBe(100);
	});

	it('cleaning removes the mess on that item', () => {
		const care = { ...freshCare(T0), messes: [{ item: 'teddy' as const, kind: 'poop' as const }] };
		expect(cleanUp(care, 'teddy').messes).toEqual([]);
	});
});

describe('sanitizeCare', () => {
	it('turns missing care into a fresh, happy cat', () => {
		expect(isHappy(sanitizeCare(null, T0))).toBe(true);
	});

	it('clamps numbers and drops bad or duplicate messes', () => {
		const care = sanitizeCare(
			{
				fullness: 500,
				fun: -3,
				tidy: 'x',
				messes: [
					{ item: 'teddy', kind: 'poop' },
					{ item: 'teddy', kind: 'pee' },
					{ item: 'sofa', kind: 'poop' }
				],
				updatedAt: T0 + 999 * MIN
			},
			T0
		);
		expect(care.fullness).toBe(100);
		expect(care.fun).toBe(0);
		expect(care.tidy).toBe(90);
		expect(care.messes).toEqual([{ item: 'teddy', kind: 'poop' }]);
		expect(care.updatedAt).toBe(T0);
	});
});
