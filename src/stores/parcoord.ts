import { writable } from 'svelte/store';
import type { AxesFilterType, CustomRangeType } from '../components/parcoord/types';

export const filtersArray = writable<AxesFilterType[]>([]);
export const parcoordCustomAxisRanges = writable<Map<string, CustomRangeType>>(new Map());
export const parcoordIsInteractable = writable<boolean>(true);
export const parcoordInvertedAxes = writable<Map<string, boolean>>(new Map());
