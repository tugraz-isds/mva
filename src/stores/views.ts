import { writable } from 'svelte/store';
import type { View } from '../components/view-panel/View';
import { views as initialViews } from '../components/view-panel/Views';

export const activeViewsStore = writable<View[]>(initialViews);
