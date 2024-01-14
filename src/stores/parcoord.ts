import { writable } from 'svelte/store';
import type {
	AxesFilterType,
	CustomRangeType,
	DimensionType,
	HistogramsType
} from '../components/parcoord/types';

export const filtersArray = writable<AxesFilterType[]>([]);
export const parcoordCustomAxisRanges = writable<Map<string, CustomRangeType>>(new Map());
export const parcoordIsInteractable = writable<boolean>(true);
export const parcoordDimData = writable<Map<string, DimensionType>>(new Map());
export const parcoordHistogramData = writable<HistogramsType>({
	visible: true,
	fillOpacity: 0.2,
	strokeOpacity: 0.3,
	scale: 0.5
});
