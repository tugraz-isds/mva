import { writable } from 'svelte/store';
import { views as initialViews } from '../components/views/Views';
import type { View } from '../components/views/types';

export const activeViewsStore = writable<View[]>(initialViews);
export const isCurrentlyResizing = writable<boolean>(false);
