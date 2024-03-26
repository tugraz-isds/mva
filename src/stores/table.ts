import { writable } from 'svelte/store';
import type { TableDimensionsType } from '../components/table/types';

export const tableDimensionsStore = writable<TableDimensionsType[]>();
