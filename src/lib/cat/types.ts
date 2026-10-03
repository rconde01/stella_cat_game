export const SHAPES = ['round', 'slim', 'fluffy', 'kitten'] as const;
export const POSES = ['sitting', 'standing', 'lying', 'stretching'] as const;
export const PATTERNS = ['plain', 'stripes', 'spots', 'patches', 'tuxedo'] as const;
export const DISPOSITIONS = ['happy', 'grumpy', 'sleepy', 'silly', 'shy'] as const;
export const ACCESSORIES = [
	'party-hat',
	'top-hat',
	'crown',
	'bow',
	'unicorn-horn',
	'glasses',
	'heart-sunglasses',
	'laser-eyes',
	'armour',
	'robot',
	'smores'
] as const;
export const BACKGROUNDS = [
	'none',
	'lawn',
	'woods',
	'bedroom',
	'rainbow',
	'starry-night',
	'paw-prints',
	'hearts'
] as const;

export type Shape = (typeof SHAPES)[number];
export type Pose = (typeof POSES)[number];
export type Pattern = (typeof PATTERNS)[number];
export type Disposition = (typeof DISPOSITIONS)[number];
export type Accessory = (typeof ACCESSORIES)[number];
export type Background = (typeof BACKGROUNDS)[number];

/** Special highlight value that paints the pattern with a rainbow gradient. */
export const RAINBOW = 'rainbow';

/** Everything the player chooses about their cat. Plain data so it can be saved as JSON. */
export interface Cat {
	name: string;
	shape: Shape;
	pose: Pose;
	pattern: Pattern;
	/** Main coat color (hex). */
	color: string;
	/** Pattern / accent color (hex or RAINBOW). */
	highlight: string;
	/** Iris color (hex). */
	eyeColor: string;
	disposition: Disposition;
	/** At most one accessory per slot (see ACCESSORY_OPTIONS). */
	accessories: Accessory[];
	background: Background;
}
