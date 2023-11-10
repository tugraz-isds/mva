import { writable } from 'svelte/store';
import type { DSVParsedArray } from 'd3';

export const datasetStore = writable<DSVParsedArray<any>[]>([]);
export const dimensionTypeStore = writable<Map<string, string>>(new Map());
export const labelDimension = writable<string>();
