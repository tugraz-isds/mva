<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { datasetStore, dimensionDataStore } from '../../stores/dataset';
  import Axes from './axes/Axes.svelte';
  import Points from './points/Points.svelte';
  import { xDimStore, yDimStore } from '../../stores/scatterplot';
  import type { DimensionDataType, MarginType } from '../../util/types';
  import type { DSVParsedArray } from 'd3-dsv';

  const TILE_SIZE = 60;

  let width: number;
  let originalWidth: number;
  let numericalDimensions: string[] = [];
  let activeDim: { x: number; y: number } = { x: 0, y: 0 };
  let hoveredDim: { x: number; y: number };
  let splomDiv: HTMLDivElement;

  let margin: MarginType = { top: 20, right: 2, bottom: 5, left: 20 };

  $: {
    if (width && width < TILE_SIZE * numericalDimensions.length + margin.left + margin.right)
      width = TILE_SIZE * numericalDimensions.length + margin.left + margin.right;
  }

  let gridSize = 0;
  $: gridSize = width - margin.left - margin.right;

  let dataset: DSVParsedArray<any>;
  const unsubscribeDataset = datasetStore.subscribe((value: any) => {
    dataset = value;
  });

  const unsubscribeDimensionData = dimensionDataStore.subscribe(
    (value: Map<string, DimensionDataType>) => {
      if (value?.size === 0) return;
      const numericalDimensionsNew = Array.from(value.keys()).filter(
        (dim) => value.get(dim)?.active && value.get(dim)?.type === 'numerical'
      );
      activeDim.x = numericalDimensionsNew.findIndex(
        (dim) => dim === numericalDimensions[activeDim.x]
      );
      activeDim.y = numericalDimensionsNew.findIndex(
        (dim) => dim === numericalDimensions[activeDim.y]
      );
      numericalDimensions = numericalDimensionsNew;
    }
  );

  const unsubscribeXDim = xDimStore.subscribe((value: string) => {
    activeDim.x = numericalDimensions.findIndex((dim) => dim === value);
  });

  const unsubscribeYDim = yDimStore.subscribe((value: string) => {
    activeDim.y = numericalDimensions.findIndex((dim) => dim === value);
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

    const spacing = gridSize / numericalDimensions.length;
    const xIndex = Math.floor((event.offsetX - margin.left) / spacing);
    const yIndex = Math.floor((event.offsetY - margin.top) / spacing);

    if (
      xIndex < 0 ||
      xIndex >= numericalDimensions.length ||
      yIndex < 0 ||
      yIndex >= numericalDimensions.length
    )
      return;
    activeDim = {
      x: xIndex,
      y: yIndex
    };
    xDimStore.set(numericalDimensions[activeDim.x]);
    yDimStore.set(numericalDimensions[activeDim.y]);
  }

  function handleMouseMove(event: MouseEvent) {
    if (isScrollbarHovered(event.clientX, event.clientY)) {
      hoveredDim = {
        x: -1,
        y: -1
      };
      return;
    }

    const spacing = gridSize / numericalDimensions.length;
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
  });
</script>

<!-- <div
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
    <Axes dimensions={numericalDimensions} size={width - 12} {margin} {activeDim} {hoveredDim} />
    <Points {dataset} dimensions={numericalDimensions} size={width - 12} {margin} />
  {/if}
</div> -->

<style>
  .scrollable-div {
    scrollbar-width: thin;
  }

  .scrollable-div::-webkit-scrollbar {
    height: 12px;
  }
</style>
