<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import Axes from './axes/Axes.svelte';
  import Points from './points/Points.svelte';
  import Tooltip from '../tooltip/Tooltip.svelte';
  import ContextMenuPartitions from '../partitions/ContextMenu.svelte';
  import SvgExportModal from '../svg-exporter/SvgExportModal.svelte';
  import { datasetStore, dimensionDataStore } from '../../stores/dataset';
  import { xDimStore, yDimStore } from '../../stores/scatterplot';
  import { scaleLinear } from 'd3-scale';
  import type { DSVParsedArray } from 'd3-dsv';
  import type { CoordinateType, MarginType, TooltipType } from '../../util/types';

  let width: number;
  let height: number;
  let dimensions: string[] = [];
  let numericalDimensions: string[] = [];
  let xDim: string, yDim: string;
  let xScaleAxes: any, yScaleAxes: any, xScalePoints: any, yScalePoints: any;
  let pointsComponent: Points;
  let axesComponent: Axes;
  let contextMenuPartitions: ContextMenuPartitions;
  let svgExportModal: SvgExportModal;
  let isSvgExportModalOpen = false;

  let isDragging = false;
  let margin: MarginType = { top: 20, right: 20, bottom: 40, left: 40 };
  let tooltip: TooltipType = {
    visible: false,
    clientX: 0,
    clientY: 0,
    text: []
  };

  let dataset: DSVParsedArray<any>;
  let xData: any, yData: any;
  const unsubscribeDataset = datasetStore.subscribe((value) => {
    dataset = value as DSVParsedArray<any>;
    if (dataset?.length > 0) {
      dimensions = Object.keys(dataset[0]);
      numericalDimensions = dimensions.filter((dim) => $dimensionDataStore.get(dim)?.type === 'numerical');
      if (numericalDimensions.length >= 2) {
        yDim = numericalDimensions[0];
        xDim = numericalDimensions[1];
        yDimStore.set(yDim);
        xDimStore.set(xDim);
        xData = dataset.map((row) => row[xDim]);
        yData = dataset.map((row) => row[yDim]);
      }

      setTimeout(() => {
        pointsComponent?.setPointData();
        pointsComponent?.resetPoints();
        calculateXScale();
        calculateYScale();
      }, 0);

      pointsComponent?.changeXData();
      pointsComponent?.changeYData();
    }
  });

  const unsubscribeXDim = xDimStore.subscribe((value) => {
    xDim = value;
    xData = dataset.map((row) => row[xDim]);
    calculateXScale();
    setTimeout(() => {
      pointsComponent?.changeXData();
    }, 0);
  });

  const unsubscribeYDim = yDimStore.subscribe((value) => {
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
    xScaleAxes = scaleLinear()
      .domain([$dimensionDataStore.get(xDim)?.min, $dimensionDataStore.get(xDim)?.max] as [number, number])
      .range([0, width - margin.right - margin.left]);
    xScalePoints = scaleLinear()
      .domain([$dimensionDataStore.get(xDim)?.min, $dimensionDataStore.get(xDim)?.max] as [number, number])
      .range([3, width - margin.right - margin.left - 3]);
  }

  function calculateYScale() {
    yScaleAxes = scaleLinear()
      .domain([$dimensionDataStore.get(yDim)?.min, $dimensionDataStore.get(yDim)?.max] as [number, number])
      .range([height - margin.top - margin.bottom, 0]);
    yScalePoints = scaleLinear()
      .domain([$dimensionDataStore.get(yDim)?.min, $dimensionDataStore.get(yDim)?.max] as [number, number])
      .range([height - margin.top - margin.bottom - 3, 3]);
  }

  function setTooltipData(data: TooltipType) {
    tooltip = data;
  }

  function drawSelectionShape(points?: CoordinateType[]) {
    axesComponent?.drawSelectionShape(points);
  }

  function handleContextMenu(e: MouseEvent) {
    contextMenuPartitions.showContextMenu(e);
    setTooltipData({
      visible: false,
      clientX: 0,
      clientY: 0,
      text: []
    });
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

    svgExportModal.setSvgString(svgString, 'scatterplot');
  }

  onMount(() => {
    window.addEventListener('call-save-svg-scatterplot', saveSVG);
  });

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
{/if}
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  id="scatterplot-canvas"
  class="w-full h-full"
  bind:clientWidth={width}
  bind:clientHeight={height}
  on:contextmenu={handleContextMenu}
>
  {#if dataset?.length > 0 && width}
    <Axes
      bind:this={axesComponent}
      {width}
      {height}
      {margin}
      xScale={xScaleAxes}
      yScale={yScaleAxes}
      xTitle={xDim}
      yTitle={yDim}
      {isDragging}
      viewTitle="scatterplot"
    />

    <Tooltip data={tooltip} maxWidth={120} />

    <ContextMenuPartitions bind:this={contextMenuPartitions} />

    <Points
      bind:this={pointsComponent}
      title="scatterplot"
      {dataset}
      {width}
      {height}
      {margin}
      xScale={xScalePoints}
      yScale={yScalePoints}
      {xData}
      {yData}
      bind:isDragging
      {setTooltipData}
      {drawSelectionShape}
    />
  {/if}

  <SvgExportModal bind:this={svgExportModal} isOpen={isSvgExportModalOpen} />
</div>
