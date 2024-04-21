import { writable } from 'svelte/store';
import type {
  AxesFilterType,
  CustomRangeType,
  DimensionMetadataType,
  HistogramsType,
  ParcoordVisibleDimensionsType
} from '../components/parcoord/types';

export const parcoordVisibleDimensionsStore = writable<ParcoordVisibleDimensionsType[]>();
export const filtersArray = writable<Map<string, AxesFilterType>>(new Map());
export const parcoordCustomAxisRanges = writable<Map<string, CustomRangeType>>(new Map());
export const parcoordDimMetadata = writable<Map<string, DimensionMetadataType>>(new Map());
export const parcoordHistogramData = writable<HistogramsType>({
  visible: true,
  fillOpacity: 0.2,
  strokeOpacity: 0.3,
  width: 0.2,
  widthLimits: {
    min: 0,
    max: 0
  }
});
