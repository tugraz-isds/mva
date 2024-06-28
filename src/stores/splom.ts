import { writable } from 'svelte/store';
import type { CoordinateType } from '../util/types';

export const showSplomOverviewStore = writable<boolean>(false);
