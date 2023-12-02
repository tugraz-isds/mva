import type { COLOR_ACTIVE, COLOR_HOVERED, COLOR_BRUSHED, COLOR_FILTERED } from '../../util/colors';

export type DimensionType = {
	inverted: boolean;
	showLabels: boolean;
	showFilter: boolean;
};

export type AxesFilterType = {
	pixels: {
		// Actual pixel values of filters start/end
		start: number;
		end: number;
	};
	percentages: {
		// Percentages on plot of filters start/end
		start: number;
		end: number;
	};
};

export type TooltipType = {
	visible: boolean; // Is tooltip visible
	xPos: number; // X position
	yPos: number; // Y position
	text: string[]; // Text rows as array
};

export type TooltipAxisTitleType = {
	visible: boolean; // Is tooltip visible
	xPos: number; // X position
	yPos: number; // Y position
	text: string; // Text rows as array
};

export type LineDataType = {
	color: ColorType; // Line color
	position: number; // Line z-index position
};

export type CustomRangeType = {
	start: number;
	end: number;
} | null;

export type ColorType =
	| typeof COLOR_ACTIVE
	| typeof COLOR_HOVERED
	| typeof COLOR_BRUSHED
	| typeof COLOR_FILTERED;
