<script lang="ts">
  import { onDestroy } from 'svelte';
  // import { PCA } from 'ml-pca';
  import { scaleLinear } from 'd3-scale';
  import { Select } from 'flowbite-svelte';
  import { datasetStore, dimensionDataStore } from '../../stores/dataset';
  import Axes from '../scatterplot/axes/Axes.svelte';
  import Tooltip from '../tooltip/Tooltip.svelte';
  import type { DSVParsedArray } from 'd3-dsv';
  import type { MarginType, TooltipType } from '../../util/types';

  let width: number;
  let height: number;
  let dimensions: string[] = [];
  let numericalDimensions: string[] = [];
  // let xData: number[] = [],
  //   yData: number[] = [];
  let yMin: number, yMax: number, xMin: number, xMax: number;
  let xScale: any, yScale: any;

  let simmapMethods = ['PCA'];
  let currSimmapMethod: string = simmapMethods[0];

  let margin: MarginType = { top: 20, right: 10, bottom: 20, left: 30 };

  let tooltip: TooltipType = {
    visible: false,
    xPos: 0,
    yPos: 0,
    text: []
  };

  $: {
    if (height > 0 && dataset?.length > 0) {
      calculateXScale();
      calculateYScale();
    }
  }

  // Set dataset and handle new dataset upload
  let dataset: DSVParsedArray<any>;
  // let matrix: number[][];
  const unsubscribeDataset = datasetStore.subscribe((value: any) => {
    dataset = value;
    if (dataset?.length > 0) {
      dimensions = Object.keys(dataset[0]);
      numericalDimensions = dimensions.filter(
        (dim) => $dimensionDataStore.get(dim)?.type === 'numerical'
      );
      // matrix = dataset.map((d) => numericalDimensions.map((dim) => d[dim]));

      // calculatePCA();
    }
  });

  // function calculatePCA() {
  //   const pca = new PCA(matrix);
  //   const pcaResult = pca.predict(matrix, { nComponents: 2 });
  //   pcaResult.to2DArray().forEach((row) => {
  //     xData.push(row[0]);
  //     yData.push(row[1]);
  //   });
  //   xMin = Math.min(...xData);
  //   xMax = Math.max(...xData);
  //   yMin = Math.min(...yData);
  //   yMax = Math.max(...yData);
  // }

  function calculateXScale() {
    xScale = scaleLinear()
      .domain([xMin, xMax])
      .range([0, width - margin.right - margin.left]);
  }

  function calculateYScale() {
    yScale = scaleLinear()
      .domain([yMax, yMin])
      .range([height * 0.9 - margin.top - margin.bottom, 0]);
  }

  onDestroy(() => {
    unsubscribeDataset();
  });
</script>

{#if numericalDimensions.length < 2}
  <div><span>Not enough numerical dimensions.</span></div>
{:else}
  <!-- <div
    id="simmap-canvas-container"
    class="w-full h-full flex flex-col items-end"
    bind:clientWidth={width}
    bind:clientHeight={height}
  >
    <Axes {width} height={height * 0.9} {xScale} {yScale} {margin} viewTitle="simmap" />

    <Tooltip data={tooltip} viewTitle="simmap" />

    <Points
			{width}
			height={height * 0.9}
			{xScale}
			{yScale}
			{xData}
			{yData}
			labelData={dataset.map((row) => row[$labelDimension])}
			{margin}
			{setTooltipData}
			viewTitle="simmap"
		/>

    <div class="w-full simmap-canvas" style="height: {height * 0.9}px;" />
    <div class="flex w-full justify-evenly" style="height: {height * 0.1}px">
      <div class="flex items-center w-1/3">
        <span class="mr-1/2" style="font-size: 0.75em;">Method:</span>
        <Select
          bind:value={currSimmapMethod}
          size="sm"
          placeholder=""
          style="height: {height * 0.06}px;
								padding: 0 {width < 350 ? '18px' : '25px'} 0 4px;
								display: flex;
								align-items: center;
								justify-content: center;
								width: 100%;
								overflow: hidden;
        				text-overflow: ellipsis;
								font-size: {width < 350 ? '0.5em' : '0.75em'};"
        >
          {#each simmapMethods as method}
            <option value={method}>{method}</option>
          {/each}
        </Select>
      </div>
    </div>
  </div> -->
{/if}
