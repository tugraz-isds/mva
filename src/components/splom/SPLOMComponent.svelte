<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { datasetStore, dimensionDataStore } from '../../stores/dataset';
  import Axes from './axes/Axes.svelte';
  import Points from './points/Points.svelte';
  import { xDimStore, yDimStore } from '../../stores/scatterplot';
  import { splomXDimensionsStore, splomYDimensionsStore } from '../../stores/splom';
  import { SPLOM_DIMENSIONS_NUM } from './util';
  import type { CoordinateType, MarginType } from '../../util/types';
  import type { DSVParsedArray } from 'd3-dsv';

  let width: number;
  let originalWidth: number;
  let numericalDimensions: string[] = [];
  let activeDimensionsX: string[] = [];
  let activeDimensionsY: string[] = [];
  let activeDim: CoordinateType = { x: 0, y: 0 };
  let hoveredDim: CoordinateType;
  let splomDiv: HTMLDivElement;

  let margin: MarginType = { top: 20, right: 2, bottom: 5, left: 20 };

  let gridSize = 0;
  $: gridSize = width - margin.left - margin.right;

  let dataset: DSVParsedArray<any>;
  const unsubscribeDataset = datasetStore.subscribe((value) => {
    dataset = value as DSVParsedArray<any>;
    splomXDimensionsStore.set(0);
    splomYDimensionsStore.set(0);
  });

  const unsubscribeDimensionData = dimensionDataStore.subscribe((value) => {
    if (value?.size === 0) return;
    const numericalDimensionsNew = Array.from(value.keys()).filter(
      (dim) => value.get(dim)?.active && value.get(dim)?.type === 'numerical'
    );
    numericalDimensions = numericalDimensionsNew;
    activeDim.x = numericalDimensions.findIndex((dim) => dim === activeDimensionsX[activeDim.x]);
    activeDim.y = numericalDimensions.findIndex((dim) => dim === activeDimensionsX[activeDim.y]);
    activeDimensionsX = numericalDimensions.slice(0, SPLOM_DIMENSIONS_NUM);
  });

  const unsubscribeXDim = xDimStore.subscribe((value) => {
    activeDim.x = activeDimensionsX.findIndex((dim) => dim === value);
  });

  const unsubscribeYDim = yDimStore.subscribe((value) => {
    activeDim.y = activeDimensionsX.findIndex((dim) => dim === value);
  });

  let splomXStart: number;
  const unsubscribeStartXDim = splomXDimensionsStore.subscribe((value) => {
    if (splomXStart < value) activeDim.x--;
    else activeDim.x++;
    splomXStart = value;
    activeDimensionsX = numericalDimensions.slice(splomXStart, splomXStart + SPLOM_DIMENSIONS_NUM);
  });

  let splomYStart: number;
  const unsubscribeStartYDim = splomYDimensionsStore.subscribe((value) => {
    if (splomYStart < value) activeDim.y--;
    else activeDim.y++;
    splomYStart = value;
    activeDimensionsY = numericalDimensions.slice(splomYStart, splomYStart + SPLOM_DIMENSIONS_NUM);
  });

  function isScrollbarHovered(x: number, y: number) {
    const hasVerticalScrollbar = splomDiv.scrollHeight > splomDiv.clientHeight;
    const hasHorizontalScrollbar = splomDiv.scrollWidth > splomDiv.clientWidth;
    const divRect = splomDiv.getBoundingClientRect();
    const mouseX = x - divRect.left;
    const mouseY = y - divRect.top;
    return (
      (hasVerticalScrollbar && splomDiv.clientHeight - mouseY < 0) ||
      (hasHorizontalScrollbar && splomDiv.clientWidth - mouseX < 0)
    );
  }

  function handleMouseDown(event: MouseEvent) {
    if (isScrollbarHovered(event.clientX, event.clientY)) return;

    const spacing = gridSize / activeDimensionsX.length;
    const xIndex = Math.floor((event.offsetX - margin.left) / spacing);
    const yIndex = Math.floor((event.offsetY - margin.top) / spacing);

    if (xIndex < 0 || xIndex >= activeDimensionsX.length || yIndex < 0 || yIndex >= activeDimensionsX.length) return;
    activeDim = {
      x: xIndex,
      y: yIndex
    };
    xDimStore.set(activeDimensionsX[activeDim.x]);
    yDimStore.set(activeDimensionsX[activeDim.y]);
  }

  function handleMouseMove(event: MouseEvent) {
    if (isScrollbarHovered(event.clientX, event.clientY)) {
      hoveredDim = {
        x: -1,
        y: -1
      };
      return;
    }

    const spacing = gridSize / activeDimensionsX.length;
    const xIndex = Math.floor((event.offsetX - margin.left) / spacing);
    const yIndex = Math.floor((event.offsetY - margin.top) / spacing);

    hoveredDim = {
      x: xIndex,
      y: yIndex
    };
  }

  onMount(() => {
    originalWidth = splomDiv.clientWidth;
  });

  onDestroy(() => {
    unsubscribeDataset();
    unsubscribeDimensionData();
    unsubscribeXDim();
    unsubscribeYDim();
    unsubscribeStartXDim();
    unsubscribeStartYDim();
  });
</script>

<div
  id="splom-canvas"
  class="w-full h-full overflow-x-auto overflow-y-auto scrollable-div"
  bind:this={splomDiv}
  bind:clientWidth={width}
  on:mousedown={handleMouseDown}
  on:mousemove={handleMouseMove}
  on:mouseleave={() => (hoveredDim = { x: -1, y: -1 })}
  on:contextmenu={(e) => {
    e.preventDefault();
  }}
>
  {#if dataset?.length > 0 && width > 0}
    <Axes
      dimensionsX={activeDimensionsX}
      dimensionsY={activeDimensionsY}
      size={width - 12}
      {margin}
      {activeDim}
      {hoveredDim}
    />
    <Points {dataset} dimensionsX={activeDimensionsX} dimensionsY={activeDimensionsY} size={width - 12} {margin} />
  {/if}
</div>

<style>
  .scrollable-div {
    scrollbar-width: thin;
  }

  .scrollable-div::-webkit-scrollbar {
    height: 12px;
  }
</style>
