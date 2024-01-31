import type { COLOR_ACTIVE, COLOR_HOVERED, COLOR_BRUSHED, COLOR_FILTERED } from './colors';

export type MarginType = { top: number; right: number; bottom: number; left: number };

export type ColorType =
	| typeof COLOR_ACTIVE
	| typeof COLOR_HOVERED
	| typeof COLOR_BRUSHED
	| typeof COLOR_FILTERED;

export type RecordDataType = {
	color: ColorType; // Record color
	position: number; // Record z-index position
};

export type TooltipType = {
	visible: boolean; // Is tooltip visible
	xPos: number; // X position
	yPos: number; // Y position
	text: string[]; // Text rows as array
};

export type DimensionDataType = {
	type: 'numerical' | 'categorical';
	min: number | null;
	max: number | null;
	numberOfDecimals: number | null;
};
