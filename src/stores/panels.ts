import { writable } from 'svelte/store';
import { panels } from '../components/panels/Panels';
import type { PanelType } from '../components/panels/types';

export const activePanelsStore = writable<PanelType[]>(panels);
export const panelsSizesStore = writable<number[]>([33.33, 33.33, 33.33, 20, 30, 50]);
export const rowSizeStore = writable<number>(55);
export const isCurrentlyResizing = writable<boolean>(false);
