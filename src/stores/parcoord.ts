import { writable } from 'svelte/store';
export const filtersArray = writable<{ start: number; end: number }[]>([]);
