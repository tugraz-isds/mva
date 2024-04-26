<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { PCA } from 'ml-pca';
  import { UMAP } from 'umap-js';
  import Axes from '../scatterplot/axes/Axes.svelte';
  import Points from '../scatterplot/points/Points.svelte';
  import Tooltip from '../tooltip/Tooltip.svelte';
  import ContextMenuPartitions from '../partitions/ContextMenu.svelte';
  import SvgExportModal from '../svg-exporter/SvgExportModal.svelte';
  import { datasetStore, dimensionDataStore } from '../../stores/dataset';
  import { simmapMethodStore } from '../../stores/simmap';
  import { scaleLinear } from 'd3-scale';
  import { isNumber } from '../../util/util';
  import type { DSVParsedArray } from 'd3-dsv';
  import type { MarginType, TooltipType } from '../../util/types';
  import type { SimmapMethodsType, SimmapDataType } from './types';

  let width: number;
  let height: number;
  let numericalDimensions: string[] = [];
  let xData: number[], yData: number[];
  let xScaleAxes: any, yScaleAxes: any, xScalePoints: any, yScalePoints: any;
  let pointsComponent: Points;
  let axesComponent: Axes;
  let contextMenuPartitions: ContextMenuPartitions;
  let svgExportModal: SvgExportModal;
  let isSvgExportModalOpen = false;
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
  const unsubscribeDataset = datasetStore.subscribe((value) => {
    xData = [];
    yData = [];
    dataset = value as DSVParsedArray<any>;

    simmapMethodStore.set('PCA');
  });

  const unsubscribeDimensionData = dimensionDataStore.subscribe((value) => {
    setTimeout(() => {
      if (value?.size === 0) return;
      numericalDimensions = Array.from(value.keys()).filter(
        (dim) => value.get(dim)?.active && value.get(dim)?.type === 'numerical'
      );

      if (numericalDimensions.length >= 2) {
        matrix = dataset.map((d) => numericalDimensions.map((dim) => (isNumber(d[dim]) ? d[dim] : 0)));

        calculatePCA();
        calculateUMAP();
        redrawPoints($simmapMethodStore);
      }
    }, 0);
  });

  const unsubscribeSimmap = simmapMethodStore.subscribe((value) => {
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

  export function saveSVG() {
    let pointsStringSvg = pointsComponent.saveSVG();
    let axesStringSvg = axesComponent.saveSVG();
    if (!axesStringSvg || !pointsStringSvg) return;

    isSvgExportModalOpen = false;
    isSvgExportModalOpen = true;

    pointsStringSvg = pointsStringSvg.replace(/<svg[^>]*>/, '<g>').replace(/<\/svg>/, '</g>');
    axesStringSvg = axesStringSvg.replace(/<svg([^>]*)>/, '<g>').replace(/<\/svg>/, '</g>');

    const svgString =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">` +
      '\n<!-- Points -->\n' +
      pointsStringSvg +
      '\n<!-- Axes -->\n' +
      axesStringSvg +
      '\n</svg>';

    svgExportModal.setSvgString(svgString, 'simmap');
  }

  onMount(() => {
    window.addEventListener('call-save-svg-simmap', saveSVG);
  });

  onDestroy(() => {
    unsubscribeDataset();
    unsubscribeDimensionData();
    unsubscribeSimmap();
  });
</script>

{#if dataset?.length === 0}
  <span>No data available.</span>
{:else if numericalDimensions.length < 2}
  <div><span>Not enough numerical dimensions.</span></div>
{/if}
<div
  id="simmap-canvas"
  class="w-full h-full"
  bind:clientWidth={width}
  bind:clientHeight={height}
  on:contextmenu={contextMenuPartitions.showContextMenu}
>
  {#if dataset?.length > 0 && width}
    <Axes
      bind:this={axesComponent}
      {width}
      {height}
      {margin}
      xScale={xScaleAxes}
      yScale={yScaleAxes}
      viewTitle="simmap"
    />

    <Tooltip data={tooltip} maxWidth={120} />

    <ContextMenuPartitions bind:this={contextMenuPartitions} />

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
  {/if}

  <SvgExportModal bind:this={svgExportModal} isOpen={isSvgExportModalOpen} />
</div>
