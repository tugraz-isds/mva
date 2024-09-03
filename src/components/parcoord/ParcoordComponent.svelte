<script lang="ts">
  import { afterUpdate, onDestroy, onMount } from 'svelte';
  import { datasetStore, dimensionDataStore } from '../../stores/dataset';
  import { brushedArray } from '../../stores/brushing';
  import {
    parcoordCustomAxisRanges,
    parcoordDimMetadata,
    parcoordVisibleDimensionsStore,
    parcoordHistogramData,
    filtersArray
  } from '../../stores/parcoord';
  import { scaleLinear, scaleBand } from 'd3-scale';
  import Axes from './axes/Axes.svelte';
  import Histograms from './histograms/Histograms.svelte';
  import Lines from './lines/Lines.svelte';
  import Tooltip from '../tooltip/Tooltip.svelte';
  import ContextMenuAxes from './context-menu/ContextMenuAxes.svelte';
  import ContextMenuPartitions from '../partitions/ContextMenu.svelte';
  import SvgExportModal from '../svg-exporter/SvgExportModal.svelte';
  import type { DSVParsedArray } from 'd3-dsv';
  import type { AxesFilterType, CustomRangeType, ParcoordVisibleDimensionsType } from './types';
  import type { CoordinateType, DimensionDataType, MarginType, TooltipType } from '../../util/types';

  let isBrowser = false;

  let isSvgExportModalOpen = false;
  let width: number;
  let originalWidth: number;
  let height: number;
  let dimensions: string[] = [];
  let dimensionsInitial: string[] = [];

  let xScales: any[] = [];
  let yScales: any = {};

  let parcoordDiv: HTMLElement;
  let linesComponent: Lines;
  let axesComponent: Axes;
  let contextMenuAxes: ContextMenuAxes;
  let contextMenuPartitions: ContextMenuPartitions;
  let svgExportModal: SvgExportModal;

  let isDragging = false;
  let margin: MarginType = { top: 40, right: 40, bottom: 10, left: 50 };
  let tooltip: TooltipType = {
    visible: false,
    clientX: 0,
    clientY: 0,
    text: []
  };
  let tooltipMaxWidth: number | null = null;
  let tooltipColor: string;

  let customRanges: Map<string, CustomRangeType>;
  const unsubscribeCustomRanges = parcoordCustomAxisRanges.subscribe((value) => {
    customRanges = value;
    calculateYScales();
    setTimeout(() => {
      linesComponent?.drawLines();
    }, 0);
  });

  // Set dataset and handle new dataset upload
  let dataset: DSVParsedArray<any>;
  const unsubscribeDataset = datasetStore.subscribe((value) => {
    dataset = value as DSVParsedArray<any>;
    if (dataset?.length > 0) {
      setTimeout(() => {
        linesComponent?.resetLines();
        calculateYScales();
        calculateXScales();
      }, 0);

      dimensions.forEach((dim) => {
        customRanges && customRanges.set(dim, null);
        $parcoordDimMetadata.set(dim, {
          inverted: false,
          showLabels: true,
          showHistograms: true,
          showFilter: true,
          showFilterValues: true,
          binNo: null
        });
      });

      brushedArray.set(new Set<number>());

      setMarginRight($parcoordHistogramData.visible);

      if (parcoordDiv) parcoordDiv.scrollLeft = 0;
    }
  });

  let visibleDimensions: ParcoordVisibleDimensionsType[] = [];
  let dimensionData: Map<string, DimensionDataType> = new Map();
  const unsubscribeParcoordVisibleDimensions = parcoordVisibleDimensionsStore.subscribe((value) => {
    if (!value) return;
    visibleDimensions = value.filter((dim) => dim.title !== '_i' && dim.title !== '_partition');
    const newDimensions = visibleDimensions
      .filter((dim) => dim.visible && dimensionData.get(dim.title)?.active)
      .map((dim) => dim.title);

    const removedDims = dimensions.filter((x) => !newDimensions.includes(x));
    if (removedDims.length === 1) {
      const filter = $filtersArray.get(removedDims[0]) as AxesFilterType;
      filter.percentages = { start: 0, end: 1 };
      $filtersArray.set(removedDims[0], filter);
    }

    dimensions = newDimensions;

    setMarginLeft();
  });

  const unsubscribeDimensionData = dimensionDataStore.subscribe((value) => {
    if (value?.size === 0) return;
    dimensionData = value;
    dimensions = visibleDimensions
      .filter((dim) => dim.visible && dimensionData.get(dim.title)?.active)
      .map((dim) => dim.title);
    dimensionsInitial = dimensions;

    setMarginLeft();
  });

  let histogramsVisible: boolean;
  const unsubscribeHistograms = parcoordHistogramData.subscribe((value) => {
    histogramsVisible = value.visible;
    setMarginRight(histogramsVisible);
  });

  $: width =
    originalWidth < 100 * dimensions.length + margin.left + margin.right
      ? 100 * dimensions.length + margin.left + margin.right
      : originalWidth;

  $: {
    if (height > 0 && dataset?.length > 0 && dimensions === dimensionsInitial) {
      calculateYScales();
    }
  }

  $: {
    if (margin && width > 0 && dataset?.length > 0 && dimensions) {
      calculateXScales();
    }
  }

  function calculateYScales() {
    if (height > 0 && dataset?.length > 0) {
      yScales = dimensions.reduce((acc: any, dim: string) => {
        if ($dimensionDataStore.get(dim)?.type === 'numerical') {
          if (customRanges.get(dim) === null) {
            acc[dim] = scaleLinear()
              .domain([$dimensionDataStore.get(dim)?.min, $dimensionDataStore.get(dim)?.max] as [number, number])
              .range([height - margin.top - margin.bottom, 0]);
            if ($parcoordDimMetadata.get(dim)?.inverted) acc[dim].domain(acc[dim].domain().reverse());
          } else {
            acc[dim] = scaleLinear()
              .domain([customRanges.get(dim)?.start as number, customRanges.get(dim)?.end as number])
              .range([height - margin.top - margin.bottom, 0]);
          }
        } else {
          const categoricalValues = [...new Set(dataset.map((d: any) => d[dim]))];
          acc[dim] = scaleBand()
            .domain(categoricalValues.reverse())
            .range([height - margin.top - margin.bottom, 0]);
        }
        return acc;
      }, {});
    }
  }

  function calculateXScales() {
    xScales = dimensions.map((_, i) =>
      scaleLinear()
        .domain([0, dimensions.length - 1])
        .range([margin.left, width - margin.right])(i)
    );

    $parcoordHistogramData.widthLimits.max = xScales[1] - xScales[0];
  }

  function handleAxesSwapped(fromIndex: number, toIndex: number) {
    linesComponent.swapPoints(fromIndex, toIndex);
  }

  function handleMarginChanged() {
    width =
      originalWidth < 100 * dimensions.length + margin.left + margin.right
        ? 100 * dimensions.length + margin.left + margin.right
        : originalWidth;
    setTimeout(() => {
      axesComponent?.clearSVG();
      axesComponent?.renderAxes(width);
      linesComponent.debounceDrawLines();
    }, 0);
  }

  function handleAutoscroll(direction: 'left' | 'right') {
    if (!parcoordDiv) return;
    if (direction === 'right') parcoordDiv.scrollLeft += 10;
    else if (direction === 'left') parcoordDiv.scrollLeft -= 10;
  }

  function handleInvertAxis(axisIndex: number) {
    yScales[dimensions[axisIndex]] = yScales[dimensions[axisIndex]].domain(
      yScales[dimensions[axisIndex]].domain().reverse()
    );
    linesComponent.handleInvertAxis(axisIndex);
  }

  function handleHideDimension(idx: number) {
    idx === 0 && setMarginLeft();
    setTimeout(() => {
      linesComponent.drawLines();
    }, 0);
  }

  function setTooltipData(data: TooltipType) {
    tooltip = data;
    tooltipMaxWidth = 120;
    tooltipColor = 'bg-gray-100';
  }

  function drawSelectionShape(points?: CoordinateType[]) {
    axesComponent?.drawSelectionShape(points);
  }

  function setTooltipAxisTitleData(data: TooltipType) {
    tooltip = {
      visible: data.visible,
      clientX: data.clientX,
      clientY: data.clientY,
      text: data.text
    };
    tooltipMaxWidth = null;
    tooltipColor = 'bg-gray-300';
  }

  function setMarginLeft() {
    setTimeout(() => {
      axesComponent?.calculateMarginLeft();
    }, 1000);
  }

  function setMarginRight(histogramsVisible: boolean) {
    const step = xScales[1] - xScales[0];
    if (!step) return;
    margin.right =
      histogramsVisible && $parcoordDimMetadata.get(dimensions[dimensions.length - 1])?.showHistograms
        ? 10 + (step - 16) * $parcoordHistogramData.width
        : 40;
  }

  function setMarginBottom(bottom: number) {
    const isFirefox = navigator.userAgent.includes('Firefox');
    const isSafari = navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome');
    if (!isFirefox && !isSafari) return;
    margin.bottom = bottom;
    calculateYScales();
    handleMarginChanged();
  }

  export function saveSVG() {
    let linesStringSvg = linesComponent.saveSVG();
    let axesStringSvg = axesComponent.saveSVG();
    if (!axesStringSvg || !linesStringSvg) return;

    isSvgExportModalOpen = false;
    isSvgExportModalOpen = true;

    linesStringSvg = linesStringSvg.replace(/<svg[^>]*>/, '<g>').replace(/<\/svg>/, '</g>');
    axesStringSvg = axesStringSvg.replace(/<svg([^>]*)>/, '<g>').replace(/<\/svg>/, '</g>');

    const svgString =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">` +
      '\n<!-- Lines -->\n' +
      linesStringSvg +
      '\n<!-- Axes -->\n' +
      axesStringSvg +
      '\n</svg>';

    svgExportModal.setSvgString(svgString, 'parcoord');
  }

  onMount(() => {
    calculateYScales();
    isBrowser = true;
    window.addEventListener('call-save-svg-parcoord', saveSVG);

    dimensions.forEach((dim) => {
      customRanges.set(dim, null);
      $parcoordDimMetadata.set(dim, {
        inverted: false,
        showLabels: true,
        showHistograms: true,
        showFilter: true,
        showFilterValues: true,
        binNo: null
      });
    });

    setTimeout(() => {
      parcoordHistogramData.set({
        visible: false,
        fillOpacity: 0.2,
        strokeOpacity: 0.3,
        width: 0.2,
        widthLimits: {
          min: 0,
          max: xScales[1] - xScales[0]
        }
      });
      setMarginRight(true);
    }, 0);
  });

  function handleContextMenu(e: MouseEvent) {
    if (e.offsetY > margin.top) contextMenuPartitions.showContextMenu(e);
  }

  afterUpdate(() => {
    if (parcoordDiv.scrollWidth > parcoordDiv.clientWidth && margin.bottom !== 20) {
      setMarginBottom(20);
    } else if (parcoordDiv.scrollWidth <= parcoordDiv.clientWidth && margin.bottom !== 10) {
      setMarginBottom(10);
    }
  });

  onDestroy(() => {
    unsubscribeParcoordVisibleDimensions();
    unsubscribeDataset();
    unsubscribeCustomRanges();
    unsubscribeDimensionData();
    unsubscribeHistograms();
    isBrowser && window.removeEventListener('call-save-svg-parcoord', saveSVG);
  });
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  id="parcoord-canvas"
  class="w-full h-full overflow-x-auto overflow-y-hidden scrollable-div"
  style="box-sizing: border-box;"
  bind:this={parcoordDiv}
  bind:clientWidth={originalWidth}
  bind:clientHeight={height}
  on:contextmenu={handleContextMenu}
>
  {#if dataset?.length === 0}
    <span>No data available.</span>
  {:else if yScales && Object.keys(yScales).length !== 0 && xScales && Object.keys(xScales).length !== 0}
    <Axes
      bind:this={axesComponent}
      bind:contextMenuAxes
      bind:width
      {height}
      {dimensions}
      bind:margin
      {handleAxesSwapped}
      {handleInvertAxis}
      {handleMarginChanged}
      {handleAutoscroll}
      {setTooltipAxisTitleData}
      {setTooltipData}
      {xScales}
      bind:yScales
      {isDragging}
    />

    {#if histogramsVisible}
      <Histograms {dataset} {width} {height} {dimensions} {margin} {xScales} {yScales} />
    {/if}

    <Tooltip data={tooltip} maxWidth={tooltipMaxWidth} color={tooltipColor} />

    <ContextMenuPartitions bind:this={contextMenuPartitions} />

    <ContextMenuAxes
      bind:this={contextMenuAxes}
      bind:axesComponent
      {xScales}
      bind:yScales
      bind:dimensions
      bind:margin
      {handleHideDimension}
      calculateMarginLeft={setMarginLeft}
    />

    <Lines
      bind:this={linesComponent}
      {dataset}
      {width}
      {height}
      {dimensions}
      bind:margin
      {xScales}
      {yScales}
      bind:isDragging
      {setTooltipData}
      {drawSelectionShape}
    />
  {/if}
</div>

<SvgExportModal bind:this={svgExportModal} isOpen={isSvgExportModalOpen} />

<style>
  .scrollable-div {
    scrollbar-width: thin;
  }

  .scrollable-div::-webkit-scrollbar {
    height: 0.75rem;
  }
</style>
