import type { BlobPath } from './geometry';
import type { Pattern } from './types';

/**
 * Coat pattern markings. Blob-shaped parts (head, body, haunches) get filled shapes in their unit
 * coordinates, clipped to the part. Stroke-shaped parts (legs, tail) get a dash pattern instead.
 */

export type PatternArea = BlobPath | 'head';

function ellipse(cx: number, cy: number, rx: number, ry: number): string {
	return `M ${cx - rx} ${cy} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`;
}

/** A tapered stripe hanging down from (x, top) to a point at (x, bottom). */
function stripe(x: number, top: number, bottom: number, w: number): string {
	const mid = (top + bottom) / 2;
	return `M ${x - w} ${top} Q ${x - w * 0.6} ${mid} ${x} ${bottom} Q ${x + w * 1.4} ${mid} ${x + w} ${top} Z`;
}

/** A tapered stripe pointing sideways from the edge at x=edge toward x=tip. */
function sideStripe(edge: number, tip: number, y: number, w: number): string {
	return `M ${edge} ${y - w} Q ${(edge + tip) / 2} ${y - w * 0.3} ${tip} ${y} Q ${(edge + tip) / 2} ${y + w * 0.9} ${edge} ${y + w} Z`;
}

const HEAD: Record<Pattern, string[]> = {
	plain: [],
	stripes: [
		stripe(0, -1, -0.5, 0.07),
		stripe(-0.27, -0.98, -0.6, 0.06),
		stripe(0.27, -0.98, -0.6, 0.06),
		sideStripe(-1.2, -0.85, 0.05, 0.06),
		sideStripe(-1.2, -0.88, 0.22, 0.05),
		sideStripe(1.2, 0.85, 0.05, 0.06),
		sideStripe(1.2, 0.88, 0.22, 0.05)
	],
	spots: [
		ellipse(-0.3, -0.7, 0.1, 0.09),
		ellipse(0.12, -0.78, 0.07, 0.06),
		ellipse(0.75, -0.3, 0.11, 0.1)
	],
	patches: [ellipse(-0.75, -0.55, 0.62, 0.55)],
	tuxedo: ['M 0 -0.25 C 0.3 0 0.75 0.3 0.8 0.95 L -0.8 0.95 C -0.75 0.3 -0.3 0 0 -0.25 Z']
};

const PEAR: Record<Pattern, string[]> = {
	plain: [],
	stripes: [
		sideStripe(-1, -0.45, -0.35, 0.09),
		sideStripe(-1, -0.5, 0.05, 0.09),
		sideStripe(-1, -0.55, 0.45, 0.09),
		sideStripe(1, 0.45, -0.35, 0.09),
		sideStripe(1, 0.5, 0.05, 0.09),
		sideStripe(1, 0.55, 0.45, 0.09)
	],
	spots: [
		ellipse(-0.55, -0.35, 0.16, 0.13),
		ellipse(0.5, -0.5, 0.13, 0.11),
		ellipse(0.62, 0.2, 0.17, 0.14),
		ellipse(-0.6, 0.35, 0.13, 0.11)
	],
	patches: [
		'M 0.1 -1.1 C 0.6 -1.1 1.1 -0.6 1 0 C 0.7 -0.1 0.3 -0.3 0.1 -1.1 Z',
		ellipse(-0.75, 0.55, 0.45, 0.4)
	],
	tuxedo: [ellipse(0, 0.2, 0.48, 0.85)]
};

const LOAF: Record<Pattern, string[]> = {
	plain: [],
	stripes: [-0.55, -0.2, 0.15, 0.5, 0.82].map((x) => stripe(x, -1.1, 0.25, 0.1)),
	spots: [
		ellipse(-0.45, -0.45, 0.13, 0.17),
		ellipse(0.05, -0.65, 0.1, 0.13),
		ellipse(0.45, -0.3, 0.14, 0.19),
		ellipse(0.0, 0.05, 0.09, 0.12),
		ellipse(-0.6, 0.15, 0.08, 0.11)
	],
	patches: [
		'M -0.4 -1.1 C 0.1 -1.1 0.5 -0.6 0.3 -0.1 C 0 0.1 -0.5 -0.3 -0.4 -1.1 Z',
		ellipse(0.85, 0.3, 0.35, 0.6)
	],
	tuxedo: [ellipse(-0.55, 0.65, 0.6, 0.55)]
};

const HAUNCH: Record<Pattern, string[]> = {
	plain: [],
	stripes: [sideStripe(-1.1, 0.2, -0.35, 0.15), sideStripe(1.1, -0.2, 0.25, 0.15)],
	spots: [ellipse(-0.2, -0.3, 0.22, 0.2), ellipse(0.4, 0.3, 0.17, 0.16)],
	patches: [],
	tuxedo: []
};

const AREAS: Record<PatternArea, Record<Pattern, string[]>> = {
	head: HEAD,
	pear: PEAR,
	loaf: LOAF,
	ellipse: HAUNCH
};

/** All markings for an area joined into one path (so a rainbow gradient spans the whole part). */
export function patternPath(pattern: Pattern, area: PatternArea): string {
	return AREAS[area][pattern].join(' ');
}

export interface LimbDash {
	dasharray: string;
	dashoffset: number;
	cap: 'butt' | 'round';
	/** Width relative to the limb's width. */
	widthScale: number;
}

/** Dash pattern for legs / tail, using pathLength=100. */
export function limbDash(pattern: Pattern, area: 'leg' | 'tail'): LimbDash | null {
	switch (pattern) {
		case 'plain':
			return null;
		case 'stripes':
			return {
				dasharray: area === 'tail' ? '7 9' : '9 12',
				dashoffset: -6,
				cap: 'butt',
				widthScale: 1
			};
		case 'spots':
			return { dasharray: '0 24', dashoffset: -14, cap: 'round', widthScale: 0.5 };
		case 'patches':
			return area === 'tail'
				? { dasharray: '0 55 40 100', dashoffset: 0, cap: 'round', widthScale: 1 }
				: null;
		case 'tuxedo':
			return {
				dasharray: area === 'tail' ? '0 82 18' : '0 72 28',
				dashoffset: 0,
				cap: 'round',
				widthScale: 1
			};
	}
}
