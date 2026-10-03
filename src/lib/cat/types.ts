export const SHAPES = ['round', 'slim', 'fluffy', 'kitten'] as const;
export const POSES = ['sitting', 'standing', 'lying', 'stretching'] as const;
export const PATTERNS = ['plain', 'stripes', 'spots', 'patches', 'tuxedo'] as const;
export const DISPOSITIONS = ['happy', 'grumpy', 'sleepy', 'silly', 'shy'] as const;

export type Shape = (typeof SHAPES)[number];
export type Pose = (typeof POSES)[number];
export type Pattern = (typeof PATTERNS)[number];
export type Disposition = (typeof DISPOSITIONS)[number];

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
}
