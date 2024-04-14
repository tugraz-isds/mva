import { writable } from 'svelte/store';
import type { PartitionType } from '../components/partitions/types';

export const partitionsStore = writable<Map<string, PartitionType>>(new Map());
export const partitionsDataStore = writable<string[]>([]);
