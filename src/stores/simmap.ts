import { writable } from 'svelte/store';
import type { SimmapMethodsType } from '../components/simmap/types';
import type { ScatterplotSelectionShapeType } from '../components/scatterplot/types';

export const simmapMethodStore = writable<SimmapMethodsType>();
export const simmapSelectionShapeStore = writable<ScatterplotSelectionShapeType>('lasso');
