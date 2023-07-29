import { writable } from 'svelte/store';
import type { DSVParsedArray } from 'd3';

export const datasetStore = writable<DSVParsedArray<any>[]>([]);
