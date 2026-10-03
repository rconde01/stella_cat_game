/**
 * Seconds since the component mounted, updated every animation frame.
 * Call during component initialisation; the loop stops when the component is destroyed.
 */
export function useClock() {
	let t = $state(0);

	$effect(() => {
		const start = performance.now();
		let frame = requestAnimationFrame(function tick(now) {
			t = (now - start) / 1000;
			frame = requestAnimationFrame(tick);
		});
		return () => cancelAnimationFrame(frame);
	});

	return {
		get t() {
			return t;
		}
	};
}
