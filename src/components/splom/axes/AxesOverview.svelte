<script lang="ts">
  import { onMount } from 'svelte';
  import { select } from 'd3-selection';
  import { drag } from 'd3-drag';
  import { isInteractableStore } from '../../../stores/brushing';
  import { SPLOM_SHOWN_DIMENSIONS_NUM } from '../util';
  import type { CoordinateType } from '../../../util/types';

  export let dimensions: string[] = [];
  export let size: number;
  export let activeDimName: { x: string; y: string };
  export let visibleDimensionsStart: CoordinateType;
  export let hoveredDim: CoordinateType;
  export let setVisibleDim: (x?: number, y?: number) => void;

  let gridSize = 0;
  $: gridSize = size;

  let activeDim: CoordinateType = { x: 0, y: 0 };

  $: {
    if (activeDimName && visibleDimensionsStart)
      activeDim = {
        x: dimensions.findIndex((dim) => dim === activeDimName.x),
        y: dimensions.findIndex((dim) => dim === activeDimName.y)
      };
  }

  $: if (size && dimensions) {
    clearSVG();
    renderAxes();
    renderRectangle(activeDim.x, activeDim.y, 'active');
  }

  $: if (size && activeDim) {
    clearRectangle('active');
    renderRectangle(activeDim.x, activeDim.y, 'active');
  }

  $: if (size && hoveredDim) {
    clearRectangle('hovered');
    if (hoveredDim.x >= 0 && hoveredDim.x < dimensions.length && hoveredDim.y >= 0 && hoveredDim.y < dimensions.length)
      renderRectangle(hoveredDim.x + visibleDimensionsStart.x, hoveredDim.y + visibleDimensionsStart.y, 'hovered');
  }

  function clearSVG() {
    const svg = select('#splom-canvas-axes-overview');
    svg.selectChildren().remove();
  }

  function clearRectangle(type: 'active' | 'hovered') {
    const svg = select('#splom-canvas-axes-overview');
    svg.selectAll(`.splom-axis-overview-${type}-rectangle`).remove();
  }

  function renderRectangle(x: number, y: number, type: 'active' | 'hovered') {
    const svg = select('#splom-canvas-axes-overview');
    const spacing = gridSize / dimensions.length;

    svg
      .append('rect')
      .attr('class', `splom-axis-overview-${type}-rectangle`)
      .attr('x', x * spacing)
      .attr('y', y * spacing)
      .attr('width', spacing)
      .attr('height', spacing)
      .attr('stroke', type === 'active' ? 'red' : 'gray')
      .attr('fill', 'none')
      .attr('stroke-width', '2px');
  }

  function renderAxes() {
    if (!dimensions) return;

    const svg = select('#splom-canvas-axes-overview');
    const spacing = gridSize / dimensions.length;

    // Draw horizontal and vertical grid lines
    for (let i = 0; i <= dimensions.length; i++) {
      svg
        .append('line')
        .attr('class', 'splom-axis-overview-line-horizontal')
        .attr('x1', 0)
        .attr('y1', i * spacing)
        .attr('x2', gridSize)
        .attr('y2', i * spacing)
        .attr('stroke', 'black')
        .attr('stroke-width', '0.5px');

      svg
        .append('line')
        .attr('class', 'splom-axis-overview-line-vertical')
        .attr('x1', i * spacing)
        .attr('y1', 0)
        .attr('x2', i * spacing)
        .attr('y2', gridSize)
        .attr('stroke', 'black')
        .attr('stroke-width', '0.5px');
    }

    // Draw visible dimensions rectangle
    const overviewRectangle = svg
      .append('rect')
      .attr('class', `splom-axis-overview-visible-rectangle`)
      .attr('x', visibleDimensionsStart.x * spacing)
      .attr('y', visibleDimensionsStart.y * spacing)
      .attr('width', spacing * SPLOM_SHOWN_DIMENSIONS_NUM)
      .attr('height', spacing * SPLOM_SHOWN_DIMENSIONS_NUM)
      .attr('stroke', 'black')
      .attr('fill', 'none')
      .attr('pointer-events', 'all')
      .attr('stroke-width', '2px')
      .style('cursor', 'move');

    let dragStart: CoordinateType;
    let rectangleStart: CoordinateType;
    const dragBehavior = drag<SVGRectElement, unknown, any>()
      .on('start', (event) => {
        isInteractableStore.set(false);
        dragStart = {
          x: event.x,
          y: event.y
        };
        rectangleStart = {
          x: +overviewRectangle.attr('x'),
          y: +overviewRectangle.attr('y')
        };
      })
      .on('drag', (event) => {
        let newPos: CoordinateType = {
          x: rectangleStart.x + (event.x - dragStart.x),
          y: rectangleStart.y + (event.y - dragStart.y)
        };

        // Snap to grid
        newPos.x = Math.round(newPos.x / spacing) * spacing;
        newPos.y = Math.round(newPos.y / spacing) * spacing;

        // Dragging constraint
        const minX = 0;
        const minY = 0;
        const maxX = gridSize - +overviewRectangle.attr('width');
        const maxY = gridSize - +overviewRectangle.attr('height');
        newPos.x = Math.max(minX, Math.min(newPos.x, maxX));
        newPos.y = Math.max(minY, Math.min(newPos.y, maxY));

        overviewRectangle.attr('x', newPos.x);
        overviewRectangle.attr('y', newPos.y);
      })
      .on('end', () => {
        setVisibleDim(
          Math.round(+overviewRectangle.attr('x') / spacing),
          Math.round(+overviewRectangle.attr('y') / spacing)
        );
        isInteractableStore.set(true);
      });

    overviewRectangle.call(dragBehavior);
  }

  onMount(() => {
    if (size > 0 && dimensions.length > 0) {
      clearSVG();
      renderAxes();
      if (activeDim) {
        renderRectangle(activeDim.x, activeDim.y, 'active');
      }
      if (hoveredDim) {
        renderRectangle(hoveredDim.x + visibleDimensionsStart.x, hoveredDim.y + visibleDimensionsStart.y, 'hovered');
      }
    }
  });
</script>

<svg
  id="splom-canvas-axes-overview"
  width={size}
  height={size}
  style="background-color: rgba(255, 255, 255, 0); position: absolute; top: 0; right: 0; bottom: 0; left: 0; user-select: none;"
/>
