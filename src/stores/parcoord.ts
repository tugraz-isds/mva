import { writable } from 'svelte/store';
import type { AxesFilterType } from '../components/parcoord/types';

export const filtersArray = writable<AxesFilterType[]>([]);
