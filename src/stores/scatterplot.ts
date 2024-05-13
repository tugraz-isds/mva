import { writable } from 'svelte/store';
import type { ScatterplotSelectionShapeType } from '../components/scatterplot/types';

export const xDimStore = writable<string>();
export const yDimStore = writable<string>();
export const scatterplotSelectionShapeStore = writable<ScatterplotSelectionShapeType>('lasso');
