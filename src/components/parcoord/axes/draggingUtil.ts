import type { Writable } from 'svelte/store';
import { reorderArray } from '../../../util/util';
import type { AxesFilterType, AxisElementsType, DimensionMetadataType } from '../types';
import { getAxisDomainValue } from './drawingUtil';

export function moveDraggedAxis(
  draggingIndex: number,
  newX: number,
  top: number,
  axisElements: AxisElementsType,
  axesFilters: Map<string, AxesFilterType>,
  dimensionsMetadata: Map<string, DimensionMetadataType>,
  dimensions: string[]
) {
  axisElements.lines[draggingIndex].attr('transform', `translate(${newX}, ${top})`);
  axisElements.titles[draggingIndex].attr('transform', `translate(${newX}, ${top - 30})`);
  axisElements.invertIcons[draggingIndex].attr('x', newX - 8);
  if (dimensionsMetadata.get(dimensions[draggingIndex])?.showFilter) {
    axisElements.upperFilters[draggingIndex].attr('x', newX - 8);
    axisElements.lowerFilters[draggingIndex].attr('x', newX - 8);
    axisElements.filterRectangles[draggingIndex].attr('transform', `translate(${newX - 6}, 0)`);
  }
  if (dimensionsMetadata.get(dimensions[draggingIndex])?.showFilterValues) {
    const axisFilter = axesFilters.get(dimensions[draggingIndex]) as AxesFilterType;
    axisElements.upperFilterValues[draggingIndex]?.attr(
      'transform',
      `translate(${newX + 8}, ${axisFilter.pixels.start + top - 10})`
    );
    axisElements.lowerFilterValues[draggingIndex]?.attr(
      'transform',
      `translate(${newX + 8}, ${axisFilter.pixels.end + top - 4})`
    );
  }
}

export function swapAxes(
  newIndex: number,
  draggingIndex: number,
  newX: number,
  xScales: any[],
  top: number,
  axisElements: AxisElementsType,
  axesFilters: Map<string, AxesFilterType>,
  dimensionsMetadata: Map<string, DimensionMetadataType>,
  dimensions: string[]
) {
  axisElements.lines[newIndex].attr('transform', `translate(${xScales[draggingIndex]}, ${top})`);
  axisElements.titles[newIndex].attr('transform', `translate(${xScales[draggingIndex]}, ${top - 30})`);
  axisElements.invertIcons[draggingIndex].attr('x', xScales[draggingIndex] - 8);
  if (dimensionsMetadata.get(dimensions[draggingIndex])?.showFilter) {
    axisElements.upperFilters[draggingIndex].attr('x', xScales[draggingIndex] - 8);
    axisElements.lowerFilters[draggingIndex].attr('x', xScales[draggingIndex] - 8);
    axisElements.filterRectangles[newIndex].attr('transform', `translate(${xScales[draggingIndex] - 6}, 0)`);
  }
  if (dimensionsMetadata.get(dimensions[draggingIndex])?.showFilterValues) {
    const axisFilter = axesFilters.get(dimensions[draggingIndex]) as AxesFilterType;
    axisElements.upperFilterValues[draggingIndex]?.attr(
      'transform',
      `translate(${newX + 8}, ${axisFilter.pixels.start + top - 10})`
    );
    axisElements.lowerFilterValues[newIndex]?.attr(
      'transform',
      `translate(${xScales[draggingIndex] + 8}, ${axisFilter.pixels.end + top - 4})`
    );
  }
  dimensions = reorderArray(dimensions, draggingIndex, newIndex);
  axisElements.lines = reorderArray(axisElements.lines, draggingIndex, newIndex);
  axisElements.titles = reorderArray(axisElements.titles, draggingIndex, newIndex);
  axisElements.filterRectangles = reorderArray(axisElements.filterRectangles, draggingIndex, newIndex);
  axisElements.invertIcons = reorderArray(axisElements.invertIcons, draggingIndex, newIndex);
}

export function endAxisDragging(
  draggingIndex: number,
  xScales: any[],
  top: number,
  axisElements: AxisElementsType,
  axesFilters: Map<string, AxesFilterType>,
  dimensionsMetadata: Map<string, DimensionMetadataType>,
  dimensions: string[],
  isCurrentlyFiltering: boolean
) {
  // Snap elements into correct place
  axisElements.lines[draggingIndex].attr('transform', `translate(${xScales[draggingIndex]}, ${top})`);
  axisElements.titles[draggingIndex].attr('transform', `translate(${xScales[draggingIndex]}, ${top - 30})`);
  axisElements.invertIcons[draggingIndex].attr('x', xScales[draggingIndex] - 8);
  if (dimensionsMetadata.get(dimensions[draggingIndex])?.showFilter) {
    axisElements.upperFilters[draggingIndex].attr('x', xScales[draggingIndex] - 8);
    axisElements.lowerFilters[draggingIndex].attr('x', xScales[draggingIndex] - 8);
    axisElements.filterRectangles[draggingIndex].attr('transform', `translate(${xScales[draggingIndex] - 6}, 0)`);
  }
  if (dimensionsMetadata.get(dimensions[draggingIndex])?.showFilterValues) {
    const axisFilter = axesFilters.get(dimensions[draggingIndex]) as AxesFilterType;
    axisElements.upperFilterValues[draggingIndex]?.attr(
      'transform',
      `translate(${xScales[draggingIndex] + 8}, ${axisFilter.pixels.start + top - 10})`
    );
    axisElements.lowerFilterValues[draggingIndex]?.attr(
      'transform',
      `translate(${xScales[draggingIndex] + 8}, ${axisFilter.pixels.end + top - 4})`
    );
  }
  draggingIndex = -1;
  isCurrentlyFiltering = false;
}

export function dragUpperFilter(
  i: number,
  newY: number,
  xScales: any[],
  yScales: any,
  top: number,
  axisHeight: number,
  axisElements: AxisElementsType,
  axesFilters: Map<string, AxesFilterType>,
  dimensions: string[],
  numberOfDecimals?: number | null
) {
  const axisFilter = axesFilters.get(dimensions[i]) as AxesFilterType;
  axisElements.upperFilters[i].attr('y', newY - 8);
  axisElements.upperFilterValues[i]
    ?.attr('transform', `translate(${xScales[i] + 8}, ${newY - 2})`)
    .style('display', (axisFilter.percentages.start as number) <= 0 ? 'none' : 'block');
  axisElements.upperFilterValues[i]
    ?.select('text')
    .text(getAxisDomainValue(i, axisFilter.percentages.start as number, yScales, dimensions, numberOfDecimals));
  axisElements.filterRectangles[i].attr('y', `${newY + 8}`).attr('height', `${axisFilter.pixels.end - newY + top - 8}`);

  axisFilter.pixels.start = newY - top + 8;
  axisFilter.percentages.start = axisFilter.pixels.start / axisHeight;
}

export function dragLowerFilter(
  i: number,
  newY: number,
  xScales: any[],
  yScales: any,
  top: number,
  axisHeight: number,
  axisElements: AxisElementsType,
  axesFilters: Map<string, AxesFilterType>,
  dimensions: string[],
  numberOfDecimals?: number | null
) {
  const axisFilter = axesFilters.get(dimensions[i]) as AxesFilterType;
  axisElements.lowerFilters[i].attr('y', newY - 8);
  axisElements.lowerFilterValues[i]
    ?.attr('transform', `translate(${xScales[i] + 8}, ${newY - 8})`)
    .style('display', (axisFilter.percentages.end as number) >= 1 ? 'none' : 'block');
  axisElements.lowerFilterValues[i]
    ?.select('text')
    .text(getAxisDomainValue(i, axisFilter.percentages.end as number, yScales, dimensions, numberOfDecimals));
  axisElements.filterRectangles[i].attr('height', `${newY - axisFilter.pixels.start - top - 8}`);

  axisFilter.pixels.end = newY - top - 8;
  axisFilter.percentages.end = axisFilter.pixels.end / axisHeight;
}

export function dragFilterRectangle(
  i: number,
  newY: number,
  filterHeight: number,
  xScales: any[],
  yScales: any,
  top: number,
  axisHeight: number,
  axisElements: AxisElementsType,
  axesFilters: Map<string, AxesFilterType>,
  dimensions: string[],
  filtersArray: Writable<Map<string, AxesFilterType>>,
  numberOfDecimals?: number | null
) {
  axisElements.filterRectangles[i].attr('y', `${newY}`);
  const axisFilter = axesFilters.get(dimensions[i]) as AxesFilterType;
  axisFilter.pixels = {
    start: newY - top,
    end: newY + filterHeight - top
  };
  axisFilter.percentages = {
    start: axisFilter.pixels.start / axisHeight,
    end: axisFilter.pixels.end / axisHeight
  };
  axesFilters.set(dimensions[i], axisFilter);
  filtersArray.set(axesFilters);

  axisElements.upperFilters[i].attr('y', axisFilter.pixels.start + top - 16);
  axisElements.upperFilterValues[i]
    ?.attr('transform', `translate(${xScales[i] + 8}, ${axisFilter.pixels.start + top - 10})`)
    .style('display', (axisFilter.percentages.start as number) <= 0 ? 'none' : 'block');
  axisElements.upperFilterValues[i]
    ?.select('text')
    .text(getAxisDomainValue(i, axisFilter.percentages.start as number, yScales, dimensions, numberOfDecimals));
  axisElements.lowerFilters[i].attr('y', axisFilter.pixels.end + top);
  axisElements.lowerFilterValues[i]
    ?.attr('transform', `translate(${xScales[i] + 8}, ${axisFilter.pixels.end + top - 4})`)
    .style('display', (axisFilter.percentages.end as number) >= 1 ? 'none' : 'block');
  axisElements.lowerFilterValues[i]
    ?.select('text')
    .text(getAxisDomainValue(i, axisFilter.percentages.end as number, yScales, dimensions, numberOfDecimals));
}
