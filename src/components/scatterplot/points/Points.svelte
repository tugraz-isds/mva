<script lang="ts">
  import { afterUpdate, onDestroy, onMount } from 'svelte';
  import OffscreenWorker from './offscreenWorker?worker';
  import { debounce, rectangleToPolygon, throttle } from '../../../util/util';
  import { linkingArray } from '../../../stores/linking';
  import { brushedArray, hoveredArray, isInteractableStore } from '../../../stores/brushing';
  import { labelDimension } from '../../../stores/dataset';
  import { partitionsDataStore, partitionsStore } from '../../../stores/partitions';
  import { scatterplotSelectionShapeStore } from '../../../stores/scatterplot';
  import { simmapSelectionShapeStore } from '../../../stores/simmap';
  import { POINT_SIZE, saveSVGUtil } from './drawingUtil';
  import type { CoordinateType, TooltipType } from '../../../util/types';
  import type { DSVParsedArray } from 'd3-dsv';
  import type { PartitionType } from '../../partitions/types';
  import type { ScatterplotSelectionShapeType } from '../types';

  export let title: 'scatterplot' | 'simmap';
  export let dataset: DSVParsedArray<any>;
  export let width: number;
  export let height: number;
  export let margin: any;
  export let xScale: any;
  export let yScale: any;
  export let xData: any[];
  export let yData: any[];
  export let setTooltipData: (data: TooltipType) => void;
  export let drawSelectionShape: (points?: CoordinateType[]) => void;

  let canvasEl: HTMLCanvasElement;
  let offscreenCanvasEl: OffscreenCanvas;
  let worker: Worker;
  let points: number[][] = [];
  let pointShow: boolean[] = [];
  let mouse: CoordinateType = { x: 0, y: 0 };
  let tooltipPos: { x: number; y: number; clientX: number; clientY: number } = {
    x: 0,
    y: 0,
    clientX: 0,
    clientY: 0
  };
  let updatedHere = false;
  let currWidth: number = width,
    currHeight: number = height;

  let isDragging = false;
  let selectionShapeLine: CoordinateType[] = [];

  let throttledDrawPoints: () => void;
  let debouncedDrawPoints: () => void;
  let throttledAddSelectionShapePoint: (point: CoordinateType) => void;
  let debouncedAddSelectionShapePoint: (point: CoordinateType) => void;

  let selectionShape: ScatterplotSelectionShapeType;
  const unsubscribeSelectionShape = (
    title === 'scatterplot' ? scatterplotSelectionShapeStore : simmapSelectionShapeStore
  ).subscribe((value) => {
    selectionShape = value;
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
      if (partitions !== null || partitionsData !== null)
        worker?.postMessage({
          function: 'updatePartitions',
          partitions,
          partitionsData
        });
      partitions = null;
      partitionsData = null;
    }, 0);
  }

  const unsubscribeLinking = linkingArray.subscribe((value) => {
    pointShow = value;
    worker?.postMessage({
      function: 'setLinking',
      pointShow
    });
  });

  let hoveredLinesIndices: Set<number> = new Set();
  const unsubscribeHovered = hoveredArray.subscribe((value) => {
    if (!worker) return;
    if (updatedHere) {
      updatedHere = false;
      return;
    }
    worker.postMessage({
      function: 'updateHovered',
      previouslyHoveredIndices: hoveredLinesIndices,
      hoveredIndices: value
    });
    hoveredLinesIndices = value;
    updatedHere = false;
  });

  let brushedLinesIndices: Set<number> = new Set();
  const unsubscribeBrushed = brushedArray.subscribe((value) => {
    if (!worker) return;
    if (updatedHere) {
      updatedHere = false;
      return;
    }
    worker.postMessage({
      function: 'updateBrushed',
      previouslyBrushedIndices: brushedLinesIndices,
      brushedIndices: value
    });
    brushedLinesIndices = value;
    updatedHere = false;
  });

  export function setPointData() {
    points = [];
    let xPos: number, yPos: number;
    xData.forEach((x: any, i: number) => {
      xPos = margin.left + xScale(x);
      yPos = margin.top + yScale(yData[i]);
      points.push([xPos, yPos, 0]);
    });
  }

  export function resetPoints() {
    pointShow = Array(dataset.length).fill(true);
    worker?.postMessage({
      function: 'resetPoints',
      pointShow
    });
  }

  function handleMouseMove(event: MouseEvent) {
    if (!canvasEl || !$isInteractableStore) return;
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

    if (isDragging) {
      if (selectionShape === 'lasso') debouncedAddSelectionShapePoint({ x: event.offsetX, y: event.offsetY });
      else addSelectionShapePointPoint({ x: event.offsetX, y: event.offsetY });
    }

    worker.postMessage({
      function: 'mouseMove',
      mouse
    });

    tooltipPos = {
      x: event.clientX - canvasRect.left,
      y: event.clientY - canvasRect.top,
      clientX: event.clientX,
      clientY: event.clientY
    };
  }

  function handleMouseDown(event: MouseEvent) {
    if (!canvasEl || !$isInteractableStore || event.button === 2) return;
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

    isDragging = true;
    selectionShapeLine = [{ x: event.offsetX, y: event.offsetY }];

    setTimeout(() => {
      setTooltipData({
        visible: false,
        clientX: 0,
        clientY: 0,
        text: []
      });
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

  function handleMouseUp(event: MouseEvent) {
    if (!canvasEl || !$isInteractableStore) return;
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
    isDragging = false;
    selectionShapeLine = [];
    drawSelectionShape();

    worker.postMessage({
      function: 'mouseUp',
      mouse,
      event: {
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey
      }
    });
  }

  function drawPoints() {
    setPointData();
    worker.postMessage({
      function: 'drawPoints',
      points
    });
  }

  function addSelectionShapePointPoint(point: CoordinateType) {
    if (selectionShape === 'lasso') selectionShapeLine.push(point);
    else selectionShapeLine = [...rectangleToPolygon(selectionShapeLine[0], point), selectionShapeLine[0]];

    drawSelectionShape(selectionShapeLine);
    worker.postMessage({
      function: 'setSelectionShapeLine',
      points: selectionShapeLine
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

  function setTooltip(hoveredLinesSet: Set<number>) {
    if (hoveredLinesSet.size === 0) {
      setTooltipData({
        visible: false,
        clientX: 0,
        clientY: 0,
        text: []
      });
    } else {
      let tooltipText: string[] = [];
      hoveredLinesSet.forEach((i) => {
        tooltipText.push(`${dataset[i][$labelDimension]}`);
      });
      setTooltipData({
        visible: true,
        clientX: tooltipPos.clientX,
        clientY: tooltipPos.clientY,
        text: tooltipText
      });
    }
  }

  export const saveSVG = () => {
    return saveSVGUtil(width, height, pointShow, points, $partitionsStore, $partitionsDataStore, $brushedArray);
  };

  onMount(() => {
    window.addEventListener('pointermove', handleMouseMove, false);
    window.addEventListener('pointerdown', handleMouseDown, false);
    window.addEventListener('pointerup', handleMouseUp, false);
    throttledDrawPoints = throttle(drawPoints, 10);
    debouncedDrawPoints = debounce(throttledDrawPoints, 10);
    throttledAddSelectionShapePoint = throttle(addSelectionShapePointPoint, 50);
    debouncedAddSelectionShapePoint = debounce(throttledAddSelectionShapePoint, 10);

    offscreenCanvasEl = canvasEl.transferControlToOffscreen();
    worker = new OffscreenWorker();

    worker.postMessage(
      {
        function: 'init',
        canvas: offscreenCanvasEl,
        width,
        height,
        pointSize: POINT_SIZE
      },
      [offscreenCanvasEl]
    );

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
    unsubscribeSelectionShape();
    unsubscribePartitionsData();
    unsubscribePartitions();
    unsubscribeLinking();
    unsubscribeHovered();
    unsubscribeBrushed();
  });
</script>

<canvas bind:this={canvasEl} />
