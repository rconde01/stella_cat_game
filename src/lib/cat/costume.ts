import type { LimbLayer } from './parts/Limb.svelte';
import type { Accessory } from './types';

/** Body costumes cover the body, haunches and legs (and the tail, for robots). */
export type Costume = 'armour' | 'robot';

export function costumeOf(accessories: Accessory[]): Costume | null {
	if (accessories.includes('armour')) return 'armour';
	if (accessories.includes('robot')) return 'robot';
	return null;
}

export const STEEL = '#c3ccd8';
export const STEEL_DARK = '#6d7787';
export const ROBOT_METAL = '#b8c7d6';
export const ROBOT_DARK = '#6f8094';

/** Extra stroke layers a costume puts on legs or the tail. */
export function costumeLimbLayers(costume: Costume | null, area: 'leg' | 'tail'): LimbLayer[] {
	if (costume === 'armour' && area === 'leg') {
		return [
			// Greaves covering the lower leg, with a knee seam.
			{ stroke: STEEL, widthScale: 1.15, dasharray: '0 40 60', cap: 'round' },
			{ stroke: STEEL_DARK, widthScale: 1.15, dasharray: '0 52 3 100', cap: 'butt' }
		];
	}
	if (costume === 'robot') {
		return [
			{ stroke: ROBOT_METAL, widthScale: 1, cap: 'round' },
			{ stroke: ROBOT_DARK, widthScale: 1, dasharray: '2.5 9', dashoffset: -5, cap: 'butt' }
		];
	}
	return [];
}
