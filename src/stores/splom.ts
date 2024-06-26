import { writable } from 'svelte/store';

export const splomXDimensionsStore = writable<number>(0);
export const splomYDimensionsStore = writable<number>(0);
export const showSplomOverviewStore = writable<boolean>(false);
