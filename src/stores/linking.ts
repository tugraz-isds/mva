import { writable } from 'svelte/store';
export const linkingArray = writable<{ start: number; end: number }[]>([]);
