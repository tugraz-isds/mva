import { writable } from 'svelte/store';
import type { TableVisibleDimensionsType } from '../components/table/types';

export const tableVisibleDimensionsStore = writable<TableVisibleDimensionsType[]>();
