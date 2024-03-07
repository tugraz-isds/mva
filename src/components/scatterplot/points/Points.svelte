<script lang="ts">
  import { afterUpdate, onDestroy, onMount } from 'svelte';
  import OffscreenWorker from './offscreenWorker?worker';
  import { debounce, throttle } from '../../../util/util';
  import type { RecordDataType } from '../../../util/types';
  import { linkingArray } from '../../../stores/linking';
  import { hoveredArray, previouslyHoveredArray } from '../../../stores/brushing';

  export let width: number;
  export let height: number;
  export let margin: any;
  export let xScale: any;
  export let yScale: any;
  export let xData: any[];
  export let yData: any[];

  let canvasEl: HTMLCanvasElement;
  let offscreenCanvasEl: OffscreenCanvas;
  let worker: Worker;
  let points: number[][] = [];
  let pointData: RecordDataType[] = [];
  let pointShow: boolean[] = [];
  let mouse: { x: number; y: number } = { x: 0, y: 0 };
  let tooltipPos: { x: number; y: number } = { x: 0, y: 0 };
  let updatedHere = false;
  let currWidth: number = width,
    currHeight: number = height;
  let throttledDrawPoints: () => void;
  let debouncedDrawPoints: () => void;

  const unsubscribeLinking = linkingArray.subscribe((value: boolean[]) => {
    setTimeout(() => {
      worker?.postMessage({
        function: 'resetPoints',
        pointShow: value
      });
    }, 0);
  });

  const unsubscribePreviouslyHovered = previouslyHoveredArray.subscribe((value: Set<number>) => {
    if (!worker) return;
    worker.postMessage({
      function: 'updatePreviouslyHovered',
      indices: value
    });
  });

  const unsubscribeHovered = hoveredArray.subscribe((value: Set<number>) => {
    if (!worker) return;
    if (updatedHere) {
      updatedHere = false;
      return;
    }
    worker.postMessage({
      function: 'updateHovered',
      indices: value
    });
    updatedHere = false;
  });

  function setPointData(): void {
    points = [];
    let xPos: number, yPos: number;
    xData.forEach((x: any, i: number) => {
      xPos = margin.left + xScale(x);
      yPos = margin.top + yScale(yData[i]);
      points.push([xPos, yPos, 0]);
    });
  }

  function handleMouseMove(event: MouseEvent) {
    if (!canvasEl) return;
    // Calculate normalized mouse coordinates relative to the canvas
    const canvasRect = canvasEl.getBoundingClientRect();
    mouse.x = ((event.clientX - canvasRect.left) / canvasRect.width) * 2 - 1;
    mouse.y = -((event.clientY - canvasRect.top) / canvasRect.height) * 2 + 1;
    // If mouse is not in canvas, return
    if (
      !(
        event.clientY >= canvasRect.top &&
        event.clientY <= canvasRect.bottom &&
        event.clientX >= canvasRect.left &&
        event.clientX <= canvasRect.right
      )
    )
      return;

    worker.postMessage({ function: 'mouseMove', mouse });

    tooltipPos = {
      x: event.clientX - canvasRect.left,
      y: event.clientY - canvasRect.top
    };
  }

  function drawPoints() {
    setPointData();
    worker.postMessage({
      function: 'drawPoints',
      points
    });
  }

  export function changeXData() {
    let xPos: number;
    xData.forEach((x: any, i: number) => {
      xPos = margin.left + xScale(x);
      points[i][0] = xPos;
    });

    debouncedDrawPoints();
  }

  export function changeYData() {
    let yPos: number;
    yData.forEach((y: any, i: number) => {
      yPos = margin.top + yScale(y);
      points[i][1] = yPos;
    });
    debouncedDrawPoints();
  }

  onMount(() => {
    window.addEventListener('pointermove', handleMouseMove, false);
    throttledDrawPoints = throttle(drawPoints, 10);
    debouncedDrawPoints = debounce(throttledDrawPoints, 10);

    offscreenCanvasEl = canvasEl.transferControlToOffscreen();
    worker = new OffscreenWorker();

    worker.postMessage(
      {
        function: 'init',
        canvas: offscreenCanvasEl,
        width,
        height
      },
      [offscreenCanvasEl]
    );

    worker.onmessage = (message) => {
      const data = message.data;
      switch (data.function) {
        case 'setHovered':
          updatedHere = true;
          hoveredArray.set(data.hoveredIndices);
          //setTooltip(data.hoveredIndices);
          break;
        case 'canvasResized':
          currWidth = data.width;
          currHeight = data.height;
          break;
        default:
          break;
      }
    };

    setPointData();
  });

  afterUpdate(() => {
    if (currWidth === width && currHeight === height) return;
    worker.postMessage({ function: 'resizeCanvas', width, height });
    debouncedDrawPoints();
  });

  onDestroy(() => {
    unsubscribeLinking();
    unsubscribePreviouslyHovered();
    unsubscribeHovered();
  });
</script>

<canvas bind:this={canvasEl} />
