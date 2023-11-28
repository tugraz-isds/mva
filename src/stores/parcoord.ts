import { writable } from 'svelte/store';
import type { AxesFilterType, CustomRangeType, DimensionType } from '../components/parcoord/types';

export const filtersArray = writable<AxesFilterType[]>([]);
export const parcoordCustomAxisRanges = writable<Map<string, CustomRangeType>>(new Map());
export const parcoordIsInteractable = writable<boolean>(true);
export const parcoordDimData = writable<Map<string, DimensionType>>(new Map());
