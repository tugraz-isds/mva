<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import DrawingWorker from './drawingWorker?worker';
  import { dimensionDataStore, labelDimension } from '../../../stores/dataset';
  import {
    filtersArray,
    parcoordCustomAxisRanges,
    parcoordSelectionShapeStore,
    parcoordVisibleDimensionsStore
  } from '../../../stores/parcoord';
  import { brushedArray, hoveredArray, isInteractableStore } from '../../../stores/brushing';
  import { linkingArray } from '../../../stores/linking';
  import { isCurrentlyResizing } from '../../../stores/panels';
  import { partitionsDataStore, partitionsStore } from '../../../stores/partitions';
  import { COLOR_ACTIVE } from '../../../util/colors';
  import { debounce, rectangleToPolygon, throttle } from '../../../util/util';
  import { saveSVGUtil } from './drawingUtil';
  import type { DSVParsedArray } from 'd3-dsv';
  import type { CoordinateType, RecordDataType, TooltipType } from '../../../util/types';
  import type { AxesFilterType, ParcoordSelectionShapeType } from '../types';
  import type { PartitionType } from '../../partitions/types';

  export let dataset: DSVParsedArray<any>;
  export let width: number;
  export let height: number;
  export let dimensions: string[] = [];
  export let margin: any;
  export let xScales: any[];
  export let yScales: any;
  export let isDragging: boolean;
  export let setTooltipData: (data: TooltipType) => void;
  export let drawSelectionShape: (points?: CoordinateType[]) => void;

  let canvasEl: HTMLCanvasElement;
  let offscreenCanvasEl: OffscreenCanvas;
  let worker: Worker;
  let lines: number[][][] = [];
  let lineData: RecordDataType[] = [];
  let lineShow: boolean[] = [];
  let mouse: CoordinateType = { x: 0, y: 0 };
  let tooltipPos: { x: number; y: number; clientX: number; clientY: number } = {
    x: 0,
    y: 0,
    clientX: 0,
    clientY: 0
  };
  let currWidth: number = width,
    currHeight: number = height;

  let clicked = false;
  let selectionShapeLine: CoordinateType[] = [];

  let throttledDrawLines: () => void;
  let debouncedDrawLines: () => void;

  $: {
    if (width && height && debouncedDrawLines) {
      worker.postMessage({ function: 'resizeCanvas', width, height });
      debouncedDrawLines();
    }
  }

  let selectionShape: ParcoordSelectionShapeType;
  const unsubscribeSelectionShape = parcoordSelectionShapeStore.subscribe((value) => {
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

  let axesFilters: AxesFilterType[] = [];
  const unsubscribeFilters = filtersArray.subscribe((value) => {
    if (worker && dataset?.length > 0 && dimensions?.length > 0 && !$isCurrentlyResizing) {
      axesFilters = [];
      const visibleDimensions = $parcoordVisibleDimensionsStore.filter(
        (dim) => dim.title !== '_i' && dim.title !== '_partition'
      );
      visibleDimensions.forEach((dim) => {
        if (dim.visible) axesFilters.push(value.get(dim.title) as AxesFilterType);
      });
      setTimeout(() => {
        worker.postMessage({
          function: 'applyFilters',
          axesFilters,
          margin
        });
      }, 100);
    }
  });

  const unsubscribeCustomRanges = parcoordCustomAxisRanges.subscribe(() => {
    if (!worker) return;
    setTimeout(() => {
      worker.postMessage({
        function: 'applyFilters',
        axesFilters,
        margin
      });
    }, 0);
  });

  let hoveredLinesIndices: Set<number> = new Set();
  const unsubscribeHovered = hoveredArray.subscribe((value) => {
    if (!worker) return;
    worker.postMessage({
      function: 'updateHovered',
      previouslyHoveredIndices: hoveredLinesIndices,
      hoveredIndices: value
    });
    hoveredLinesIndices = value;
  });

  let brushedLinesIndices: Set<number> = new Set();
  const unsubscribeBrushed = brushedArray.subscribe((value) => {
    if (!worker) return;
    worker.postMessage({
      function: 'updateBrushed',
      previouslyBrushedIndices: brushedLinesIndices,
      brushedIndices: value
    });
    brushedLinesIndices = value;
  });

  function setLineData() {
    lines = [];
    dataset.forEach((dataRow: any, i: number) => {
      const linePoints: number[][] = [];
      dimensions.forEach((dim: string, j: number) => {
        let yPos;
        if ($dimensionDataStore.get(dim)?.type === 'numerical') yPos = yScales[dim](dataRow[dim]);
        else yPos = yScales[dim](dataRow[dim]) + yScales[dim].step() / 2; // If data is categorical, add half of step to height

        linePoints.push([
          xScales[j],
          isNaN(yScales[dim](dataRow[dim])) ? margin.top : yPos + margin.top,
          lineData[i].position
        ]);
      });
      lines.push(linePoints);
    });
  }

  export function resetLines() {
    initializeArrays();
    worker?.postMessage({
      function: 'resetLines',
      lineShow
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

    if (clicked) {
      if (!isDragging) isDragging = true;

      addSelectionShapePoint({ x: event.offsetX, y: event.offsetY });
    }

    worker.postMessage({
      function: 'mouseMove',
      mouse,
      interactable: $isInteractableStore
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
        event.clientY >= canvasRect.top + margin.top &&
        event.clientY <= canvasRect.bottom &&
        event.clientX >= canvasRect.left &&
        event.clientX <= canvasRect.right
      ) ||
      (event.target as SVGElement)?.id !== 'parcoord-canvas-axes'
    )
      return;

    clicked = true;
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
    setTimeout(() => {
      if (!canvasEl || !$isInteractableStore) return;
      // Calculate normalized mouse coordinates relative to the canvas
      const canvasRect = canvasEl.getBoundingClientRect();
      mouse.x = ((event.clientX - canvasRect.left) / canvasRect.width) * 2 - 1;
      mouse.y = -((event.clientY - canvasRect.top) / canvasRect.height) * 2 + 1;
      // If mouse is not in canvas, return
      if (
        !(
          event.clientY >= canvasRect.top + margin.top &&
          event.clientY <= canvasRect.bottom &&
          event.clientX >= canvasRect.left &&
          event.clientX <= canvasRect.right
        )
      )
        return;

      clicked = false;
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
    }, 0);
  }

  export function drawLines() {
    setLineData();
    worker.postMessage({
      function: 'drawLines',
      lines
    });
  }

  function addSelectionShapePoint(point: CoordinateType) {
    if (selectionShape === 'line') selectionShapeLine[1] = point;
    else selectionShapeLine = [...rectangleToPolygon(selectionShapeLine[0], point), selectionShapeLine[0]];

    drawSelectionShape(selectionShapeLine);
    worker.postMessage({
      function: 'setSelectionShapeLine',
      points: selectionShapeLine
    });
  }

  export function swapPoints(fromIndex: number, toIndex: number) {
    for (let i = 0; i < lines.length; i++) {
      const temp = lines[i][fromIndex][1];
      lines[i][fromIndex][1] = lines[i][toIndex][1];
      lines[i][toIndex][1] = temp;
    }

    setTimeout(() => {
      worker.postMessage({
        function: 'drawLines',
        lines
      });
    }, 0);
  }

  export function handleInvertAxis(axisIndex: number) {
    dataset.forEach((dataRow: any, i: number) => {
      const dim = dimensions[axisIndex];
      let yPos;
      if ($dimensionDataStore.get(dim)?.type === 'numerical') yPos = yScales[dim](dataRow[dim]);
      else yPos = yScales[dim](dataRow[dim]) + yScales[dim].step() / 2; // If data is categorical, add half of step to height

      const linePoints = [
        xScales[axisIndex],
        isNaN(yScales[dim](dataRow[dim])) ? margin.top : yPos + margin.top,
        lineData[i].position
      ];
      lines[i][axisIndex] = linePoints;
    });

    worker.postMessage({
      function: 'drawLines',
      lines
    });
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

  function initializeArrays() {
    dimensions = dimensions;
    lineShow = Array(dataset.length).fill(true);
    lineData = Array(dataset.length).fill({ color: COLOR_ACTIVE, position: 0 });
    linkingArray.set(lineShow);
  }

  export const saveSVG = () => {
    return saveSVGUtil(
      width,
      height,
      dataset,
      lineShow,
      lineData,
      dimensions,
      yScales,
      xScales,
      margin,
      $dimensionDataStore,
      $partitionsStore,
      $partitionsDataStore,
      $brushedArray
    );
  };

  export function debounceDrawLines() {
    debouncedDrawLines();
  }

  onMount(() => {
    initializeArrays();
    window.addEventListener('pointermove', handleMouseMove, false);
    window.addEventListener('pointerdown', handleMouseDown, false);
    window.addEventListener('pointerup', handleMouseUp);
    throttledDrawLines = throttle(drawLines, 100);
    debouncedDrawLines = debounce(throttledDrawLines, 100);

    offscreenCanvasEl = canvasEl.transferControlToOffscreen();
    worker = new DrawingWorker();

    worker.postMessage(
      {
        function: 'init',
        canvas: offscreenCanvasEl,
        width,
        height,
        pointSize: 3
      },
      [offscreenCanvasEl]
    );

    worker.onmessage = (message) => {
      const data = message.data;
      switch (data.function) {
        case 'setHovered':
          if (!$isInteractableStore) break;
          hoveredArray.set(data.hoveredIndices);
          !isDragging && setTooltip(data.hoveredIndices);
          break;
        case 'setBrushed':
          brushedArray.set(data.brushedIndices);
          break;
        case 'setLineShow':
          lineShow = data.lineShow;
          linkingArray.set(lineShow);
          break;
        case 'canvasResized':
          currWidth = data.width;
          currHeight = data.height;
          break;
        default:
          break;
      }
    };
  });

  onDestroy(() => {
    unsubscribeSelectionShape();
    unsubscribePartitions();
    unsubscribePartitionsData();
    unsubscribeFilters();
    unsubscribeCustomRanges();
    unsubscribeHovered();
    unsubscribeBrushed();
  });
</script>

<canvas bind:this={canvasEl} />
