<script lang="ts">
  import { onDestroy } from 'svelte';
  import Axes from './Axes.svelte';
  import { datasetStore, dimensionDataStore } from '../../stores/dataset';
  import { scaleLinear } from 'd3-scale';
  import type { DSVParsedArray } from 'd3-dsv';
  import type { MarginType } from '../../util/types';

  let width: number;
  let height: number;
  let dimensions: string[] = [];
  let numericalDimensions: string[] = [];
  let xDim: string, yDim: string;
  let xScale: any, yScale: any;

  let margin: MarginType = { top: 20, right: 20, bottom: 20, left: 30 };

  let dataset: DSVParsedArray<any>;
  const unsubscribeDataset = datasetStore.subscribe((value: any) => {
    dataset = value;
    if (dataset?.length > 0) {
      dimensions = Object.keys(dataset[0]);
      numericalDimensions = dimensions.filter(
        (dim) => $dimensionDataStore.get(dim)?.type === 'numerical'
      );
      if (numericalDimensions.length >= 2) {
        yDim = numericalDimensions[0];
        xDim = numericalDimensions[1];
      }

      calculateXScale();
      calculateYScale();
    }
  });

  $: {
    if (height > 0 && dataset?.length > 0) {
      calculateYScale();
    }
  }

  $: {
    if (width > 0 && dataset?.length > 0) {
      calculateXScale();
    }
  }

  function calculateXScale() {
    xScale = scaleLinear()
      .domain([$dimensionDataStore.get(xDim)?.min, $dimensionDataStore.get(xDim)?.max] as [
        number,
        number
      ])
      .range([0, width - margin.right - margin.left]);
  }

  function calculateYScale() {
    yScale = scaleLinear()
      .domain([$dimensionDataStore.get(yDim)?.min, $dimensionDataStore.get(yDim)?.max] as [
        number,
        number
      ])
      .range([height - margin.top - margin.bottom, 0]);
  }

  onDestroy(() => {
    unsubscribeDataset();
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
  </div>
{/if}
