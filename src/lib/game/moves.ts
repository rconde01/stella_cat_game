import type { Trait } from './progress';

/**
 * Battle moves (just for show — who wins each round is decided by `fight`). Each round tests a
 * trait, and both cats use a move that fits it: the round's loser misses, the winner lands a hit.
 */

export const MOVES = {
	'karate-chop': { label: 'Karate Chop', icon: '🥋', style: 'melee', impact: 'CHOP!' },
	kick: { label: 'Flying Kick', icon: '🦶', style: 'melee', impact: 'POW!' },
	'sneaky-pounce': { label: 'Sneaky Pounce', icon: '🐾', style: 'melee', impact: 'GOTCHA!' },
	cucumber: { label: 'Cucumber Toss', icon: '🥒', style: 'throw', impact: 'EEK!' },
	catnip: { label: 'Catnip Cloud', icon: '🌿', style: 'throw', impact: 'WOOZY!' },
	'fish-bone': { label: 'Fish Bone Fling', icon: '🦴', style: 'throw', impact: 'BONK!' },
	hairball: { label: 'Hairball Hack', icon: '🤢', style: 'throw', impact: 'SPLAT!' }
} as const;

export type Move = keyof typeof MOVES;

export const TRAIT_MOVES: Record<Trait, Move[]> = {
	strength: ['karate-chop', 'kick'],
	speed: ['kick', 'sneaky-pounce'],
	agility: ['kick', 'sneaky-pounce'],
	smarts: ['cucumber', 'catnip', 'fish-bone', 'hairball']
};

export function pickMove(trait: Trait): Move {
	const moves = TRAIT_MOVES[trait];
	return moves[Math.floor(Math.random() * moves.length)];
}

export const LOCATIONS = {
	warehouse: { label: 'the Warehouse', icon: '🏭' },
	field: { label: 'the Field', icon: '🌾' },
	bathroom: { label: 'the Bathroom', icon: '🛁' },
	plane: { label: 'the wing of a Plane', icon: '✈️' },
	dojo: { label: 'the Dojo', icon: '🥋' }
} as const;

export type Location = keyof typeof LOCATIONS;

export function pickLocation(): Location {
	const all = Object.keys(LOCATIONS) as Location[];
	return all[Math.floor(Math.random() * all.length)];
}
