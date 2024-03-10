<script lang="ts">
  import { afterUpdate, onDestroy, onMount } from 'svelte';
  import OffscreenWorker from './offscreenWorker?worker';
  import { debounce, throttle } from '../../../util/util';
  import { linkingArray } from '../../../stores/linking';
  import {
    brushedArray,
    hoveredArray,
    previouslyBrushedArray,
    previouslyHoveredArray
  } from '../../../stores/brushing';
  import { labelDimension } from '../../../stores/dataset';
  import type { TooltipType } from '../../../util/types';
  import type { DSVParsedArray } from 'd3-dsv';

  export let dataset: DSVParsedArray<any>;
  export let width: number;
  export let height: number;
  export let margin: any;
  export let xScale: any;
  export let yScale: any;
  export let xData: any[];
  export let yData: any[];
  export let setTooltipData: (data: TooltipType) => void;

  let canvasEl: HTMLCanvasElement;
  let offscreenCanvasEl: OffscreenCanvas;
  let worker: Worker;
  let points: number[][] = [];
  let mouse: { x: number; y: number } = { x: 0, y: 0 };
  let tooltipPos: { x: number; y: number; clientX: number; clientY: number } = {
    x: 0,
    y: 0,
    clientX: 0,
    clientY: 0
  };
  let updatedHere = false;
  let currWidth: number = width,
    currHeight: number = height;
  let throttledDrawPoints: () => void;
  let debouncedDrawPoints: () => void;

  const unsubscribeLinking = linkingArray.subscribe((value: boolean[]) => {
    worker?.postMessage({
      function: 'setLinking',
      pointShow: value
    });
  });

  const unsubscribePreviouslyHovered = previouslyHoveredArray.subscribe((value: Set<number>) => {
    if (!worker) return;
    worker.postMessage({
      function: 'updatePreviouslyHovered',
      indices: value
    });
  });

  const unsubscribePreviouslyBrushed = previouslyBrushedArray.subscribe((value: Set<number>) => {
    if (!worker) return;
    if (updatedHere) {
      updatedHere = false;
      return;
    }
    worker.postMessage({
      function: 'updatePreviouslyBrushed',
      indices: value
    });
    updatedHere = false;
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

  const unsubscribeBrushed = brushedArray.subscribe((value: Set<number>) => {
    if (!worker) return;
    if (updatedHere) {
      updatedHere = false;
      return;
    }
    worker.postMessage({
      function: 'updateBrushed',
      indices: value
    });
    updatedHere = false;
  });

  export function setPointData(): void {
    points = [];
    let xPos: number, yPos: number;
    xData.forEach((x: any, i: number) => {
      xPos = margin.left + xScale(x);
      yPos = margin.top + yScale(yData[i]);
      points.push([xPos, yPos, 0]);
    });
  }

  export function resetPoints() {
    worker?.postMessage({
      function: 'resetPoints',
      pointShow: Array(dataset.length).fill(true)
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
      y: event.clientY - canvasRect.top,
      clientX: event.clientX,
      clientY: event.clientY
    };
  }

  function handleMouseDown(event: MouseEvent) {
    if (!canvasEl) return;
    // Calculate normalized mouse coordinates relative to the canvas
    const canvasRect = canvasEl.getBoundingClientRect();
    mouse.x = ((event.clientX - canvasRect.left) / canvasRect.width) * 2 - 1;
    mouse.y = -((event.clientY - canvasRect.top) / canvasRect.height) * 2 + 1;
    // If mouse is not in canvas, return
    if (
      !(
        event.clientY >= canvasRect.top + margin.top - 10 &&
        event.clientY <= canvasRect.bottom &&
        event.clientX >= canvasRect.left &&
        event.clientX <= canvasRect.right
      )
    )
      return;

    setTimeout(() => {
      setTooltipData({ visible: false, posX: 0, posY: 0, clientX: 0, clientY: 0, text: [] });
      worker.postMessage({
        function: 'mouseDown',
        mouse,
        event: {
          ctrlKey: event.ctrlKey,
          shiftKey: event.shiftKey
        }
      });
    }, 1);
  }

  function drawPoints() {
    setPointData();
    worker.postMessage({
      function: 'drawPoints',
      points
    });
  }

  export function changeXData() {
    setTimeout(() => {
      let xPos: number;
      xData.forEach((x: any, i: number) => {
        xPos = margin.left + xScale(x);
        points[i][0] = xPos;
      });

      debouncedDrawPoints();
    }, 0);
  }

  export function changeYData() {
    setTimeout(() => {
      let yPos: number;
      yData.forEach((y: any, i: number) => {
        yPos = margin.top + yScale(y);
        points[i][1] = yPos;
      });
      debouncedDrawPoints();
    }, 0);
  }

  onMount(() => {
    window.addEventListener('pointermove', handleMouseMove, false);
    window.addEventListener('pointerdown', handleMouseDown, false);
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

    function setTooltip(hoveredLinesSet: Set<number>) {
      if (hoveredLinesSet.size === 0) {
        setTooltipData({ visible: false, posX: 0, posY: 0, clientX: 0, clientY: 0, text: [] });
      } else {
        let tooltipText: string[] = [];
        hoveredLinesSet.forEach((i) => {
          tooltipText.push(`${dataset[i][$labelDimension]}`);
        });
        setTooltipData({
          visible: true,
          posX: tooltipPos.x + 25,
          posY: tooltipPos.y,
          clientX: tooltipPos.clientX,
          clientY: tooltipPos.clientY,
          text: tooltipText
        });
      }
    }

    worker.onmessage = (message) => {
      const data = message.data;
      switch (data.function) {
        case 'setHovered':
          updatedHere = true;
          hoveredArray.set(data.hoveredIndices);
          setTooltip(data.hoveredIndices);
          break;
        case 'setBrushed':
          updatedHere = true;
          previouslyBrushedArray.set(data.previouslyBrushedIndices);
          brushedArray.set(data.brushedIndices);
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
    unsubscribePreviouslyBrushed();
    unsubscribeHovered();
    unsubscribeBrushed();
  });
</script>

<canvas bind:this={canvasEl} />
