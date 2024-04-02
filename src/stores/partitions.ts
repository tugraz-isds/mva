import { writable } from 'svelte/store';

export const colorPickerPositionStore = writable<{
  position: { x: number; y: number };
  windowSize: { width: number; height: number };
}>({ position: { x: 0, y: 0 }, windowSize: { width: 0, height: 0 } });
