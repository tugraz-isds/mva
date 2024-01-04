import type { COLOR_ACTIVE, COLOR_HOVERED, COLOR_BRUSHED, COLOR_FILTERED } from './colors';

export type MarginType = { top: number; right: number; bottom: number; left: number };

export type ColorType =
	| typeof COLOR_ACTIVE
	| typeof COLOR_HOVERED
	| typeof COLOR_BRUSHED
	| typeof COLOR_FILTERED;
