<script lang="ts">
  import { afterUpdate, onDestroy, onMount } from 'svelte';
  import { select } from 'd3-selection';
  import { drag } from 'd3-drag';
  import { line } from 'd3-shape';
  import { filtersArray, parcoordDimMetadata, parcoordVisibleDimensionsStore } from '../../../stores/parcoord';
  import { isInteractableStore } from '../../../stores/brushing';
  import { datasetStore, dimensionDataStore } from '../../../stores/dataset';
  import { calculateMaxLength, getTextWidth } from '../../../util/text';
  import {
    drawAxis,
    drawAxisFilterRectangle,
    drawAxisInvertIcon,
    drawAxisLowerFilter,
    drawAxisLowerFilterValue,
    drawAxisTitle,
    drawAxisUpperFilter,
    drawAxisUpperFilterValue,
    getAxis,
    getAxisDomainValue
  } from './drawingUtil';
  import {
    dragFilterRectangle,
    dragLowerFilter,
    dragUpperFilter,
    endAxisDragging,
    moveDraggedAxis,
    swapAxes
  } from './draggingUtil';
  import type ContextMenuAxes from '../context-menu/ContextMenuAxes.svelte';
  import type {
    AxesFilterType,
    AxisElementsType,
    DimensionMetadataType,
    ParcoordVisibleDimensionsType
  } from '../types';
  import type { CoordinateType, MarginType, TooltipType } from '../../../util/types';

  export let width: number;
  export let contextMenuAxes: ContextMenuAxes;
  export let height: number;
  export let dimensions: string[] = [];
  export let margin: MarginType;
  export let handleAxesSwapped: (fromIndex: number, toIndex: number) => void;
  export let handleInvertAxis: (axisIndex: number) => void;
  export let handleMarginChanged: () => void;
  export let handleAutoscroll: (direction: 'left' | 'right') => void;
  export let setTooltipAxisTitleData: (data: TooltipType) => void;
  export let setTooltipData: (data: TooltipType) => void;
  export let xScales: any[];
  export let yScales: any;
  export let isDragging: boolean;

  // SVG elements
  let axisElements: AxisElementsType = {
    lines: [],
    titles: [],
    invertIcons: [],
    upperFilters: [],
    upperFilterValues: [],
    lowerFilters: [],
    lowerFilterValues: [],
    filterRectangles: []
  };

  let isMounted = false;
  let axisHeight: number;
  let axesFilters: Map<string, AxesFilterType> = new Map();
  let isCurrentlyFiltering = false;
  let autoscrollInterval: number | null = null;
  let datasetUploaded = false;

  $: axisHeight = height - margin.top - margin.bottom;

  let visibleDimensions: ParcoordVisibleDimensionsType[] = [];
  const unsubscribeParcoordVisibleDimensions = parcoordVisibleDimensionsStore.subscribe((value) => {
    visibleDimensions = value.filter((dim) => dim.title !== '_i' && dim.title !== '_partition');
  });

  let dimensionsMetadata: Map<string, DimensionMetadataType>;
  const unsubscribeDimData = parcoordDimMetadata.subscribe((value) => {
    if (axesFilters.size > 0) {
      dimensionsMetadata = value;
      clearSVG();
      renderAxes();
    }
  });

  const unsubscribeFilters = filtersArray.subscribe((value) => {
    if (!axesFilters || !axisElements.upperFilters || axesFilters.size === 0 || axisElements.upperFilters.length === 0)
      return;

    let redrawAxes = false;
    visibleDimensions.forEach((dim) => {
      if (!dim.visible) return;
      const axisFilterOld = axesFilters.get(dim.title);
      const axisFilterNew = value.get(dim.title);
      if (!axisFilterOld || !axisFilterNew) return;
      if (axisFilterNew.percentages.start === null) {
        axisFilterOld.percentages.start = axisFilterOld.pixels.start / axisHeight;
        redrawAxes = true;
      }
      if (axisFilterNew.percentages.end === null) {
        axisFilterOld.percentages.end = axisFilterOld.pixels.end / axisHeight;
        redrawAxes = true;
      }
      axesFilters.set(dim.title, axisFilterOld);
    });

    if (redrawAxes) {
      clearSVG();
      renderAxes();
    }
  });

  const unsubscribeDataset = datasetStore.subscribe(() => {
    if (!dimensionsMetadata || !isMounted) return;
    datasetUploaded = true;
  });

  export function clearSVG() {
    axisElements = {
      lines: [],
      titles: [],
      invertIcons: [],
      upperFilters: [],
      upperFilterValues: [],
      lowerFilters: [],
      lowerFilterValues: [],
      filterRectangles: []
    };

    const svg = select('#parcoord-canvas-axes');
    svg.selectChildren().remove();
  }

  export function renderAxes(newWidth: number | undefined = undefined) {
    if (!dimensions || xScales?.length === 0 || yScales?.length === 0) return;

    if (newWidth) width = newWidth;

    const svg = select('#parcoord-canvas-axes');

    dimensions.forEach((dim: string, i: number) => {
      const step = xScales[1] - xScales[0];
      // Format ticks so they dont overflow
      const maxTickLength = calculateMaxLength(
        $dimensionDataStore.get(dim)?.longestString ?? '',
        12,
        'sans-serif',
        i === 0 ? 100 : step
      );

      const axis = getAxis(
        yScales[dim],
        axisHeight,
        maxTickLength,
        $dimensionDataStore.get(dim)?.type,
        dimensionsMetadata.get(dim)?.showLabels
      );
      axisElements.lines.push(drawAxis(svg, axis, xScales[i], margin.top));

      const maxTitleLength = calculateMaxLength(dim, 10, 'sans-serif', step);
      axisElements.titles.push(
        drawAxisTitle(
          svg,
          xScales[i],
          margin.top - 30,
          dim,
          i,
          maxTitleLength,
          dimensions.length,
          showCustomTooltip,
          hideCustomTooltip,
          contextMenuAxes
        )
      );

      axisElements.invertIcons.push(
        drawAxisInvertIcon(
          svg,
          xScales[i] - 8,
          margin.top - 28,
          i,
          handleOnInvertAxesClick,
          dimensionsMetadata.get(dim)?.inverted
        )
      );

      const axisFilter = axesFilters.get(dim) as AxesFilterType;
      axisElements.upperFilters.push(
        drawAxisUpperFilter(
          svg,
          xScales[i] - 8,
          axisFilter.pixels.start + margin.top - 16,
          dimensionsMetadata.get(dim)?.showFilter
        )
      );

      axisElements.lowerFilters.push(
        drawAxisLowerFilter(
          svg,
          xScales[i] - 8,
          axisFilter.pixels.end + margin.top,
          dimensionsMetadata.get(dim)?.showFilter
        )
      );

      if ($dimensionDataStore.get(dim)?.type === 'numerical' && dimensionsMetadata.get(dim)?.showFilterValues) {
        const upperFilterValue = getAxisDomainValue(
          i,
          axisFilter.percentages.start as number,
          yScales,
          dimensions,
          $dimensionDataStore.get(dimensions[i])?.numberOfDecimals
        );
        axisElements.upperFilterValues.push(
          drawAxisUpperFilterValue(
            svg,
            xScales[i] + 8,
            axisFilter.pixels.start + margin.top - 10,
            !dimensionsMetadata.get(dim)?.showFilter || (axisFilter.percentages.start as number) <= 0,
            upperFilterValue
          )
        );

        const lowerFilterValue = getAxisDomainValue(
          i,
          axisFilter.percentages.end as number,
          yScales,
          dimensions,
          $dimensionDataStore.get(dimensions[i])?.numberOfDecimals
        );
        axisElements.lowerFilterValues.push(
          drawAxisLowerFilterValue(
            svg,
            xScales[i] + 8,
            axisFilter.pixels.end + margin.top - 4,
            !dimensionsMetadata.get(dim)?.showFilter || (axisFilter.percentages.end as number) >= 1,
            lowerFilterValue
          )
        );
      } else {
        axisElements.upperFilterValues.push(null);
        axisElements.lowerFilterValues.push(null);
      }

      axisElements.filterRectangles.push(
        drawAxisFilterRectangle(
          svg,
          xScales[i] - 6,
          margin.top + axisFilter.pixels.start,
          12,
          axisFilter.pixels.end - axisFilter.pixels.start,
          () => {
            isInteractableStore.set(false);
            setTooltipData({
              visible: false,
              clientX: 0,
              clientY: 0,
              text: []
            });
          },
          () => {
            isInteractableStore.set(true);
          },
          (axisFilter.percentages.start as number) > 0 || (axisFilter.percentages.end as number) < 1,
          dimensionsMetadata.get(dim)?.showFilter
        )
      );
    });

    handleAxesDragging();
    handleFilterRectDragging();
    handleUpperFilterDragging();
    handleLowerFilterDragging();
  }

  function handleAxesDragging() {
    let draggingIndex = -1;

    dimensions.forEach((dim: string) => {
      // Add drag behavior to the axis title
      const dragBehavior = drag<SVGTextElement, unknown, any>()
        .subject(() => ({ x: xScales[dimensions.indexOf(dim)], y: margin.top - 20 }))
        .on('start', (event) => {
          isInteractableStore.set(false);
          draggingIndex = dimensions.indexOf(dim);
          event.subject.x = xScales[dimensions.indexOf(dim)];
          isCurrentlyFiltering = true;
        })
        .on('drag', (event) => {
          const minX = margin.left;
          const maxX = width - margin.right;
          const newX = Math.max(minX, Math.min(maxX, event.x)); // Clamp the x position within the valid range

          moveDraggedAxis(draggingIndex, newX, margin.top, axisElements, axesFilters, dimensionsMetadata, dimensions);

          checkAutoscroll(event.sourceEvent.clientX);

          // Set new index for swapping if needed
          let newIndex = draggingIndex;
          if (newX <= xScales[draggingIndex - 1]) newIndex--;
          else if (newX >= xScales[draggingIndex + 1]) newIndex++;

          if (newIndex !== draggingIndex) {
            handleAxesSwapped(draggingIndex, newIndex);
            swapAxes(
              newIndex,
              draggingIndex,
              newX,
              xScales,
              margin.top,
              axisElements,
              axesFilters,
              dimensionsMetadata,
              dimensions,
              visibleDimensions
            );

            parcoordVisibleDimensionsStore.set(visibleDimensions);

            if ((newIndex === 0 && draggingIndex === 1) || (newIndex === 1 && draggingIndex === 0)) {
              setTimeout(() => {
                calculateMarginLeft();
              }, 0);
            }

            draggingIndex = newIndex;
          }
        })
        .on('end', () => {
          isInteractableStore.set(true);
          endAxisDragging(
            draggingIndex,
            xScales,
            margin.top,
            axisElements,
            axesFilters,
            dimensionsMetadata,
            dimensions,
            isCurrentlyFiltering
          );

          if (autoscrollInterval !== null) {
            clearInterval(autoscrollInterval);
            autoscrollInterval = null;
          }
        });

      axisElements.titles[dimensions.indexOf(dim)]?.call(dragBehavior);
    });
  }

  function checkAutoscroll(x: number) {
    const parcoordDiv = select('.view-parcoord');
    const rect = (parcoordDiv.node() as any).getBoundingClientRect();

    if (autoscrollInterval !== null) {
      clearInterval(autoscrollInterval);
      autoscrollInterval = null;
    }

    if (x > rect.right) autoscrollInterval = setInterval(() => handleAutoscroll('right'), 100);
    else if (x <= rect.left) autoscrollInterval = setInterval(() => handleAutoscroll('left'), 100);
  }

  function showCustomTooltip(event: MouseEvent, axisTitle: string) {
    if (isCurrentlyFiltering) return;
    setTooltipAxisTitleData({
      visible: true,
      clientX: event.clientX,
      clientY: event.clientY,
      text: [axisTitle]
    });
  }

  function hideCustomTooltip() {
    setTooltipAxisTitleData({
      visible: false,
      clientX: 0,
      clientY: 0,
      text: ['']
    });
  }

  function handleUpperFilterDragging() {
    dimensions.forEach((dim: string, i: number) => {
      const dragBehavior = drag<SVGSVGElement, unknown, any>()
        .on('start', () => {
          isInteractableStore.set(false);
        })
        .on('drag', (event) => {
          const axisFilter = axesFilters.get(dim) as AxesFilterType;
          const minY = margin.top - 8;
          const maxY = axisFilter.pixels.end + margin.top - 8;
          const newY = Math.max(minY, Math.min(maxY, event.y)); // Clamp the y position within the valid range

          dragUpperFilter(
            i,
            newY,
            xScales,
            yScales,
            margin.top,
            axisHeight,
            axisElements,
            axesFilters,
            dimensions,
            $dimensionDataStore.get(dimensions[i])?.numberOfDecimals
          );

          filtersArray.set(axesFilters);
        })
        .on('end', () => {
          isInteractableStore.set(true);
        });

      axisElements.upperFilters[dimensions.indexOf(dim)]?.call(dragBehavior);
    });
  }

  function handleLowerFilterDragging() {
    dimensions.forEach((dim: string, i: number) => {
      const dragBehavior = drag<SVGSVGElement, unknown, any>()
        .on('start', () => {
          isInteractableStore.set(false);
        })
        .on('drag', (event) => {
          const axisFilter = axesFilters.get(dim) as AxesFilterType;
          const minY = axisFilter.pixels.start + margin.top + 8;
          const maxY = height - margin.bottom + 8;
          const newY = Math.max(minY, Math.min(maxY, event.y)); // Clamp the y position within the valid range

          dragLowerFilter(
            i,
            newY,
            xScales,
            yScales,
            margin.top,
            axisHeight,
            axisElements,
            axesFilters,
            dimensions,
            $dimensionDataStore.get(dimensions[i])?.numberOfDecimals
          );

          filtersArray.set(axesFilters);
        })
        .on('end', () => {
          isInteractableStore.set(true);
        });

      axisElements.lowerFilters[dimensions.indexOf(dim)]?.call(dragBehavior);
    });
  }

  function handleFilterRectDragging() {
    dimensions.forEach((dim: string, i: number) => {
      let startY = 0;
      let rectangleStart: number;
      const dragBehavior = drag<SVGRectElement, unknown, any>()
        .on('start', (event) => {
          isInteractableStore.set(false);
          startY = event.y;
          rectangleStart = +axisElements.filterRectangles[i].attr('y');
        })
        .on('drag', (event) => {
          let newY = rectangleStart + (event.y - startY);
          let filterHeight = +axisElements.filterRectangles[i].attr('height');
          if (newY <= margin.top) newY = margin.top - 1;
          else if (newY + filterHeight >= height - margin.bottom + 1) newY = height - filterHeight - margin.bottom + 1;

          dragFilterRectangle(
            i,
            newY,
            filterHeight,
            xScales,
            yScales,
            margin.top,
            axisHeight,
            axisElements,
            axesFilters,
            dimensions,
            filtersArray,
            $dimensionDataStore.get(dimensions[i])?.numberOfDecimals
          );
        })
        .on('end', () => {
          isInteractableStore.set(true);
          startY = 0;
        });

      axisElements.filterRectangles[dimensions.indexOf(dim)]?.call(dragBehavior);
    });
  }

  export const drawSelectionShape = (points?: CoordinateType[]) => {
    const svg = select('#parcoord-canvas-axes');
    svg.selectAll('#parcoord-selection-shape').remove();

    if (!points) return;

    const lineGenerator = line()
      .x((d: number[]) => d[0])
      .y((d: number[]) => d[1]);

    svg
      .append('path')
      .datum(points.map((point) => [point.x, point.y]))
      .attr('id', `parcoord-selection-shape`)
      .attr('fill', 'none')
      .attr('stroke', 'black')
      .attr('stroke-width', 0.5)
      .attr('stroke-dasharray', '3, 3')
      .attr('d', lineGenerator as any);
  };

  export function handleOnInvertAxesClick(i: number) {
    handleInvertAxis(i);

    const dim = dimensions[i];
    const axisData = dimensionsMetadata.get(dim);
    if (!axisData) return;
    axisData.inverted = !axisData.inverted;
    dimensionsMetadata.set(dim, axisData);

    const axisFilter = axesFilters.get(dim) as AxesFilterType;
    const temp = axisFilter.pixels.end;
    axisFilter.pixels.end = axisHeight - axisFilter.pixels.start;
    axisFilter.pixels.start = axisHeight - temp;
    axisFilter.percentages.start = axisFilter.pixels.start / axisHeight;
    axisFilter.percentages.end = axisFilter.pixels.end / axisHeight;

    parcoordDimMetadata.set(dimensionsMetadata);
    axesFilters.set(dim, axisFilter);
    filtersArray.set(axesFilters);
  }

  export function calculateMarginLeft() {
    if (dimensionsMetadata.get(dimensions[0])?.showLabels) {
      const longestStringWidth =
        getTextWidth($dimensionDataStore.get(dimensions[0])?.longestString ?? '', 12, 'sans-serif') + 8;
      margin.left = longestStringWidth < 100 ? (longestStringWidth < 30 ? 30 : longestStringWidth) : 100;
    } else margin.left = 30;

    handleMarginChanged();
  }

  export function resetAxisFilter(dim: string) {
    axesFilters.set(dim, {
      pixels: {
        start: 0,
        end: axisHeight
      },
      percentages: {
        start: 0,
        end: 1
      }
    });

    filtersArray.set(axesFilters);
    clearSVG();
    renderAxes();
  }

  function initAxesFilters() {
    const axesFiltersNew: Map<string, AxesFilterType> = new Map();
    visibleDimensions.forEach((dim) =>
      axesFiltersNew.set(dim.title, {
        pixels: {
          start: 0,
          end: axisHeight
        },
        percentages: {
          start: 0,
          end: 1
        }
      })
    );
    axesFilters = axesFiltersNew;

    filtersArray.set(axesFilters);

    dimensionsMetadata = new Map(
      dimensions.map((dim) => [
        dim,
        {
          inverted: false,
          showLabels: true,
          showHistograms: true,
          showFilter: true,
          showFilterValues: true,
          binNo: null
        }
      ])
    );
  }

  export function resizeFilters() {
    axisHeight = height - margin.top - margin.bottom;
    dimensions.forEach((dim) => {
      const axisFilter = axesFilters.get(dim) as AxesFilterType;
      axisFilter.pixels = {
        start: (axisFilter.percentages.start as number) * axisHeight,
        end: (axisFilter.percentages.end as number) * axisHeight
      };
      axesFilters.set(dim, axisFilter);
    });

    filtersArray.set(axesFilters);
  }

  export const saveSVG = () => {
    const svgElement = document.getElementById('parcoord-canvas-axes');
    if (!svgElement) return;
    const serializer = new XMLSerializer();
    return serializer.serializeToString(svgElement);
  };

  onMount(() => {
    isMounted = true;
    initAxesFilters();
    calculateMarginLeft();
  });

  afterUpdate(async () => {
    if (datasetUploaded) {
      initAxesFilters();
      calculateMarginLeft();
      datasetUploaded = false;
    }
    resizeFilters();
    clearSVG();
    renderAxes();
  });

  onDestroy(() => {
    unsubscribeParcoordVisibleDimensions();
    unsubscribeDimData();
    unsubscribeFilters();
    unsubscribeDataset();
  });
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<svg
  id="parcoord-canvas-axes"
  {width}
  {height}
  style="background-color: rgba(255, 255, 255, 0); position: absolute; top: 0; right: 0; bottom: 0; left: 0; z-index: 3; user-select: none; cursor: {isDragging
    ? 'crosshair'
    : 'default'};"
  on:contextmenu={(e) => {
    e.preventDefault();
  }}
/>
