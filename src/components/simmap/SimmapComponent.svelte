<script lang="ts">
  import { onDestroy } from 'svelte';
  import { PCA } from 'ml-pca';
  import { UMAP } from 'umap-js';
  import Axes from '../scatterplot/axes/Axes.svelte';
  import Points from '../scatterplot/points/Points.svelte';
  import Tooltip from '../tooltip/Tooltip.svelte';
  import { datasetStore, dimensionDataStore } from '../../stores/dataset';
  import { simmapMethodStore } from '../../stores/simmap';
  import { scaleLinear } from 'd3-scale';
  import { isNumber } from '../../util/util';
  import type { DSVParsedArray } from 'd3-dsv';
  import type { MarginType, TooltipType } from '../../util/types';
  import type { SimmapMethodsType, SimmapDataType } from './types';

  let width: number;
  let height: number;
  let dimensions: string[] = [];
  let numericalDimensions: string[] = [];
  let xData: number[], yData: number[];
  let xScaleAxes: any, yScaleAxes: any, xScalePoints: any, yScalePoints: any;
  let pointsComponent: Points;
  let yMin: number, yMax: number, xMin: number, xMax: number;

  let margin: MarginType = { top: 20, right: 20, bottom: 20, left: 30 };
  let tooltip: TooltipType = {
    visible: false,
    clientX: 0,
    clientY: 0,
    text: []
  };

  let simmapMethodsData: Map<SimmapMethodsType, SimmapDataType> = new Map();

  let dataset: DSVParsedArray<any>;
  let matrix: number[][];
  const unsubscribeDataset = datasetStore.subscribe((value: any) => {
    xData = [];
    yData = [];
    dataset = value;
    if (dataset?.length > 0) {
      dimensions = Object.keys(dataset[0]);
      numericalDimensions = dimensions.filter(
        (dim) => $dimensionDataStore.get(dim)?.type === 'numerical'
      );

      if (numericalDimensions.length >= 2) {
        matrix = dataset.map((d) =>
          numericalDimensions.map((dim) => (isNumber(d[dim]) ? d[dim] : 0))
        );
        calculatePCA();
        simmapMethodStore.set('PCA');
        redrawPoints('PCA');
      }

      calculateUMAP();
    }
  });

  const unsubscribeSimmap = simmapMethodStore.subscribe((value: SimmapMethodsType) => {
    redrawPoints(value);
  });

  function redrawPoints(simmapMethod: SimmapMethodsType) {
    const data = simmapMethodsData.get(simmapMethod);
    if (!data) return;
    xData = data.xData;
    yData = data.yData;
    xMin = data.xMin;
    xMax = data.xMax;
    yMin = data.yMin;
    yMax = data.yMax;

    setTimeout(() => {
      pointsComponent?.setPointData();
      pointsComponent?.resetPoints();
      calculateXScale();
      calculateYScale();
    }, 0);

    pointsComponent?.changeXData();
    pointsComponent?.changeYData();
  }

  function calculatePCA() {
    const pca = new PCA(matrix);
    const pcaResult = pca.predict(matrix, { nComponents: 2 });
    let xData: number[] = [],
      yData: number[] = [];
    pcaResult.to2DArray().forEach((row) => {
      xData.push(row[0]);
      yData.push(row[1]);
    });
    const xMin = Math.min(...xData);
    const xMax = Math.max(...xData);
    const yMin = Math.min(...yData);
    const yMax = Math.max(...yData);

    simmapMethodsData.set('PCA', {
      xData,
      yData,
      xMin,
      xMax,
      yMin,
      yMax
    });
  }

  function calculateUMAP() {
    const umap = new UMAP();
    const embedding = umap.fit(matrix);
    let xData: number[] = [],
      yData: number[] = [];
    embedding.forEach((row) => {
      xData.push(row[0]);
      yData.push(row[1]);
    });
    const xMin = Math.min(...xData);
    const xMax = Math.max(...xData);
    const yMin = Math.min(...yData);
    const yMax = Math.max(...yData);

    simmapMethodsData.set('UMAP', {
      xData,
      yData,
      xMin,
      xMax,
      yMin,
      yMax
    });
  }

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
    xScaleAxes = scaleLinear()
      .domain([xMin, xMax])
      .range([0, width - margin.right - margin.left]);
    xScalePoints = scaleLinear()
      .domain([xMin, xMax])
      .range([3, width - margin.right - margin.left - 3]);
  }

  function calculateYScale() {
    yScaleAxes = scaleLinear()
      .domain([yMax, yMin])
      .range([height - margin.top - margin.bottom, 0]);
    yScalePoints = scaleLinear()
      .domain([yMax, yMin])
      .range([height - margin.top - margin.bottom - 3, 3]);
  }

  function setTooltipData(data: TooltipType) {
    tooltip = data;
  }

  onDestroy(() => {
    unsubscribeDataset();
    unsubscribeSimmap();
  });
</script>

{#if dataset?.length === 0}
  <span>No data available.</span>
{:else if numericalDimensions.length < 2}
  <div><span>Not enough numerical dimensions.</span></div>
{:else}
  <div id="simmap-canvas" class="w-full h-full" bind:clientWidth={width} bind:clientHeight={height}>
    <Axes {width} {height} {margin} xScale={xScaleAxes} yScale={yScaleAxes} viewTitle="simmap" />

    <Tooltip data={tooltip} maxWidth={120} />

    <Points
      bind:this={pointsComponent}
      {dataset}
      {width}
      {height}
      {margin}
      xScale={xScalePoints}
      yScale={yScalePoints}
      {xData}
      {yData}
      {setTooltipData}
    />
  </div>
{/if}
