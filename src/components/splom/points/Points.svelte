<script lang="ts">
  import { onMount } from 'svelte';
  import OffscreenWorker from '../../scatterplot/points/offscreenWorker?worker';
  import CalculatingWorker from './calculatingWorker?worker';
  import { scaleLinear } from 'd3-scale';
  import { dimensionDataStore } from '../../../stores/dataset';
  import { debounce, throttle } from '../../../util/util';
  import type { DSVParsedArray } from 'd3-dsv';
  import type { MarginType } from '../../../util/types';
  import type { TaskType } from '../types';

  export let dataset: DSVParsedArray<any>;
  export let dimensionsX: string[] = [];
  export let dimensionsY: string[] = [];
  export let size: number;
  export let margin: MarginType;

  let canvasEl: HTMLCanvasElement;
  let offscreenCanvasEl: OffscreenCanvas;
  let drawingWorker: Worker;
  let points: number[][] = [];
  let throttledDrawPoints: () => void;
  let debouncedDrawPoints: () => void;

  let completedWorkers = 0;
  let availableWorkers = 0;
  let calculatingWorkers: Worker[] = [];

  let gridSize = 0;
  $: gridSize = size - margin.left - margin.right;

  $: if (size && dimensionsX && dimensionsY && margin && debouncedDrawPoints) {
    drawingWorker.postMessage({ function: 'resizeCanvas', width: size, height: size });
    debouncedDrawPoints();
  }

  function setPointData() {
    points = [];

    availableWorkers = navigator.hardwareConcurrency;
    if (availableWorkers === 0) calculatePointData();
    else calculateDistributePointData();
  }

  function calculatePointData() {
    const spacing = gridSize / dimensionsX.length;

    dimensionsX.forEach((dimX, i) => {
      const dimDataX = dataset.map((row) => row[dimX]);
      dimensionsY.forEach((dimY, j) => {
        if (dimX === dimY) return;

        const dimDataY = dataset.map((row) => row[dimY]);

        const xScale = calculateXScale(dimX, spacing);
        const yScale = calculateYScale(dimY, spacing);

        dimDataX.forEach((x: any, idx: number) => {
          let xPos = margin.left + spacing * i + xScale(x);
          let yPos = margin.top + spacing * j + yScale(dimDataY[idx]);
          points.push([xPos, yPos, 0]);
        });
      });
    });

    drawingWorker.postMessage({
      function: 'drawPoints',
      points
    });
  }

  function calculateDistributePointData() {
    completedWorkers = 0;
    calculatingWorkers = [];

    for (let i = 0; i < availableWorkers; i++) {
      const worker = new CalculatingWorker();
      calculatingWorkers.push(worker);
      worker.onmessage = handleCalculatingWorkerResult;
    }

    const spacing = gridSize / dimensionsX.length;
    const taskData: TaskType[] = [];
    dimensionsX.forEach((dimX, i) => {
      const dimDataX = dataset.map((row) => row[dimX]);
      dimensionsY.forEach((dimY, j) => {
        if (dimX === dimY) return;
        const dimDataY = dataset.map((row) => row[dimY]);
        const xScale = getXScaleParams(dimX, spacing);
        const yScale = getYScaleParams(dimY, spacing);
        taskData.push({
          dimDataX,
          dimDataY,
          xScale,
          yScale,
          i,
          j
        });
      });
    });

    // Split tasks among workers
    const tasksPerWorker = Math.ceil(taskData.length / availableWorkers);
    for (let i = 0; i < availableWorkers; i++) {
      const tasks = taskData.slice(i * tasksPerWorker, (i + 1) * tasksPerWorker);
      calculatingWorkers[i].postMessage({ tasks, spacing, margin });
    }
  }

  function handleCalculatingWorkerResult(event: MessageEvent) {
    points = points.concat(event.data.points);
    completedWorkers++;
    if (completedWorkers === availableWorkers) {
      drawingWorker.postMessage({
        function: 'drawPoints',
        points
      });

      calculatingWorkers.forEach((worker) => {
        worker.terminate();
      });
    }
  }

  function drawPoints() {
    setPointData();
  }

  function getXScaleParams(dim: string, max: number) {
    return {
      domain: [$dimensionDataStore.get(dim)?.min, $dimensionDataStore.get(dim)?.max] as [number, number],
      range: [3, max - 3] as [number, number]
    };
  }

  function getYScaleParams(dim: string, max: number) {
    return {
      domain: [$dimensionDataStore.get(dim)?.min, $dimensionDataStore.get(dim)?.max] as [number, number],
      range: [max - 3, 3] as [number, number]
    };
  }

  function calculateXScale(dim: string, max: number) {
    return scaleLinear()
      .domain([$dimensionDataStore.get(dim)?.min, $dimensionDataStore.get(dim)?.max] as [number, number])
      .range([3, max - 3]);
  }

  function calculateYScale(dim: string, max: number) {
    return scaleLinear()
      .domain([$dimensionDataStore.get(dim)?.min, $dimensionDataStore.get(dim)?.max] as [number, number])
      .range([max - 3, 3]);
  }

  onMount(() => {
    offscreenCanvasEl = canvasEl.transferControlToOffscreen();
    drawingWorker = new OffscreenWorker();

    drawingWorker.postMessage(
      {
        function: 'init',
        canvas: offscreenCanvasEl,
        width: size,
        height: size,
        pointSize: 2
      },
      [offscreenCanvasEl]
    );

    throttledDrawPoints = throttle(drawPoints, 10);
    debouncedDrawPoints = debounce(throttledDrawPoints, 10);
  });
</script>

<canvas bind:this={canvasEl} />
