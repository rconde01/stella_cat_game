import {
	BACKGROUNDS,
	DISPOSITIONS,
	PATTERNS,
	POSES,
	RAINBOW,
	SHAPES,
	type Accessory,
	type Background,
	type Cat,
	type Disposition,
	type Pattern,
	type Pose,
	type Shape
} from './types';

export interface Option<T extends string> {
	id: T;
	label: string;
}

export const SHAPE_OPTIONS: Option<Shape>[] = [
	{ id: 'round', label: 'Round' },
	{ id: 'slim', label: 'Slim' },
	{ id: 'fluffy', label: 'Fluffy' },
	{ id: 'kitten', label: 'Kitten' }
];

export const POSE_OPTIONS: Option<Pose>[] = [
	{ id: 'sitting', label: 'Sitting' },
	{ id: 'standing', label: 'Standing' },
	{ id: 'lying', label: 'Lying down' },
	{ id: 'stretching', label: 'Stretching' }
];

export const PATTERN_OPTIONS: Option<Pattern>[] = [
	{ id: 'plain', label: 'Plain' },
	{ id: 'stripes', label: 'Stripes' },
	{ id: 'spots', label: 'Spots' },
	{ id: 'patches', label: 'Patches' },
	{ id: 'tuxedo', label: 'Tuxedo' }
];

export const DISPOSITION_OPTIONS: Option<Disposition>[] = [
	{ id: 'happy', label: 'Happy' },
	{ id: 'grumpy', label: 'Grumpy' },
	{ id: 'sleepy', label: 'Sleepy' },
	{ id: 'silly', label: 'Silly' },
	{ id: 'shy', label: 'Shy' }
];

/** Where an accessory goes. A cat can wear one accessory per slot. */
export type AccessorySlot = 'head' | 'eyes' | 'body' | 'fur';

export const ACCESSORY_OPTIONS: (Option<Accessory> & { slot: AccessorySlot })[] = [
	{ id: 'party-hat', label: 'Party hat', slot: 'head' },
	{ id: 'top-hat', label: 'Top hat', slot: 'head' },
	{ id: 'crown', label: 'Crown', slot: 'head' },
	{ id: 'bow', label: 'Bow', slot: 'head' },
	{ id: 'unicorn-horn', label: 'Unicorn horn', slot: 'head' },
	{ id: 'glasses', label: 'Glasses', slot: 'eyes' },
	{ id: 'heart-sunglasses', label: 'Heart shades', slot: 'eyes' },
	{ id: 'laser-eyes', label: 'Laser eyes', slot: 'eyes' },
	{ id: 'armour', label: 'Armour', slot: 'body' },
	{ id: 'robot', label: 'Robot', slot: 'body' },
	{ id: 'smores', label: "S'mores fur", slot: 'fur' }
];

export function accessorySlot(id: Accessory): AccessorySlot {
	return ACCESSORY_OPTIONS.find((o) => o.id === id)!.slot;
}

/** Take an accessory off if worn; otherwise put it on, replacing anything in the same slot. */
export function toggleAccessory(worn: Accessory[], id: Accessory): Accessory[] {
	if (worn.includes(id)) return worn.filter((a) => a !== id);
	const slot = accessorySlot(id);
	return [...worn.filter((a) => accessorySlot(a) !== slot), id];
}

export const BACKGROUND_OPTIONS: Option<Background>[] = [
	{ id: 'none', label: 'Plain' },
	{ id: 'lawn', label: 'Lawn' },
	{ id: 'woods', label: 'Woods' },
	{ id: 'bedroom', label: 'Bedroom' },
	{ id: 'rainbow', label: 'Rainbow' },
	{ id: 'starry-night', label: 'Starry night' },
	{ id: 'paw-prints', label: 'Pink paws' },
	{ id: 'hearts', label: 'Hearts' }
];

export const COAT_COLORS: Option<string>[] = [
	{ id: '#fbf7f2', label: 'Snow' },
	{ id: '#f5deb3', label: 'Cream' },
	{ id: '#f4a259', label: 'Ginger' },
	{ id: '#ffe27a', label: 'Sunshine' },
	{ id: '#a9adb8', label: 'Silver' },
	{ id: '#9a6b4b', label: 'Cocoa' },
	{ id: '#4a4453', label: 'Midnight' },
	{ id: '#f7b7d2', label: 'Bubblegum' },
	{ id: '#c8b6ff', label: 'Lavender' },
	{ id: '#a0d8f7', label: 'Sky' },
	{ id: '#b5ead7', label: 'Mint' }
];

export const HIGHLIGHT_COLORS: Option<string>[] = [
	{ id: RAINBOW, label: 'Rainbow' },
	{ id: '#ffffff', label: 'White' },
	{ id: '#f5deb3', label: 'Cream' },
	{ id: '#e8893a', label: 'Orange' },
	{ id: '#6b4a3a', label: 'Chocolate' },
	{ id: '#2e2a35', label: 'Ink' },
	{ id: '#7d808c', label: 'Smoke' },
	{ id: '#e86a92', label: 'Rose' },
	{ id: '#7a5cff', label: 'Violet' },
	{ id: '#3fa7e0', label: 'Ocean' },
	{ id: '#47c27f', label: 'Leaf' },
	{ id: '#ffd43b', label: 'Lemon' }
];

export const EYE_COLORS: Option<string>[] = [
	{ id: '#5fcf80', label: 'Emerald' },
	{ id: '#48a9f8', label: 'Ocean' },
	{ id: '#3ccfc0', label: 'Teal' },
	{ id: '#f5c242', label: 'Gold' },
	{ id: '#e8892f', label: 'Amber' },
	{ id: '#8c5a3c', label: 'Hazel' },
	{ id: '#9b6cf0', label: 'Amethyst' },
	{ id: '#f06fae', label: 'Rose' }
];

export const CAT_NAMES = [
	'Mochi',
	'Biscuit',
	'Luna',
	'Sprinkles',
	'Pudding',
	'Noodle',
	'Pickles',
	'Sunny',
	'Marshmallow',
	'Pumpkin',
	'Waffles',
	'Bubbles',
	'Peaches',
	'Tofu',
	'Ziggy',
	'Cupcake',
	'Jellybean',
	'Pippin',
	'Snowball',
	'Twinkle'
];

export const DEFAULT_CAT: Cat = {
	name: 'Mochi',
	shape: 'round',
	pose: 'sitting',
	pattern: 'stripes',
	color: '#f4a259',
	highlight: '#e8893a',
	eyeColor: '#5fcf80',
	disposition: 'happy',
	accessories: [],
	background: 'lawn'
};

function pick<T>(items: readonly T[]): T {
	return items[Math.floor(Math.random() * items.length)];
}

export function randomName(current?: string): string {
	const choices = CAT_NAMES.filter((n) => n !== current);
	return pick(choices);
}

/** A random cat that keeps the given name. */
export function randomCat(name: string): Cat {
	const color = pick(COAT_COLORS).id;
	const highlights = HIGHLIGHT_COLORS.filter((h) => h.id !== color);
	// Each slot has a 40% chance of something in it.
	const slots: AccessorySlot[] = ['head', 'eyes', 'body', 'fur'];
	const accessories = slots
		.filter(() => Math.random() < 0.4)
		.map((slot) => pick(ACCESSORY_OPTIONS.filter((o) => o.slot === slot)).id);
	return {
		accessories,
		background: pick(BACKGROUNDS),
		name,
		shape: pick(SHAPES),
		pose: pick(POSES),
		pattern: pick(PATTERNS),
		color,
		highlight: pick(highlights).id,
		eyeColor: pick(EYE_COLORS).id,
		disposition: pick(DISPOSITIONS)
	};
}
