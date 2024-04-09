import type { Selection } from 'd3-selection';

export type DimensionMetadataType = {
  inverted: boolean;
  showLabels: boolean;
  showHistograms: boolean;
  showFilter: boolean;
  showFilterValues: boolean;
  binNo: number | null;
};

export type AxisElementsType = {
  lines: Selection<SVGGElement, unknown, HTMLElement, any>[];
  titles: Selection<SVGTextElement, unknown, HTMLElement, any>[];
  invertIcons: Selection<SVGSVGElement, unknown, HTMLElement, any>[];
  upperFilters: Selection<SVGSVGElement, unknown, HTMLElement, any>[];
  upperFilterValues: (Selection<SVGGElement, unknown, HTMLElement, any> | null)[];
  lowerFilters: Selection<SVGSVGElement, unknown, HTMLElement, any>[];
  lowerFilterValues: (Selection<SVGGElement, unknown, HTMLElement, any> | null)[];
  filterRectangles: Selection<SVGRectElement, unknown, HTMLElement, any>[];
};

export type AxesFilterType = {
  pixels: {
    // Actual pixel values of filters start/end
    start: number;
    end: number;
  };
  percentages: {
    // Percentages on plot of filters start/end
    start: number | null;
    end: number | null;
  };
};

export type CustomRangeType = {
  start: number;
  end: number;
} | null;

export type HistogramsType = {
  visible: boolean;
  fillOpacity: number;
  strokeOpacity: number;
  width: number;
  widthLimits: {
    min: number;
    max: number;
  };
};
