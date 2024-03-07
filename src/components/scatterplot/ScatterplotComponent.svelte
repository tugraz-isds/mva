<script lang="ts">
  import { onDestroy } from 'svelte';
  import Axes from './axes/Axes.svelte';
  import Points from './points/Points.svelte';
  import { datasetStore, dimensionDataStore } from '../../stores/dataset';
  import { numericalDimensionsStore, xDimStore, yDimStore } from '../../stores/scatterplot';
  import { scaleLinear } from 'd3-scale';
  import type { DSVParsedArray } from 'd3-dsv';
  import type { MarginType } from '../../util/types';

  let width: number;
  let height: number;
  let dimensions: string[] = [];
  let numericalDimensions: string[] = [];
  let xDim: string, yDim: string;
  let xScale: any, yScale: any;
  let pointsComponent: Points;

  let margin: MarginType = { top: 20, right: 20, bottom: 20, left: 30 };

  let dataset: DSVParsedArray<any>;
  let xData: any, yData: any;
  const unsubscribeDataset = datasetStore.subscribe((value: any) => {
    dataset = value;
    if (dataset?.length > 0) {
      dimensions = Object.keys(dataset[0]);
      numericalDimensions = dimensions.filter(
        (dim) => $dimensionDataStore.get(dim)?.type === 'numerical'
      );
      numericalDimensionsStore.set(numericalDimensions);
      if (numericalDimensions.length >= 2) {
        yDim = numericalDimensions[0];
        xDim = numericalDimensions[1];
        yDimStore.set(yDim);
        xDimStore.set(xDim);
        xData = dataset.map((row) => row[xDim]);
        yData = dataset.map((row) => row[yDim]);
      }

      calculateXScale();
      calculateYScale();
    }
  });

  const unsubscribeXDim = xDimStore.subscribe((value: string) => {
    xDim = value;
    xData = dataset.map((row) => row[xDim]);
    calculateXScale();
    setTimeout(() => {
      pointsComponent?.changeXData();
    }, 0);
  });

  const unsubscribeYDim = yDimStore.subscribe((value: string) => {
    yDim = value;
    yData = dataset.map((row) => row[yDim]);
    calculateYScale();
    setTimeout(() => {
      pointsComponent?.changeYData();
    }, 0);
  });

  $: {
    if (width > 0 && dataset?.length > 0) {
      calculateXScale();
    }
  }

  $: {
    if (height > 0 && dataset?.length > 0) {
      calculateYScale();
    }
  }

  function calculateXScale() {
    xScale = scaleLinear()
      .domain([$dimensionDataStore.get(xDim)?.min, $dimensionDataStore.get(xDim)?.max] as [
        number,
        number
      ])
      .range([3, width - margin.right - margin.left - 3]);
  }

  function calculateYScale() {
    yScale = scaleLinear()
      .domain([$dimensionDataStore.get(yDim)?.min, $dimensionDataStore.get(yDim)?.max] as [
        number,
        number
      ])
      .range([height - margin.top - margin.bottom - 3, 3]);
  }

  onDestroy(() => {
    unsubscribeDataset();
    unsubscribeXDim();
    unsubscribeYDim();
  });
</script>

{#if dataset?.length === 0}
  <span>No data available.</span>
{:else if numericalDimensions.length < 2}
  <div><span>Not enough numerical dimensions.</span></div>
{:else}
  <div
    id="scatterplot-canvas"
    class="w-full h-full"
    bind:clientWidth={width}
    bind:clientHeight={height}
  >
    <Axes {width} {height} {margin} {xScale} {yScale} viewTitle="scatterplot" />

    <Points
      bind:this={pointsComponent}
      {width}
      {height}
      {margin}
      {xScale}
      {yScale}
      {xData}
      {yData}
    />
  </div>
{/if}
