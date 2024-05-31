import { writable } from 'svelte/store';
import type { View } from '../components/view-panel/ViewType';
import { views as initialViews } from '../components/view-panel/Views';

export const activeViewsStore = writable<View[]>(initialViews);
export const isCurrentlyResizing = writable<boolean>(false);
export const windowIdStore = writable<number>(0);
