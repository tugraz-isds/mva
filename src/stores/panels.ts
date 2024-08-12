import { writable } from 'svelte/store';
import { panels } from '../components/panels/Panels';
import type { PanelType } from '../components/panels/types';

export const activePanelsStore = writable<PanelType[]>(panels);
export const isCurrentlyResizing = writable<boolean>(false);
