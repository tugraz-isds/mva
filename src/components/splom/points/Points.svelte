<script lang="ts">
  import { afterUpdate, onDestroy, onMount } from 'svelte';
  import OffscreenWorker from '../../scatterplot/points/offscreenWorker?worker';
  import CalculatingWorker from './calculatingWorker?worker';
  import { scaleLinear } from 'd3-scale';
  import { dimensionDataStore } from '../../../stores/dataset';
  import { brushedArray, hoveredArray } from '../../../stores/brushing';
  import { linkingArray } from '../../../stores/linking';
  import { partitionsDataStore, partitionsStore } from '../../../stores/partitions';
  import { isCurrentlyResizing } from '../../../stores/views';
  import { saveSVGUtil } from '../../scatterplot/points/drawingUtil';
  import { debounce, throttle } from '../../../util/util';
  import type { DSVParsedArray } from 'd3-dsv';
  import type { MarginType } from '../../../util/types';
  import type { TaskType } from '../types';
  import type { PartitionType } from '../../partitions/types';

  export let dataset: DSVParsedArray<any>;
  export let dimensionsX: string[] = [];
  export let dimensionsY: string[] = [];
  export let size: number;
  export let margin: MarginType;

  let canvasEl: HTMLCanvasElement;
  let offscreenCanvasEl: OffscreenCanvas;
  let drawingWorker: Worker;
  let points: number[][] = [];
  let pointShow: boolean[] = [];
  let throttledDrawPoints: () => void;
  let debouncedDrawPoints: () => void;

  let completedWorkers = 0;
  let availableWorkers = 0;
  let calculatingWorkers: Worker[] = [];

  let gridSize = 0;
  $: gridSize = size - margin.left - margin.right;

  let scatterplotNum = 0;
  $: {
    scatterplotNum = 0;
    dimensionsX.forEach((dimX) => {
      dimensionsY.forEach((dimY) => {
        if (dimX !== dimY) scatterplotNum++;
      });
    });

    drawingWorker?.postMessage({
      function: 'setLinking',
      pointShow: Array.from({ length: scatterplotNum }, () => pointShow).flat()
    });

    drawingWorker?.postMessage({
      function: 'updatePartitions',
      partitionsData: Array.from({ length: scatterplotNum }, () => $partitionsDataStore).flat()
    });
  }

  $: if (size && dimensionsX && dimensionsY && margin && debouncedDrawPoints) {
    drawingWorker.postMessage({ function: 'resizeCanvas', width: size, height: size });
    debouncedDrawPoints();
  }

  const unsubscribeResizing = isCurrentlyResizing.subscribe((value) => {
    if (!value && points.length > 0) {
      drawPoints();
    }
  });

  let partitionsData: string[] | null = null;
  const unsubscribePartitionsData = partitionsDataStore.subscribe((value) => {
    partitionsData = value;
    updatePartitions();
  });

  let partitions: Map<string, PartitionType> | null = null;
  const unsubscribePartitions = partitionsStore.subscribe((value) => {
    partitions = value;
    updatePartitions();
  });

  function updatePartitions() {
    setTimeout(() => {
      if (partitions !== null || partitionsData !== null) {
        drawingWorker?.postMessage({
          function: 'updatePartitions',
          partitions,
          partitionsData:
            partitionsData === null ? null : Array.from({ length: scatterplotNum }, () => partitionsData).flat(),
          addedIndices: new Set([
            ...Array.from({ length: scatterplotNum }, (_, i) =>
              Array.from($brushedArray).map((index) => index + i * dataset.length)
            ).flat(),
            ...Array.from({ length: scatterplotNum }, (_, i) =>
              Array.from($hoveredArray).map((index) => index + i * dataset.length)
            ).flat()
          ])
        });
      }
      partitions = null;
      partitionsData = null;
    }, 0);
  }

  const unsubscribeLinking = linkingArray.subscribe((value) => {
    pointShow = value;
    drawingWorker?.postMessage({
      function: 'setLinking',
      pointShow: Array.from({ length: scatterplotNum }, () => pointShow).flat()
    });
  });

  function drawPoints() {
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

  export const saveSVG = () => {
    return saveSVGUtil(
      size,
      size,
      Array.from({ length: scatterplotNum }, () => pointShow).flat(),
      points,
      $partitionsStore,
      Array.from({ length: scatterplotNum }, () => $partitionsDataStore).flat(),
      new Set()
    );
  };

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

  onDestroy(() => {
    unsubscribeResizing();
    unsubscribePartitions();
    unsubscribePartitionsData();
    unsubscribeLinking();
  });
</script>

<canvas bind:this={canvasEl} />
