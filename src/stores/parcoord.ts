import { writable } from 'svelte/store';
import type { AxesFilter } from '../components/parcoord/AxesFilterType';

export const filtersArray = writable<AxesFilter[]>([]);
