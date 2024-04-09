<script lang="ts">
  import { afterUpdate, onDestroy, onMount } from 'svelte';
  import { select } from 'd3-selection';
  import { drag } from 'd3-drag';
  import { filtersArray, parcoordDimMetadata } from '../../../stores/parcoord';
  import { isInteractableStore } from '../../../stores/brushing';
  import { datasetStore, dimensionDataStore } from '../../../stores/dataset';
  import { calculateMaxLength, getTextWidth } from '../../../util/text';
  import type ContextMenuAxes from '../context-menu/ContextMenuAxes.svelte';
  import type { AxesFilterType, AxisElementsType, DimensionMetadataType } from '../types';
  import type { MarginType, TooltipType } from '../../../util/types';
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

  let axisHeight: number;
  let axesFilters: AxesFilterType[] = [];
  let isCurrentlyFiltering = false;
  let datasetUploaded = false;
  let autoscrollInterval: number | null = null;

  $: axisHeight = height - margin.top - margin.bottom;

  let dimensionsMetadata: Map<string, DimensionMetadataType>;
  const unsubscribeDimData = parcoordDimMetadata.subscribe((value) => {
    if (axesFilters.length > 0) {
      dimensionsMetadata = value;
      clearSVG();
      renderAxes();
    }
  });

  const unsubscribeFilters = filtersArray.subscribe((value) => {
    if (
      !axesFilters ||
      !axisElements.upperFilters ||
      axesFilters.length === 0 ||
      axisElements.upperFilters.length === 0
    )
      return;

    let redrawAxes = false;
    if (axesFilters.length !== value.length) {
      redrawAxes = true;
      axesFilters = value;
    }
    dimensions.forEach((dim: string, i: number) => {
      if (value[i].percentages.start === null) {
        axesFilters[i].percentages.start = axesFilters[i].pixels.start / axisHeight;
        redrawAxes = true;
      }
      if (value[i].percentages.end === null) {
        axesFilters[i].percentages.end = axesFilters[i].pixels.end / axisHeight;
        redrawAxes = true;
      }
    });

    if (redrawAxes) {
      clearSVG();
      renderAxes();
    }
  });

  const unsubscribeDataset = datasetStore.subscribe(() => {
    if (!dimensionsMetadata) return;
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

      axisElements.upperFilters.push(
        drawAxisUpperFilter(
          svg,
          xScales[i] - 8,
          axesFilters[i].pixels.start + margin.top - 16,
          dimensionsMetadata.get(dim)?.showFilter
        )
      );

      axisElements.lowerFilters.push(
        drawAxisLowerFilter(
          svg,
          xScales[i] - 8,
          axesFilters[i].pixels.end + margin.top,
          dimensionsMetadata.get(dim)?.showFilter
        )
      );

      if ($dimensionDataStore.get(dim)?.type === 'numerical' && dimensionsMetadata.get(dim)?.showFilterValues) {
        const upperFilterValue = getAxisDomainValue(
          i,
          axesFilters[i].percentages.start as number,
          yScales,
          dimensions,
          $dimensionDataStore.get(dimensions[i])?.numberOfDecimals
        );
        axisElements.upperFilterValues.push(
          drawAxisUpperFilterValue(
            svg,
            xScales[i] + 8,
            axesFilters[i].pixels.start + margin.top - 10,
            !dimensionsMetadata.get(dim)?.showFilter || (axesFilters[i].percentages.start as number) <= 0,
            upperFilterValue
          )
        );

        const lowerFilterValue = getAxisDomainValue(
          i,
          axesFilters[i].percentages.end as number,
          yScales,
          dimensions,
          $dimensionDataStore.get(dimensions[i])?.numberOfDecimals
        );
        axisElements.lowerFilterValues.push(
          drawAxisLowerFilterValue(
            svg,
            xScales[i] + 8,
            axesFilters[i].pixels.end + margin.top - 4,
            !dimensionsMetadata.get(dim)?.showFilter || (axesFilters[i].percentages.end as number) >= 1,
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
          margin.top + axesFilters[i].pixels.start,
          12,
          axesFilters[i].pixels.end - axesFilters[i].pixels.start,
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
              dimensions
            );
            filtersArray.set(axesFilters);

            if ((newIndex === 0 && draggingIndex === 1) || (newIndex === 1 && draggingIndex === 0)) {
              calculateMarginLeft();
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
    dimensions.forEach((dim: string, idx: number) => {
      const dragBehavior = drag<SVGSVGElement, unknown, any>()
        .on('start', () => {
          isInteractableStore.set(false);
        })
        .on('drag', (event) => {
          const minY = margin.top - 8;
          const maxY = axesFilters[idx].pixels.end + margin.top - 8;
          const newY = Math.max(minY, Math.min(maxY, event.y)); // Clamp the y position within the valid range

          dragUpperFilter(
            idx,
            newY,
            xScales,
            yScales,
            margin.top,
            axisHeight,
            axisElements,
            axesFilters,
            dimensions,
            $dimensionDataStore.get(dimensions[idx])?.numberOfDecimals
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
    dimensions.forEach((dim: string, idx: number) => {
      const dragBehavior = drag<SVGSVGElement, unknown, any>()
        .on('start', () => {
          isInteractableStore.set(false);
        })
        .on('drag', (event) => {
          const minY = axesFilters[idx].pixels.start + margin.top + 8;
          const maxY = height - margin.bottom + 8;
          const newY = Math.max(minY, Math.min(maxY, event.y)); // Clamp the y position within the valid range

          dragLowerFilter(
            idx,
            newY,
            xScales,
            yScales,
            margin.top,
            axisHeight,
            axisElements,
            axesFilters,
            dimensions,
            $dimensionDataStore.get(dimensions[idx])?.numberOfDecimals
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

  export function handleOnInvertAxesClick(i: number) {
    handleInvertAxis(i);

    const dim = dimensions[i];
    const axisData = dimensionsMetadata.get(dim);
    if (!axisData) return;
    axisData.inverted = !axisData.inverted;
    dimensionsMetadata.set(dim, axisData);

    const temp = axesFilters[i].pixels.end;
    axesFilters[i].pixels.end = axisHeight - axesFilters[i].pixels.start;
    axesFilters[i].pixels.start = axisHeight - temp;
    axesFilters[i].percentages.start = axesFilters[i].pixels.start / axisHeight;
    axesFilters[i].percentages.end = axesFilters[i].pixels.end / axisHeight;

    parcoordDimMetadata.set(dimensionsMetadata);
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

  export function resetAxisFilter(idx: number) {
    axesFilters[idx] = {
      pixels: {
        start: 0,
        end: axisHeight
      },
      percentages: {
        start: 0,
        end: 1
      }
    };

    filtersArray.set(axesFilters);
    clearSVG();
    renderAxes();
  }

  function initAxesFilters() {
    axesFilters = dimensions.map(() => ({
      pixels: {
        start: 0,
        end: axisHeight
      },
      percentages: {
        start: 0,
        end: 1
      }
    }));

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
    dimensions.forEach((dim: string, i: number) => {
      axesFilters[i].pixels = {
        start: (axesFilters[i].percentages.start as number) * axisHeight,
        end: (axesFilters[i].percentages.end as number) * axisHeight
      };
    });

    filtersArray.set(axesFilters);
  }

  export const saveSVG = () => {
    const svgElement = document.getElementById('parcoord-canvas-axes');
    const serializer = new XMLSerializer();
    if (!svgElement) return;
    return serializer.serializeToString(svgElement);
  };

  onMount(() => {
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
    unsubscribeDimData();
    unsubscribeFilters();
    unsubscribeDataset();
  });
</script>

<svg
  id="parcoord-canvas-axes"
  {width}
  {height}
  style="background-color: rgba(255, 255, 255, 0); position: absolute; top: 0; right: 0; bottom: 0; left: 0; z-index: 3; user-select: none;"
  on:contextmenu={(e) => {
    e.preventDefault();
  }}
/>
