export type DimensionType = {
	inverted: boolean;
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
	color: number; // Line color
	position: number; // Line z-index position
};

export type CustomRangeType = {
	start: number;
	end: number;
} | null;
