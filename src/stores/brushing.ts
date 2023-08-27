import { writable } from 'svelte/store';
import type { DSVParsedArray } from 'd3';

export const brushingArray = writable<Set<number>>(new Set<number>());
