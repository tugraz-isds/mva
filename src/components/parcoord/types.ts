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
