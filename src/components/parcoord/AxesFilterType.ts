export type AxesFilter = {
	pixels:
		| {
				// Actual pixel values of start/end
				start: number;
				end: number;
		  }
		| any;
	values:
		| {
				// Values on plot of start/end
				start: number;
				end: number;
		  }
		| any;
};
