<script lang="ts">
  import { afterUpdate, onDestroy, onMount } from 'svelte';
  import OffscreenWorker from './offscreenWorker?worker';
  import { datasetStore, dimensionDataStore, labelDimension } from '../../../stores/dataset';
  import {
    filtersArray,
    parcoordCustomAxisRanges,
    parcoordHistogramData,
    parcoordIsInteractable
  } from '../../../stores/parcoord';
  import {
    brushedArray,
    hoveredArray,
    previouslyBrushedArray,
    previouslyHoveredArray
  } from '../../../stores/brushing';
  import { linkingArray } from '../../../stores/linking';
  import { isCurrentlyResizing } from '../../../stores/views';
  import { COLOR_ACTIVE, COLOR_BRUSHED, COLOR_FILTERED } from '../../../util/colors';
  import { select } from 'd3-selection';
  import { line as lineD3 } from 'd3-shape';
  import { debounce, throttle } from '../../../util/util';
  import type { DSVParsedArray } from 'd3-dsv';
  import type { RecordDataType, TooltipType } from '../../../util/types';
  import type { AxesFilterType } from '../types';

  export let dataset: DSVParsedArray<any>;
  export let width: number;
  export let height: number;
  export let dimensions: string[] = [];
  export let margin: any;
  export let xScales: any[];
  export let yScales: any;
  export let setTooltipData: (data: TooltipType) => void;

  let canvasEl: HTMLCanvasElement;
  let offscreenCanvasEl: OffscreenCanvas;
  let worker: Worker;
  let lines: number[][][] = [];
  let lineData: RecordDataType[] = [];
  let lineShow: boolean[] = [];
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
  let throttledDrawLines: () => void;
  let debouncedDrawLines: () => void;

  let axesFilters: AxesFilterType[] = [];
  const unsubscribeFilters = filtersArray.subscribe((value: any) => {
    axesFilters = value;
    if (worker && dataset?.length > 0 && dimensions?.length > 0 && !$isCurrentlyResizing) {
      setTimeout(() => {
        worker.postMessage({
          function: 'applyFilters',
          axesFilters,
          margin
        });
      }, 0);
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

  const unsubscribeParcoordHistogramData = parcoordHistogramData.subscribe(() => {
    if (!worker) return;
    setTimeout(() => {
      setLineData();
      worker.postMessage({
        function: 'redrawLines',
        lines
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

  function setLineData(): void {
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

    worker.postMessage({ function: 'mouseMove', mouse, interactable: $parcoordIsInteractable });

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
      setTooltipData({
        visible: false,
        posX: 0,
        posY: 0,
        clientX: 0,
        clientY: 0,
        text: [],
        overflowOffsetX: 0
      });

      if (!$parcoordIsInteractable) return;

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

  export function drawLines() {
    setLineData();
    worker.postMessage({
      function: 'drawLines',
      lines
    });
  }

  export function swapPoints(fromIndex: number, toIndex: number) {
    for (let i = 0; i < lines.length; i++) {
      const temp = lines[i][fromIndex][1];
      lines[i][fromIndex][1] = lines[i][toIndex][1];
      lines[i][toIndex][1] = temp;
    }

    worker.postMessage({
      function: 'drawLines',
      lines
    });
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
        posX: 0,
        posY: 0,
        clientX: 0,
        clientY: 0,
        text: [],
        overflowOffsetX: 0
      });
    } else {
      let tooltipText: string[] = [];
      hoveredLinesSet.forEach((i) => {
        tooltipText.push(`${dataset[i][$labelDimension]}`);
      });
      setTooltipData({
        visible: true,
        posX: tooltipPos.x + 12,
        posY: tooltipPos.y,
        clientX: tooltipPos.clientX,
        clientY: tooltipPos.clientY,
        text: tooltipText,
        overflowOffsetX: 16
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
    const tempContainer = document.createElement('div');
    const svgContainer = select(tempContainer)
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`);

    const lineGenerator = lineD3()
      .x((d: any) => d[0])
      .y((d: any) => d[1]);

    const filteredIndices: number[] = [],
      activeIndices: number[] = [];
    lineShow.forEach((value: boolean, i: number) => {
      value ? activeIndices.push(i) : filteredIndices.push(i);
    });

    const drawLineSVG = (dataRow: any[], color: number, opacity: number) => {
      const linePoints = [];
      for (let i = 0; i < dimensions.length; i++) {
        const dim = dimensions[i];

        let yPos;
        if ($dimensionDataStore.get(dim)?.type === 'numerical')
          yPos = yScales[dim](dataRow[dim as any]);
        else yPos = yScales[dim](dataRow[dim as any]) + yScales[dim].step() / 2; // If data is categorical, add half of step to height

        linePoints.push([
          xScales[i],
          isNaN(yScales[dim](dataRow[dim as any])) ? margin.top : yPos + margin.top
        ]);
      }

      svgContainer
        .append('path')
        .datum(linePoints)
        .attr('fill', 'none')
        .attr('stroke', `#${color.toString(16).replace(/^0x/, '')}`)
        .attr('stroke-width', 1)
        .attr('stroke-opacity', opacity)
        .attr('d', lineGenerator as any);
    };

    filteredIndices.forEach((i) => {
      drawLineSVG(dataset[i], COLOR_FILTERED, 0.75);
    });

    activeIndices.forEach((i) => {
      if (lineData[i].color === COLOR_BRUSHED) return;
      drawLineSVG(dataset[i], COLOR_ACTIVE, 0.75);
    });

    $brushedArray.forEach((i) => {
      drawLineSVG(dataset[i], COLOR_BRUSHED, 1);
    });

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgContainer.node() as Node);
    tempContainer.remove();
    return svgString;
  };

  onMount(() => {
    initializeArrays();
    window.addEventListener('pointermove', handleMouseMove, false);
    window.addEventListener('pointerdown', handleMouseDown, false);
    throttledDrawLines = throttle(drawLines, 10);
    debouncedDrawLines = debounce(throttledDrawLines, 10);

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
          if (!$parcoordIsInteractable) break;
          updatedHere = true;
          hoveredArray.set(data.hoveredIndices);
          setTooltip(data.hoveredIndices);
          break;
        case 'setBrushed':
          updatedHere = true;
          previouslyBrushedArray.set(data.previouslyBrushedIndices);
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

  afterUpdate(() => {
    if (currWidth === width && currHeight === height) return;
    worker.postMessage({ function: 'resizeCanvas', width, height });
    debouncedDrawLines();
  });

  onDestroy(() => {
    unsubscribeFilters();
    unsubscribeCustomRanges();
    unsubscribeParcoordHistogramData();
    unsubscribeHovered();
    unsubscribeBrushed();
    unsubscribePreviouslyHovered();
    unsubscribePreviouslyBrushed();
  });
</script>

<canvas bind:this={canvasEl} />
