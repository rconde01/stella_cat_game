/**
 * Call `fn(dt, elapsed)` every animation frame (seconds). Returns a function that stops the loop.
 * Mini-games keep their moving parts in $state and update them from here.
 */
export function onFrame(fn: (dt: number, elapsed: number) => void): () => void {
	const start = performance.now();
	let last = start;
	let frame = requestAnimationFrame(function tick(now) {
		// Cap dt so a hidden tab coming back doesn't make things jump.
		const dt = Math.min((now - last) / 1000, 0.05);
		last = now;
		fn(dt, (now - start) / 1000);
		frame = requestAnimationFrame(tick);
	});
	return () => cancelAnimationFrame(frame);
}

/** Scene (400×300 game area) coordinates of a pointer event on `el`. */
export function scenePoint(e: PointerEvent, el: Element, width = 400, height = 300) {
	const r = el.getBoundingClientRect();
	return {
		x: ((e.clientX - r.left) / r.width) * width,
		y: ((e.clientY - r.top) / r.height) * height
	};
}
