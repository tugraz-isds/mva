<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { datasetStore, dimensionDataStore } from '../../stores/dataset';
  import Axes from './axes/Axes.svelte';
  import AxesOverview from './axes/AxesOverview.svelte';
  import Points from './points/Points.svelte';
  import SvgExportModal from '../svg-exporter/SvgExportModal.svelte';
  import { xDimStore, yDimStore } from '../../stores/scatterplot';
  import { showSplomOverviewStore } from '../../stores/splom';
  import { SPLOM_SHOWN_DIMENSIONS_NUM } from './util';
  import type { CoordinateType, MarginType } from '../../util/types';
  import type { DSVParsedArray } from 'd3-dsv';

  let width: number;
  let height: number;
  let numericalDimensions: string[] = [];
  let visibleDimensionsX: string[] = [];
  let visibleDimensionsY: string[] = [];
  let visibleDimensionsStart: CoordinateType;
  let activeDim: CoordinateType = { x: 0, y: 0 };
  let activeDimName = { x: '', y: '' };
  let hoveredDim: CoordinateType;
  let splomDiv: HTMLDivElement;
  let pointsComponent: Points;
  let axesComponent: Axes;
  let svgExportModal: SvgExportModal;
  let isSvgExportModalOpen = false;

  let margin: MarginType = { top: 40, right: 20, bottom: 50, left: 40 };

  let gridSize = 0;
  $: gridSize = width - margin.left - margin.right;

  $: {
    if (visibleDimensionsStart) {
      visibleDimensionsX = numericalDimensions.slice(
        visibleDimensionsStart.x,
        visibleDimensionsStart.x + SPLOM_SHOWN_DIMENSIONS_NUM
      );
      visibleDimensionsY = numericalDimensions.slice(
        visibleDimensionsStart.y,
        visibleDimensionsStart.y + SPLOM_SHOWN_DIMENSIONS_NUM
      );
      findActiveDim();
    }
  }

  $: {
    if (
      visibleDimensionsX.length === numericalDimensions.length &&
      visibleDimensionsY.length === numericalDimensions.length
    )
      margin = { top: 20, right: 20, bottom: 50, left: 20 };
    else margin = { top: 40, right: 20, bottom: 50, left: 40 };
  }

  let dataset: DSVParsedArray<any>;
  const unsubscribeDataset = datasetStore.subscribe((value) => {
    dataset = value as DSVParsedArray<any>;
    visibleDimensionsStart = { x: 0, y: 0 };
  });

  const unsubscribeDimensionData = dimensionDataStore.subscribe((value) => {
    if (value?.size === 0) return;
    const numericalDimensionsNew = Array.from(value.keys()).filter(
      (dim) => value.get(dim)?.active && value.get(dim)?.type === 'numerical'
    );
    visibleDimensionsStart && checkVisibleDimensions(numericalDimensionsNew);
    numericalDimensions = numericalDimensionsNew;
    findActiveDim();
  });

  const unsubscribeXDim = xDimStore.subscribe((value) => {
    activeDimName.x = value;
    activeDim.x = visibleDimensionsX.findIndex((dim) => dim === value);
  });

  const unsubscribeYDim = yDimStore.subscribe((value) => {
    activeDimName.y = value;
    activeDim.y = visibleDimensionsY.findIndex((dim) => dim === value);
  });

  function findActiveDim() {
    activeDim = {
      x: visibleDimensionsX.findIndex((dim) => dim === activeDimName.x),
      y: visibleDimensionsY.findIndex((dim) => dim === activeDimName.y)
    };
  }

  function checkVisibleDimensions(numericalDimensionsNew: string[]) {
    // Dimension was added
    if (numericalDimensionsNew.length === numericalDimensions.length + 1) {
      visibleDimensionsX = smartSlice(numericalDimensionsNew, visibleDimensionsStart.x);
      visibleDimensionsY = smartSlice(numericalDimensionsNew, visibleDimensionsStart.y);
    }
    // Dimension was removed
    else if (numericalDimensionsNew.length === numericalDimensions.length - 1) {
      const removedDim = numericalDimensions.filter((x) => !numericalDimensionsNew.includes(x))[0];
      if (!visibleDimensionsX.includes(removedDim) && !visibleDimensionsY.includes(removedDim)) return;
      visibleDimensionsX = smartSlice(numericalDimensionsNew, visibleDimensionsStart.x);
      visibleDimensionsY = smartSlice(numericalDimensionsNew, visibleDimensionsStart.y);
    }
  }

  function smartSlice(dims: string[], start: number) {
    let endIndex = start + SPLOM_SHOWN_DIMENSIONS_NUM;
    if (endIndex > dims.length) start = Math.max(0, dims.length - SPLOM_SHOWN_DIMENSIONS_NUM);
    return dims.slice(start, start + SPLOM_SHOWN_DIMENSIONS_NUM);
  }

  let showOverview: boolean;
  const unsubscribeShowOverview = showSplomOverviewStore.subscribe((value) => {
    showOverview = value;
  });

  function setVisibleDim(x?: number, y?: number) {
    if (x !== undefined) visibleDimensionsStart.x = x;
    if (y !== undefined) visibleDimensionsStart.y = y;
  }

  function isScrollbarHovered(x: number, y: number) {
    const hasVerticalScrollbar = splomDiv?.scrollHeight > height;
    const hasHorizontalScrollbar = splomDiv?.scrollWidth > splomDiv.clientWidth;
    const divRect = splomDiv.getBoundingClientRect();
    const mouseX = x - divRect.left;
    const mouseY = y - divRect.top;
    return (
      (hasVerticalScrollbar && height - mouseY < 0) || (hasHorizontalScrollbar && splomDiv.clientWidth - mouseX < 0)
    );
  }

  function handleMouseDown(event: MouseEvent) {
    if (
      hoveredDim.x < 0 ||
      hoveredDim.x >= visibleDimensionsX.length ||
      hoveredDim.y < 0 ||
      hoveredDim.y >= visibleDimensionsX.length ||
      isScrollbarHovered(event.clientX, event.clientY) ||
      visibleDimensionsX[hoveredDim.x] === visibleDimensionsY[hoveredDim.y]
    )
      return;

    activeDim = hoveredDim;
    xDimStore.set(visibleDimensionsX[activeDim.x]);
    yDimStore.set(visibleDimensionsY[activeDim.y]);
  }

  function handleMouseMove(event: MouseEvent) {
    if (isScrollbarHovered(event.clientX, event.clientY)) {
      hoveredDim = {
        x: -1,
        y: -1
      };
      return;
    }

    const spacing = gridSize / visibleDimensionsX.length;
    const xIndex = Math.floor((event.offsetX - margin.left) / spacing);
    const yIndex = Math.floor((event.offsetY - margin.top) / spacing);

    hoveredDim = {
      x: xIndex,
      y: yIndex
    };
  }

  export function saveSVG() {
    let pointsStringSvg = pointsComponent?.saveSVG();
    let axesStringSvg = axesComponent?.saveSVG();
    if (!axesStringSvg || !pointsStringSvg) return;

    isSvgExportModalOpen = false;
    isSvgExportModalOpen = true;

    pointsStringSvg = pointsStringSvg.replace(/<svg[^>]*>/, '<g>').replace(/<\/svg>/, '</g>');
    axesStringSvg = axesStringSvg.replace(/<svg([^>]*)>/, '<g>').replace(/<\/svg>/, '</g>');

    const svgString =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${splomDiv.scrollHeight}">` +
      '\n<!-- Points -->\n' +
      pointsStringSvg +
      '\n<!-- Axes -->\n' +
      axesStringSvg +
      '\n</svg>';

    svgExportModal.setSvgString(svgString, 'splom');
  }

  onMount(() => {
    window.addEventListener('call-save-svg-splom', saveSVG);
  });

  onDestroy(() => {
    unsubscribeDataset();
    unsubscribeDimensionData();
    unsubscribeXDim();
    unsubscribeYDim();
    unsubscribeShowOverview();
  });
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  id="splom-canvas"
  class="w-full h-full scrollable-div"
  bind:this={splomDiv}
  bind:clientWidth={width}
  bind:clientHeight={height}
  on:mousedown={handleMouseDown}
  on:mousemove={handleMouseMove}
  on:mouseleave={() => (hoveredDim = { x: -1, y: -1 })}
  on:contextmenu={(e) => {
    e.preventDefault();
  }}
>
  {#if dataset?.length > 0 && width > 0}
    <Axes
      bind:this={axesComponent}
      dimensionsX={visibleDimensionsX}
      dimensionsY={visibleDimensionsY}
      {numericalDimensions}
      {visibleDimensionsStart}
      size={Math.max(width, splomDiv ? height : 0) - 12}
      {margin}
      {activeDim}
      {hoveredDim}
      {setVisibleDim}
    />
    <Points
      bind:this={pointsComponent}
      {dataset}
      dimensionsX={visibleDimensionsX}
      dimensionsY={visibleDimensionsY}
      size={Math.max(width, splomDiv ? height : 0) - 12}
      {margin}
    />
  {/if}
</div>

{#if dataset?.length > 0 && width > 0 && showOverview}
  <div
    style="position: fixed; left: {splomDiv?.offsetLeft +
      splomDiv?.clientWidth +
      20}px; top: {splomDiv?.offsetTop}px; width: 200px; height: 200px; z-index: 11;"
    class="bg-gray-100 border border-black"
  >
    <AxesOverview
      dimensions={numericalDimensions}
      size={200}
      {activeDimName}
      {visibleDimensionsStart}
      {hoveredDim}
      {setVisibleDim}
    />
  </div>
{/if}

<SvgExportModal bind:this={svgExportModal} isOpen={isSvgExportModalOpen} />

<style>
  .scrollable-div {
    scrollbar-width: thin;
  }

  .scrollable-div::-webkit-scrollbar {
    height: 12px;
  }
</style>
