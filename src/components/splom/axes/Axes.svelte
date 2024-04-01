<script lang="ts">
  import { select } from 'd3-selection';
  import { calculateMaxLength } from '../../../util/text';
  import type { MarginType } from '../../../util/types';

  export let dimensions: string[] = [];
  export let size: number;
  export let margin: MarginType;
  export let activeDim: { x: number; y: number };
  export let hoveredDim: { x: number; y: number };

  let gridSize = 0;
  $: gridSize = size - margin.left - margin.right;

  $: if (size && dimensions && margin) {
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
    if (
      hoveredDim.x >= 0 &&
      hoveredDim.x < dimensions.length &&
      hoveredDim.y >= 0 &&
      hoveredDim.y < dimensions.length
    )
      renderRectangle(hoveredDim.x, hoveredDim.y, 'hovered');
  }

  function clearSVG() {
    const svg = select('#splom-canvas-axes');
    svg.selectChildren().remove();
  }

  function clearRectangle(type: 'active' | 'hovered') {
    const svg = select('#splom-canvas-axes');
    svg.selectAll(`.splom-axis-${type}-rectangle`).remove();
  }

  function renderRectangle(x: number, y: number, type: 'active' | 'hovered') {
    const svg = select('#splom-canvas-axes');
    const spacing = gridSize / dimensions.length;

    svg
      .append('rect')
      .attr('class', `splom-axis-${type}-rectangle`)
      .attr('x', margin.left + x * spacing)
      .attr('y', margin.top + y * spacing)
      .attr('width', spacing)
      .attr('height', spacing)
      .attr('stroke', type === 'active' ? 'red' : 'gray')
      .attr('fill', 'none')
      .attr('stroke-width', '2px');
  }

  function renderAxes() {
    if (!dimensions) return;

    const svg = select('#splom-canvas-axes');
    const spacing = gridSize / dimensions.length;

    // Draw horizontal grid lines
    for (let i = 0; i <= dimensions.length; i++) {
      svg
        .append('line')
        .attr('class', 'splom-axis-line-horizontal')
        .attr('x1', margin.left)
        .attr('y1', margin.top + i * spacing)
        .attr('x2', margin.left + gridSize)
        .attr('y2', margin.top + i * spacing)
        .attr('stroke', 'black')
        .attr('stroke-width', '0.5px');
    }

    // Draw vertical grid lines
    for (let i = 0; i <= dimensions.length; i++) {
      svg
        .append('line')
        .attr('class', 'splom-axis-line-vertical')
        .attr('x1', margin.left + i * spacing)
        .attr('y1', margin.top)
        .attr('x2', margin.left + i * spacing)
        .attr('y2', margin.top + gridSize)
        .attr('stroke', 'black')
        .attr('stroke-width', '0.5px');
    }

    // Add axis titles
    dimensions.forEach((dim, i) => {
      const maxTitleLength = calculateMaxLength(dim, 10, 'sans-serif', spacing);
      svg
        .append('text')
        .attr('class', 'splom-axis-title-top')
        .attr('x', margin.left + i * spacing + spacing / 2)
        .attr('y', margin.top - 5)
        .attr('font-size', '10px')
        .attr('text-anchor', 'middle')
        .text(dim.substring(0, maxTitleLength) + (dim.length === maxTitleLength ? '' : '...'));

      svg
        .append('text')
        .attr('class', 'splom-axis-title-diagonal')
        .attr('x', margin.left + i * spacing + spacing / 2)
        .attr('y', margin.top + i * spacing + spacing / 2 + 5)
        .attr('font-size', '10px')
        .attr('text-anchor', 'middle')
        .text(dim.substring(0, maxTitleLength) + (dim.length === maxTitleLength ? '' : '...'));

      svg
        .append('text')
        .attr('class', 'splom-axis-title-left')
        .attr(
          'transform',
          `rotate(-90, ${margin.left - 5}, ${margin.top + i * spacing + spacing / 2})`
        )
        .attr('x', margin.left - 5)
        .attr('y', margin.top + i * spacing + spacing / 2)
        .attr('font-size', '10px')
        .attr('text-anchor', 'middle')
        .text(dim.substring(0, maxTitleLength) + (dim.length === maxTitleLength ? '' : '...'));
    });
  }
</script>

<svg
  id="splom-canvas-axes"
  width={size}
  height={size}
  style="background-color: rgba(255, 255, 255, 0); position: absolute; top: 0; right: 0; bottom: 0; left: 0; z-index: 3; user-select: none;"
/>
