import { writable } from 'svelte/store';

export const brushingArray = writable<Set<number>>(new Set<number>());
export const hoveredArray = writable<Set<number>>(new Set<number>());
export const previouslyHoveredArray = writable<Set<number>>(new Set<number>());
