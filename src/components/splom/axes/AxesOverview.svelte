<script lang="ts">
  import { onMount } from 'svelte';
  import { select } from 'd3-selection';
  import { SPLOM_SHOWN_DIMENSIONS_NUM } from '../util';
  import type { CoordinateType } from '../../../util/types';

  export let dimensions: string[] = [];
  export let size: number;
  export let activeDim: CoordinateType;
  export let shownDimensionsStart: CoordinateType;
  export let hoveredDim: CoordinateType;

  let gridSize = 0;
  $: gridSize = size;

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
      renderRectangle(hoveredDim.x, hoveredDim.y, 'hovered');
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
      .attr('x', (x + shownDimensionsStart.x) * spacing)
      .attr('y', (y + shownDimensionsStart.y) * spacing)
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

    // Draw shown dimensions rectangle
    svg
      .append('rect')
      .attr('class', `splom-axis-overview-shown-rectangle`)
      .attr('x', shownDimensionsStart.x * spacing)
      .attr('y', shownDimensionsStart.y * spacing)
      .attr('width', spacing * SPLOM_SHOWN_DIMENSIONS_NUM)
      .attr('height', spacing * SPLOM_SHOWN_DIMENSIONS_NUM)
      .attr('stroke', 'black')
      .attr('fill', 'none')
      .attr('stroke-width', '2px');
  }

  onMount(() => {
    if (size > 0 && dimensions.length > 0) {
      clearSVG();
      renderAxes();
      if (activeDim) {
        renderRectangle(activeDim.x, activeDim.y, 'active');
      }
      if (hoveredDim) {
        renderRectangle(hoveredDim.x, hoveredDim.y, 'hovered');
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
