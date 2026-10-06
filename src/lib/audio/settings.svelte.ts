import { setVolumes, unlock } from './engine';
import { startMusic, stopMusic } from './music';

/** Sound and music switches, remembered in this browser. */

const KEY = 'rainbow-smiles:audio';

export const soundSettings = $state({ sfx: true, music: true });

let started = false;

function persist(): void {
	try {
		localStorage.setItem(KEY, JSON.stringify(soundSettings));
	} catch {
		// Not being able to remember the setting is fine.
	}
}

function apply(): void {
	if (!started) return;
	setVolumes(soundSettings.sfx, soundSettings.music);
	if (soundSettings.music) startMusic();
	else stopMusic();
}

/**
 * Call once from the root layout. Audio can only start after the player taps or clicks, so this waits
 * for the first interaction.
 */
export function setupAudio(): () => void {
	try {
		const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null');
		if (saved)
			Object.assign(soundSettings, { sfx: saved.sfx !== false, music: saved.music !== false });
	} catch {
		// Use the defaults.
	}
	const start = () => {
		unlock();
		started = true;
		apply();
	};
	window.addEventListener('pointerdown', start, { once: true });
	window.addEventListener('keydown', start, { once: true });
	return () => {
		window.removeEventListener('pointerdown', start);
		window.removeEventListener('keydown', start);
		stopMusic();
	};
}

export function toggleSfx(): void {
	soundSettings.sfx = !soundSettings.sfx;
	persist();
	apply();
}

export function toggleMusic(): void {
	soundSettings.music = !soundSettings.music;
	persist();
	apply();
}
