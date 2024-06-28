<script lang="ts">
  import { select, type BaseType, type Selection } from 'd3-selection';
  import { drag } from 'd3-drag';
  import { calculateMaxLength } from '../../../util/text';
  import { arrow_filter_down_icon } from '../../../util/icon-definitions';
  import type { CoordinateType, MarginType } from '../../../util/types';

  export let dimensionsX: string[] = [];
  export let dimensionsY: string[] = [];
  export let numericalDimensions: string[] = [];
  export let visibleDimensionsStart: CoordinateType;
  export let size: number;
  export let margin: MarginType;
  export let activeDim: CoordinateType;
  export let hoveredDim: CoordinateType;
  export let setVisibleDim: (x?: number, y?: number) => void;

  let gridSize = 0;
  $: gridSize = size - margin.left - margin.right;

  $: if (size && margin && dimensionsX && dimensionsY) {
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
    if (x < 0 || y < 0 || x >= dimensionsX.length || y >= dimensionsY.length) return;
    const svg = select('#splom-canvas-axes');
    const spacing = gridSize / dimensionsX.length;

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
    if (!dimensionsX || !dimensionsY || dimensionsX.length === 0 || dimensionsY.length === 0) return;

    const svg = select('#splom-canvas-axes');
    const spacing = gridSize / dimensionsX.length;

    drawLines(svg, spacing);
    drawAxisTitles(svg, spacing);

    const dimWidth = dimensionsX.length / numericalDimensions.length;
    const dimSpacing = (1 / numericalDimensions.length) * gridSize;

    if (dimWidth !== 1) {
      drawHorizontalScrollbar(svg, dimWidth, dimSpacing);
      drawVerticalScrollbar(svg, dimWidth, dimSpacing);
    }
  }

  function drawLines(svg: Selection<BaseType, unknown, HTMLElement, any>, spacing: number) {
    // Draw horizontal grid lines
    for (let i = 0; i <= dimensionsY.length; i++) {
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
    for (let i = 0; i <= dimensionsX.length; i++) {
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
  }

  function drawAxisTitles(svg: Selection<BaseType, unknown, HTMLElement, any>, spacing: number) {
    dimensionsX.forEach((dim, i) => {
      const maxTitleLength = calculateMaxLength(dim, 10, 'sans-serif', spacing);
      svg
        .append('text')
        .attr('class', 'splom-axis-title-top')
        .attr('x', margin.left + i * spacing + spacing / 2)
        .attr('y', margin.top - 5)
        .attr('font-size', '0.625rem')
        .attr('text-anchor', 'middle')
        .text(dim.substring(0, maxTitleLength) + (dim.length === maxTitleLength ? '' : '...'));
    });

    dimensionsY.forEach((dim, i) => {
      const maxTitleLength = calculateMaxLength(dim, 10, 'sans-serif', spacing);
      svg
        .append('text')
        .attr('class', 'splom-axis-title-left')
        .attr('transform', `rotate(-90, ${margin.left - 5}, ${margin.top + i * spacing + spacing / 2})`)
        .attr('x', margin.left - 5)
        .attr('y', margin.top + i * spacing + spacing / 2)
        .attr('font-size', '0.625rem')
        .attr('text-anchor', 'middle')
        .text(dim.substring(0, maxTitleLength) + (dim.length === maxTitleLength ? '' : '...'));
    });

    dimensionsX.forEach((dimX, i) => {
      dimensionsY.forEach((dimY, j) => {
        if (dimX === dimY) {
          const maxTitleLength = calculateMaxLength(dimX, 10, 'sans-serif', spacing);
          svg
            .append('text')
            .attr('class', 'splom-axis-title-diagonal')
            .attr('x', margin.left + i * spacing + spacing / 2)
            .attr('y', margin.top + j * spacing + spacing / 2 + 5)
            .attr('font-size', '0.625rem')
            .attr('text-anchor', 'middle')
            .text(dimX.substring(0, maxTitleLength) + (dimX.length === maxTitleLength ? '' : '...'));
        }
      });
    });
  }

  function drawHorizontalScrollbar(
    svg: Selection<BaseType, unknown, HTMLElement, any>,
    dimWidth: number,
    dimSpacing: number
  ) {
    const groupLeft = svg
      .append('g')
      .attr('class', 'splom-scrollbar splom-scrollbar-horizontal-icon-group-left')
      .attr('transform', `translate(${margin.left - 16}, 5) rotate(90, 8, 8)`);
    groupLeft
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', '1rem')
      .attr('height', '1rem')
      .attr('fill', '#f0f0f0')
      .attr('stroke', '#888')
      .attr('stroke-width', '0.5px');
    groupLeft
      .append('svg')
      .attr('x', '0.25rem')
      .attr('y', '0.25rem')
      .attr('width', '0.5rem')
      .attr('height', '0.5rem')
      .html(arrow_filter_down_icon);

    const groupRight = svg
      .append('g')
      .attr('class', 'splom-scrollbar splom-scrollbar-horizontal-icon-group-right')
      .attr('transform', `translate(${margin.left + gridSize}, 5) rotate(270, 8, 8)`);
    groupRight
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', '1rem')
      .attr('height', '1rem')
      .attr('fill', '#f0f0f0')
      .attr('stroke', '#888')
      .attr('stroke-width', '0.5px');
    groupRight
      .append('svg')
      .attr('x', '0.25rem')
      .attr('y', '0.25rem')
      .attr('width', '0.5rem')
      .attr('height', '0.5rem')
      .html(arrow_filter_down_icon);

    svg
      .append('rect')
      .attr('class', 'splom-scrollbar splom-scrollbar-horizontal-rect')
      .attr('x', margin.left)
      .attr('y', 5)
      .attr('width', gridSize)
      .attr('height', '1rem')
      .attr('fill', '#f0f0f0')
      .attr('stroke', '#888')
      .attr('stroke-width', '0.5px');

    const scrollThumb = svg
      .append('rect')
      .attr('class', 'splom-scrollbar splom-scrollbar-horizontal-rect-thumb')
      .attr('x', margin.left + visibleDimensionsStart.x * dimSpacing)
      .attr('y', 5)
      .attr('width', dimWidth * gridSize)
      .attr('height', '1rem')
      .attr('fill', '#888')
      .on('mouseover', function () {
        select(this).attr('fill', '#555');
      })
      .on('mouseout', function () {
        select(this).attr('fill', '#888');
      });

    let dragStart: number;
    let rectangleStart: number;
    const dragBehavior = drag<SVGRectElement, unknown, any>()
      .on('start', (event) => {
        dragStart = event.x;
        rectangleStart = +scrollThumb.attr('x');
      })
      .on('drag', (event) => {
        let newX = rectangleStart + (event.x - dragStart);
        newX = Math.round((newX - margin.left) / dimSpacing) * dimSpacing + margin.left; // Snap to width
        // Dragging constraint
        const maxX = margin.left + gridSize - +scrollThumb.attr('width');
        newX = Math.max(margin.left, Math.min(newX, maxX));
        scrollThumb.attr('x', newX);
      })
      .on('end', () => {
        const newStart = Math.round((+scrollThumb.attr('x') - margin.left) / dimSpacing);
        if (newStart !== visibleDimensionsStart.x) setVisibleDim(newStart);
      });

    scrollThumb.call(dragBehavior);
  }

  function drawVerticalScrollbar(
    svg: Selection<BaseType, unknown, HTMLElement, any>,
    dimWidth: number,
    dimSpacing: number
  ) {
    const groupTop = svg
      .append('g')
      .attr('class', 'splom-scrollbar splom-scrollbar-vertical-icon-group-top')
      .attr('transform', `translate(5, ${margin.top - 16}) rotate(180, 8, 8)`);
    groupTop
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', '1rem')
      .attr('height', '1rem')
      .attr('fill', '#f0f0f0')
      .attr('stroke', '#888')
      .attr('stroke-width', '0.5px');
    groupTop
      .append('svg')
      .attr('x', '0.25rem')
      .attr('y', '0.25rem')
      .attr('width', '0.5rem')
      .attr('height', '0.5rem')
      .html(arrow_filter_down_icon);

    const groupBottom = svg
      .append('g')
      .attr('class', 'splom-scrollbar splom-scrollbar-vertical-icon-group-bottom')
      .attr('transform', `translate(5, ${margin.top + gridSize})`);
    groupBottom
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', '1rem')
      .attr('height', '1rem')
      .attr('fill', '#f0f0f0')
      .attr('stroke', '#888')
      .attr('stroke-width', '0.5px');
    groupBottom
      .append('svg')
      .attr('x', '0.25rem')
      .attr('y', '0.25rem')
      .attr('width', '0.5rem')
      .attr('height', '0.5rem')
      .html(arrow_filter_down_icon);

    svg
      .append('rect')
      .attr('class', 'splom-scrollbar splom-scrollbar-vertical-rect')
      .attr('x', 5)
      .attr('y', margin.top)
      .attr('width', '1rem')
      .attr('height', gridSize)
      .attr('fill', '#f0f0f0')
      .attr('stroke', '#888')
      .attr('stroke-width', '0.5px');

    const scrollThumb = svg
      .append('rect')
      .attr('class', 'splom-scrollbar splom-scrollbar-horizontal-rect-thumb')
      .attr('x', 5)
      .attr('y', margin.top + visibleDimensionsStart.y * dimSpacing)
      .attr('width', '1rem')
      .attr('height', dimWidth * gridSize)
      .attr('fill', '#888')
      .on('mouseover', function () {
        select(this).attr('fill', '#555');
      })
      .on('mouseout', function () {
        select(this).attr('fill', '#888');
      });

    let dragStart: number;
    let rectangleStart: number;
    const dragBehavior = drag<SVGRectElement, unknown, any>()
      .on('start', (event) => {
        dragStart = event.y;
        rectangleStart = +scrollThumb.attr('y');
      })
      .on('drag', (event) => {
        let newY = rectangleStart + (event.y - dragStart);
        newY = Math.round((newY - margin.top) / dimSpacing) * dimSpacing + margin.top; // Snap to width
        // Dragging constraint
        const maxY = margin.top + gridSize - +scrollThumb.attr('height');
        newY = Math.max(margin.top, Math.min(newY, maxY));
        scrollThumb.attr('y', newY);
      })
      .on('end', () => {
        const newStart = Math.round((+scrollThumb.attr('y') - margin.top) / dimSpacing);
        if (newStart !== visibleDimensionsStart.y) setVisibleDim(undefined, newStart);
      });

    scrollThumb.call(dragBehavior);
  }

  export const saveSVG = () => {
    const svgElement = document.getElementById('splom-canvas-axes');
    if (!svgElement) return;
    const serializer = new XMLSerializer();
    const svgElementCopy = svgElement.cloneNode(true) as SVGElement;
    select(svgElementCopy).selectAll('.splom-scrollbar').remove();
    return serializer.serializeToString(svgElementCopy);
  };
</script>

<svg
  id="splom-canvas-axes"
  width={size}
  height={size}
  style="background-color: rgba(255, 255, 255, 0); position: absolute; top: 0; right: 0; bottom: 0; left: 0; z-index: 3; user-select: none;"
/>
