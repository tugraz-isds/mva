import { writable } from 'svelte/store';
import type {
  AxesFilterType,
  CustomRangeType,
  DimensionMetadataType,
  HistogramsType
} from '../components/parcoord/types';

export const filtersArray = writable<AxesFilterType[]>([]);
export const parcoordCustomAxisRanges = writable<Map<string, CustomRangeType>>(new Map());
export const parcoordIsInteractable = writable<boolean>(true);
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
