import type { ColorType } from '../../util/types';

export type DimensionMetadataType = {
	inverted: boolean;
	showLabels: boolean;
	showHistograms: boolean;
	showFilter: boolean;
	showFilterValues: boolean;
	binNo: number | null;
};

export type FilteringType = {
	x: number;
	y: number;
} | null;

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

export type TooltipAxisTitleType = {
	visible: boolean;
	xPos: number;
	yPos: number;
	text: string;
};

export type CustomRangeType = {
	start: number;
	end: number;
} | null;

export type HistogramsType = {
	visible: boolean;
	fillOpacity: number;
	strokeOpacity: number;
	scale: number;
};
