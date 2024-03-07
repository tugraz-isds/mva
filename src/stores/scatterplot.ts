import { writable } from 'svelte/store';

export const numericalDimensionsStore = writable<string[]>([]);
export const xDimStore = writable<string>();
export const yDimStore = writable<string>();
