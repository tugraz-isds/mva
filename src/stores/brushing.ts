import { writable } from 'svelte/store';

export const brushedArray = writable<Set<number>>(new Set<number>());
export const hoveredArray = writable<Set<number>>(new Set<number>());
export const previouslyHoveredArray = writable<Set<number>>(new Set<number>());
export const previouslyBrushedArray = writable<Set<number>>(new Set<number>());
export const isInteractableStore = writable<boolean>(true);
