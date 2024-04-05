import { writable } from 'svelte/store';
import type { ColorPickerPositionType, PartitionType } from '../components/partitions/types';

export const colorPickerPositionStore = writable<ColorPickerPositionType>({
  position: { x: 0, y: 0 },
  windowSize: { width: 0, height: 0 }
});

export const colorPickerOpenedStore = writable<boolean>(false);

export const partitionsStore = writable<Map<string, PartitionType>>(new Map());
export const partitionsDataStore = writable<string[]>([]);
