/** Mix a hex color toward white (amount > 0) or black (amount < 0). amount is in [-1, 1]. */
export function shade(hex: string, amount: number): string {
	const n = parseInt(hex.slice(1), 16);
	const target = amount < 0 ? 0 : 255;
	const a = Math.abs(amount);
	const channel = (shift: number) => {
		const c = (n >> shift) & 0xff;
		return Math.round(c + (target - c) * a);
	};
	const out = (channel(16) << 16) | (channel(8) << 8) | channel(0);
	return `#${out.toString(16).padStart(6, '0')}`;
}

export const RAINBOW_STOPS = [
	'#ff6b6b',
	'#ffa94d',
	'#ffd43b',
	'#69db7c',
	'#4dabf7',
	'#9775fa',
	'#f783ac'
];
