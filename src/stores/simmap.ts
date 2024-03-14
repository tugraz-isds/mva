import { writable } from 'svelte/store';
import type { SimmapMethodsType } from '../components/simmap/types';

export const simmapMethodStore = writable<SimmapMethodsType>();
