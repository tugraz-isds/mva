<script lang="ts">
  import { onMount } from 'svelte';
  import OffscreenWorker from '../../scatterplot/points/offscreenWorker?worker';
  import { scaleLinear } from 'd3-scale';
  import { dimensionDataStore } from '../../../stores/dataset';
  import { debounce, throttle } from '../../../util/util';
  import type { DSVParsedArray } from 'd3-dsv';
  import type { MarginType } from '../../../util/types';

  export let dataset: DSVParsedArray<any>;
  export let dimensions: string[] = [];
  export let size: number;
  export let margin: MarginType;

  let canvasEl: HTMLCanvasElement;
  let numWorkers: number;
  let offscreenCanvasEl: OffscreenCanvas;
  let workers: Worker[] = [];
  let points: number[][] = [];
  let throttledDrawPoints: () => void;
  let debouncedDrawPoints: () => void;
  let results: number[][][] = [];

  let gridSize = 0;
  $: gridSize = size - margin.left - margin.right;

  $: if (size && dimensions && margin && debouncedDrawPoints) {
    // worker.postMessage({ function: 'resizeCanvas', width: size, height: size });
    debouncedDrawPoints();
  }

  function setPointData() {
    points = [];
    const spacing = gridSize / dimensions.length;

    dimensions.forEach((dimX, i) => {
      const dimDataX = dataset.map((row) => row[dimX]);
      dimensions.forEach((dimY, j) => {
        if (i === j) return;

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
  }

  function drawPoints() {
    setPointData();

    const chunkSize = Math.ceil(points.length / numWorkers);
    results = [];

    for (let i = 0; i < numWorkers; i++) {
      const chunk = points.slice(i * chunkSize, (i + 1) * chunkSize);
      workers[i].postMessage({ function: 'drawPoints', points: chunk, id: i });
    }
  }

  function handleWorkerMessage(event: MessageEvent) {
    const { id, processedPoints } = event.data;
    results[id] = processedPoints;

    if (results.flat().length === points.length) {
      const allProcessedPoints = results.flat();
      // Combine results and draw on the canvas
      workers[0].postMessage({
        function: 'drawPoints',
        points: allProcessedPoints
      });
    }
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
    numWorkers = navigator.hardwareConcurrency || 4;
    offscreenCanvasEl = canvasEl.transferControlToOffscreen();

    for (let i = 0; i < numWorkers; i++) {
      const worker = new OffscreenWorker();
      worker.addEventListener('message', handleWorkerMessage);
      workers.push(worker);
    }

    // Transfer the OffscreenCanvas to only the first worker
    workers[0].postMessage(
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
