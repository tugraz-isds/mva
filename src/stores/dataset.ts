import { writable } from 'svelte/store';
import type { DSVParsedArray } from 'd3';
import type { DimensionDataType } from '../util/types';

export const datasetStore = writable<DSVParsedArray<any>[]>([]);
export const dimensionDataStore = writable<Map<string, DimensionDataType>>(new Map());
export const labelDimension = writable<string>();
