import type { Cat, Pose, Shape } from './types';

/**
 * Where every part of the cat goes, in the 400x400 SVG viewBox.
 * Parts with a `path` are drawn in unit coordinates (roughly -1..1) and placed with a transform.
 */

export interface Pt {
	x: number;
	y: number;
}

export type BlobPath = 'pear' | 'loaf' | 'ellipse';

export interface Blob {
	path: BlobPath;
	cx: number;
	cy: number;
	rx: number;
	ry: number;
	/** Rotation in degrees. */
	rot: number;
}

export interface Limb {
	from: Pt;
	to: Pt;
	width: number;
	/** Sideways bulge of the limb's curve, in px. */
	bend: number;
}

export interface Tail {
	base: Pt;
	/** Control points relative to `base`; animation swings them around it. */
	c1: Pt;
	c2: Pt;
	end: Pt;
	width: number;
}

export interface Head {
	x: number;
	y: number;
	/** Pixels per head unit. */
	s: number;
	tilt: number;
	/** Ear size multiplier. */
	ear: number;
}

export interface Layout {
	ground: number;
	shadow: { cx: number; rx: number };
	body: Blob;
	/** Drawn on top of the body (thighs). */
	haunches: Blob[];
	/** Drawn behind the body. */
	backLegs: Limb[];
	/** Drawn in front of the body. */
	frontLegs: Limb[];
	tail: Tail;
	head: Head;
}

export const GROUND = 362;

export const UNIT_PATHS: Record<BlobPath, string> = {
	pear: 'M 0 -1 C 0.55 -1 0.75 -0.55 0.85 0 C 0.95 0.55 0.75 1 0 1 C -0.75 1 -0.95 0.55 -0.85 0 C -0.75 -0.55 -0.55 -1 0 -1 Z',
	loaf: 'M -1 0 C -1 -0.75 -0.6 -1 0 -1 C 0.6 -1 1 -0.7 1 -0.05 C 1 0.6 0.7 1 0.1 1 L -0.3 1 C -0.8 1 -1 0.6 -1 0 Z',
	ellipse: 'M -1 0 A 1 1 0 1 0 1 0 A 1 1 0 1 0 -1 0 Z'
};

interface ShapeFactors {
	bodyW: number;
	bodyH: number;
	head: number;
	limb: number;
	leg: number;
	tail: number;
	ear: number;
}

const SHAPE_FACTORS: Record<Shape, ShapeFactors> = {
	round: { bodyW: 1.2, bodyH: 1.0, head: 1.0, limb: 1.25, leg: 0.85, tail: 1.1, ear: 1.0 },
	slim: { bodyW: 0.82, bodyH: 1.05, head: 0.92, limb: 0.85, leg: 1.2, tail: 0.85, ear: 1.15 },
	fluffy: { bodyW: 1.12, bodyH: 1.05, head: 1.05, limb: 1.2, leg: 0.95, tail: 1.7, ear: 0.95 },
	kitten: { bodyW: 0.8, bodyH: 0.8, head: 1.12, limb: 0.95, leg: 0.75, tail: 0.8, ear: 1.2 }
};

/** A point given in a blob's unit coordinates, converted to viewBox coordinates. */
export function blobPoint(b: Blob, ux: number, uy: number): Pt {
	const r = (b.rot * Math.PI) / 180;
	const x = ux * b.rx;
	const y = uy * b.ry;
	return {
		x: b.cx + x * Math.cos(r) - y * Math.sin(r),
		y: b.cy + x * Math.sin(r) + y * Math.cos(r)
	};
}

export function blobTransform(b: Blob): string {
	return `translate(${b.cx} ${b.cy}) rotate(${b.rot}) scale(${b.rx} ${b.ry})`;
}

export function limbPath(l: Limb): string {
	const mx = (l.from.x + l.to.x) / 2;
	const my = (l.from.y + l.to.y) / 2;
	const dx = l.to.x - l.from.x;
	const dy = l.to.y - l.from.y;
	const len = Math.hypot(dx, dy) || 1;
	const cx = mx + (-dy / len) * l.bend;
	const cy = my + (dx / len) * l.bend;
	return `M ${l.from.x} ${l.from.y} Q ${cx} ${cy} ${l.to.x} ${l.to.y}`;
}

/**
 * Tail path with the tail swung by `swing` radians (the tip moves the most). Passing a slightly older
 * swing as `tipSwing` makes the tip lag behind and whip through (follow-through).
 */
export function tailPath(t: Tail, swing: number, tipSwing = swing): string {
	const rot = (p: Pt, a: number): Pt => ({
		x: t.base.x + p.x * Math.cos(a) - p.y * Math.sin(a),
		y: t.base.y + p.x * Math.sin(a) + p.y * Math.cos(a)
	});
	const c1 = rot(t.c1, swing * 0.3);
	const c2 = rot(t.c2, swing * 0.5 + tipSwing * 0.2);
	const end = rot(t.end, swing * 0.3 + tipSwing * 0.7);
	return `M ${t.base.x} ${t.base.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${end.x} ${end.y}`;
}

function sitting(f: ShapeFactors): Layout {
	const cx = 200;
	const rx = 60 * f.bodyW;
	const ry = 70 * f.bodyH;
	const body: Blob = { path: 'pear', cx, cy: GROUND - ry, rx, ry, rot: 0 };
	const s = 80 * f.head;
	const lw = 20 * f.limb;
	const haunch = (side: number): Blob => ({
		path: 'ellipse',
		cx: cx + side * rx * 0.72,
		cy: GROUND - 24 * f.bodyH,
		rx: 30 * f.bodyW,
		ry: 25 * f.bodyH,
		rot: side * 15
	});
	const leg = (side: number): Limb => ({
		from: { x: cx + side * rx * 0.3, y: body.cy - ry * 0.1 },
		to: { x: cx + side * rx * 0.32, y: GROUND - lw / 2 },
		width: lw,
		bend: 0
	});
	return {
		ground: GROUND,
		shadow: { cx, rx: rx * 1.35 },
		body,
		haunches: [haunch(-1), haunch(1)],
		backLegs: [],
		frontLegs: [leg(-1), leg(1)],
		tail: {
			base: { x: cx + rx * 0.6, y: GROUND - 14 },
			c1: { x: 55, y: 4 },
			c2: { x: 85, y: -30 },
			end: { x: 70, y: -85 },
			width: 15 * f.tail
		},
		head: { x: cx, y: body.cy - ry * 0.8 - s * 0.45, s, tilt: 0, ear: f.ear }
	};
}

function standing(f: ShapeFactors): Layout {
	const cx = 215;
	const rx = 88 * f.bodyW;
	const ry = 48 * f.bodyH;
	const legLen = 60 * f.leg;
	const body: Blob = { path: 'loaf', cx, cy: GROUND - legLen - ry * 0.45, rx, ry, rot: 0 };
	const s = 76 * f.head;
	const lw = 19 * f.limb;
	const leg = (ux: number, dx: number): Limb => {
		const from = blobPoint(body, ux, 0.3);
		return { from, to: { x: from.x + dx, y: GROUND - lw / 2 }, width: lw, bend: 0 };
	};
	return {
		ground: GROUND,
		shadow: { cx, rx: rx * 1.2 },
		body,
		haunches: [],
		backLegs: [leg(-0.38, -2), leg(0.42, 4)],
		frontLegs: [leg(-0.6, -4), leg(0.62, 2)],
		tail: {
			base: blobPoint(body, 0.92, -0.35),
			c1: { x: 40, y: -5 },
			c2: { x: 60, y: -60 },
			end: { x: 35, y: -105 },
			width: 15 * f.tail
		},
		head: { x: cx - rx * 0.78, y: body.cy - ry * 0.75 - s * 0.35, s, tilt: -4, ear: f.ear }
	};
}

function lying(f: ShapeFactors): Layout {
	const cx = 230;
	const rx = 100 * f.bodyW;
	const ry = 44 * f.bodyH;
	const body: Blob = { path: 'loaf', cx, cy: GROUND - ry * 0.95, rx, ry, rot: 0 };
	const s = 78 * f.head;
	const lw = 18 * f.limb;
	const paw = (dx: number, dy: number): Limb => ({
		from: { x: cx - rx * 0.5 + dx, y: GROUND - lw * 0.6 + dy },
		to: { x: cx - rx * 0.95 - 22 + dx, y: GROUND - lw / 2 + dy },
		width: lw,
		bend: 0
	});
	return {
		ground: GROUND,
		shadow: { cx, rx: rx * 1.25 },
		body,
		haunches: [
			{
				path: 'ellipse',
				cx: cx + rx * 0.45,
				cy: GROUND - ry * 0.75,
				rx: 40 * f.bodyW,
				ry: 34 * f.bodyH,
				rot: 0
			}
		],
		backLegs: [paw(12, -6)],
		frontLegs: [paw(0, 0)],
		tail: {
			base: { x: cx + rx * 0.85, y: GROUND - 16 },
			c1: { x: 30, y: 8 },
			c2: { x: 65, y: 10 },
			end: { x: 75, y: -25 },
			width: 15 * f.tail
		},
		head: { x: cx - rx * 0.68, y: body.cy - ry * 0.7 - s * 0.4, s, tilt: 4, ear: f.ear }
	};
}

function stretching(f: ShapeFactors): Layout {
	const cx = 225;
	const rx = 90 * f.bodyW;
	const ry = 44 * f.bodyH;
	const body: Blob = { path: 'loaf', cx, cy: GROUND - 40 * f.leg - 52, rx, ry, rot: -18 };
	const s = 76 * f.head;
	const lw = 19 * f.limb;
	const frontLeg = (ux: number, toX: number, dy: number): Limb => ({
		from: blobPoint(body, ux, 0.45),
		to: { x: cx - rx * toX, y: GROUND - lw / 2 + dy },
		width: lw,
		bend: 0
	});
	const backLeg = (ux: number, dx: number): Limb => {
		const from = blobPoint(body, ux, 0.4);
		return { from, to: { x: from.x + dx, y: GROUND - lw / 2 }, width: lw, bend: 0 };
	};
	return {
		ground: GROUND,
		shadow: { cx: cx - 15, rx: rx * 1.35 },
		body,
		haunches: [],
		backLegs: [frontLeg(-0.45, 1.05, -4), backLeg(0.38, 4)],
		frontLegs: [frontLeg(-0.62, 1.22, 0), backLeg(0.58, 6)],
		tail: {
			base: blobPoint(body, 0.95, -0.3),
			c1: { x: 20, y: -40 },
			c2: { x: 0, y: -85 },
			end: { x: 30, y: -115 },
			width: 15 * f.tail
		},
		head: { x: cx - rx * 1.0, y: GROUND - s * 1.25 - 12, s, tilt: -8, ear: f.ear }
	};
}

const POSE_LAYOUTS: Record<Pose, (f: ShapeFactors) => Layout> = {
	sitting,
	standing,
	lying,
	stretching
};

export function layoutCat(cat: Pick<Cat, 'shape' | 'pose'>): Layout {
	return POSE_LAYOUTS[cat.pose](SHAPE_FACTORS[cat.shape]);
}
