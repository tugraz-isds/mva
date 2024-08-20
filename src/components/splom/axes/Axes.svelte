<script lang="ts">
  import { onMount } from 'svelte';
  import { select, type BaseType, type Selection } from 'd3-selection';
  import { drag } from 'd3-drag';
  import { calculateMaxLength } from '../../../util/text';
  import { arrow_filter_down_icon } from '../../../util/icon-definitions';
  import type { CoordinateType, MarginType } from '../../../util/types';

  export let dimensionsX: string[] = [];
  export let dimensionsY: string[] = [];
  export let numericalDimensions: string[] = [];
  export let visibleDimensionsStart: CoordinateType;
  export let width: number;
  export let height: number;
  export let margin: MarginType;
  export let activeDim: CoordinateType;
  export let hoveredDim: CoordinateType;
  export let setVisibleDim: (x?: number, y?: number) => void;

  let gridSizeX = 0,
    gridSizeY = 0;
  $: gridSizeX = width - margin.left - margin.right;
  $: gridSizeY = height - margin.top - margin.bottom;

  $: if (width && height && margin && dimensionsX && dimensionsY) {
    clearSVG();
    renderAxes();
    renderRectangle(activeDim.x, activeDim.y, 'active');
  }

  $: if (width && height && activeDim) {
    clearRectangle('active');
    renderRectangle(activeDim.x, activeDim.y, 'active');
  }

  $: if (width && height && hoveredDim) {
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
    const spacingX = gridSizeX / dimensionsX.length;
    const spacingY = gridSizeY / dimensionsX.length;

    svg
      .append('rect')
      .attr('class', `splom-axis-${type}-rectangle`)
      .attr('x', margin.left + x * spacingX)
      .attr('y', margin.top + y * spacingY)
      .attr('width', spacingX)
      .attr('height', spacingY)
      .attr('stroke', type === 'active' ? 'red' : 'gray')
      .attr('fill', 'none')
      .attr('stroke-width', '2px');
  }

  function renderAxes() {
    if (!dimensionsX || !dimensionsY || dimensionsX.length === 0 || dimensionsY.length === 0) return;

    const svg = select('#splom-canvas-axes');
    const spacingX = gridSizeX / dimensionsX.length;
    const spacingY = gridSizeY / dimensionsY.length;

    drawLines(svg, spacingX, spacingY);
    drawAxisTitles(svg, spacingX, spacingY);

    const dimWidth = dimensionsX.length / numericalDimensions.length;
    const dimSpacingX = (1 / numericalDimensions.length) * gridSizeX;
    const dimSpacingY = (1 / numericalDimensions.length) * gridSizeY;

    if (dimWidth !== 1) {
      drawHorizontalScrollbar(svg, dimWidth, dimSpacingX);
      drawVerticalScrollbar(svg, dimWidth, dimSpacingY);
    }
  }

  function drawLines(svg: Selection<BaseType, unknown, HTMLElement, any>, spacingX: number, spacingY: number) {
    // Draw horizontal grid lines
    for (let i = 0; i <= dimensionsY.length; i++) {
      svg
        .append('line')
        .attr('class', 'splom-axis-line-horizontal')
        .attr('x1', margin.left)
        .attr('y1', margin.top + i * spacingY)
        .attr('x2', margin.left + gridSizeX)
        .attr('y2', margin.top + i * spacingY)
        .attr('stroke', 'black')
        .attr('stroke-width', '0.5px');
    }

    // Draw vertical grid lines
    for (let i = 0; i <= dimensionsX.length; i++) {
      svg
        .append('line')
        .attr('class', 'splom-axis-line-vertical')
        .attr('x1', margin.left + i * spacingX)
        .attr('y1', margin.top)
        .attr('x2', margin.left + i * spacingX)
        .attr('y2', margin.top + gridSizeY)
        .attr('stroke', 'black')
        .attr('stroke-width', '0.5px');
    }
  }

  function drawAxisTitles(svg: Selection<BaseType, unknown, HTMLElement, any>, spacingX: number, spacingY: number) {
    dimensionsX.forEach((dim, i) => {
      const maxTitleLength = calculateMaxLength(dim, 10, 'sans-serif', spacingX);
      svg
        .append('text')
        .attr('class', 'splom-axis-title-top')
        .attr('x', margin.left + i * spacingX + spacingX / 2)
        .attr('y', margin.top - 5)
        .attr('font-size', '0.625rem')
        .attr('text-anchor', 'middle')
        .text(dim.substring(0, maxTitleLength) + (dim.length === maxTitleLength ? '' : '...'));
    });

    dimensionsY.forEach((dim, i) => {
      const maxTitleLength = calculateMaxLength(dim, 10, 'sans-serif', spacingX);
      svg
        .append('text')
        .attr('class', 'splom-axis-title-left')
        .attr('transform', `rotate(-90, ${margin.left - 5}, ${margin.top + i * spacingY + spacingY / 2})`)
        .attr('x', margin.left - 5)
        .attr('y', margin.top + i * spacingY + spacingY / 2)
        .attr('font-size', '0.625rem')
        .attr('text-anchor', 'middle')
        .text(dim.substring(0, maxTitleLength) + (dim.length === maxTitleLength ? '' : '...'));
    });

    dimensionsX.forEach((dimX, i) => {
      dimensionsY.forEach((dimY, j) => {
        if (dimX === dimY) {
          const maxTitleLength = calculateMaxLength(dimX, 10, 'sans-serif', spacingX);
          svg
            .append('text')
            .attr('class', 'splom-axis-title-diagonal')
            .attr('x', margin.left + i * spacingX + spacingX / 2)
            .attr('y', margin.top + j * spacingY + spacingY / 2 + 5)
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
      .attr('transform', `translate(${margin.left - 16}, ${margin.top + gridSizeY + 15}) rotate(90, 8, 8)`);
    groupLeft
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', '0.75rem')
      .attr('height', '0.75rem')
      .attr('fill', '#f0f0f0')
      .attr('stroke', '#888')
      .attr('stroke-width', '0.5px');
    groupLeft
      .append('svg')
      .attr('x', '0.125rem')
      .attr('y', '0.125rem')
      .attr('width', '0.5rem')
      .attr('height', '0.5rem')
      .html(arrow_filter_down_icon);

    const groupRight = svg
      .append('g')
      .attr('class', 'splom-scrollbar splom-scrollbar-horizontal-icon-group-right')
      .attr('transform', `translate(${margin.left + gridSizeX}, ${margin.top + gridSizeY + 11}) rotate(270, 8, 8)`);
    groupRight
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', '0.75rem')
      .attr('height', '0.75rem')
      .attr('fill', '#f0f0f0')
      .attr('stroke', '#888')
      .attr('stroke-width', '0.5px');
    groupRight
      .append('svg')
      .attr('x', '0.125rem')
      .attr('y', '0.125rem')
      .attr('width', '0.5rem')
      .attr('height', '0.5rem')
      .html(arrow_filter_down_icon);

    svg
      .append('rect')
      .attr('class', 'splom-scrollbar splom-scrollbar-horizontal-rect')
      .attr('x', margin.left)
      .attr('y', margin.top + gridSizeY + 15)
      .attr('width', gridSizeX)
      .attr('height', '0.710rem')
      .attr('fill', '#f0f0f0')
      .attr('stroke', '#888')
      .attr('stroke-width', '0.5px');

    const scrollThumb = svg
      .append('rect')
      .attr('class', 'splom-scrollbar splom-scrollbar-horizontal-rect-thumb')
      .attr('x', margin.left + visibleDimensionsStart.x * dimSpacing)
      .attr('y', margin.top + gridSizeY + 15)
      .attr('width', dimWidth * gridSizeX)
      .attr('height', '0.75rem')
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
        const maxX = margin.left + gridSizeX - +scrollThumb.attr('width');
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
      .attr('transform', `translate(${margin.left + gridSizeX + 11}, ${margin.top - 16}) rotate(180, 8, 8)`);
    groupTop
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', '0.75rem')
      .attr('height', '0.75rem')
      .attr('fill', '#f0f0f0')
      .attr('stroke', '#888')
      .attr('stroke-width', '0.5px');
    groupTop
      .append('svg')
      .attr('x', '0.125rem')
      .attr('y', '0.125rem')
      .attr('width', '0.5rem')
      .attr('height', '0.5rem')
      .html(arrow_filter_down_icon);

    const groupBottom = svg
      .append('g')
      .attr('class', 'splom-scrollbar splom-scrollbar-vertical-icon-group-bottom')
      .attr('transform', `translate(${margin.left + gridSizeX + 15}, ${margin.top + gridSizeY})`);
    groupBottom
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', '0.75rem')
      .attr('height', '0.75rem')
      .attr('fill', '#f0f0f0')
      .attr('stroke', '#888')
      .attr('stroke-width', '0.5px');
    groupBottom
      .append('svg')
      .attr('x', '0.125rem')
      .attr('y', '0.125rem')
      .attr('width', '0.5rem')
      .attr('height', '0.5rem')
      .html(arrow_filter_down_icon);

    svg
      .append('rect')
      .attr('class', 'splom-scrollbar splom-scrollbar-vertical-rect')
      .attr('x', margin.left + gridSizeX + 15)
      .attr('y', margin.top)
      .attr('width', '0.75rem')
      .attr('height', gridSizeY)
      .attr('fill', '#f0f0f0')
      .attr('stroke', '#888')
      .attr('stroke-width', '0.5px');

    const scrollThumb = svg
      .append('rect')
      .attr('class', 'splom-scrollbar splom-scrollbar-horizontal-rect-thumb')
      .attr('x', margin.left + gridSizeX + 15)
      .attr('y', margin.top + visibleDimensionsStart.y * dimSpacing)
      .attr('width', '0.75rem')
      .attr('height', dimWidth * gridSizeY)
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
        const maxY = margin.top + gridSizeY - +scrollThumb.attr('height');
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

  onMount(() => {
    clearSVG();
    renderAxes();
    renderRectangle(activeDim.x, activeDim.y, 'active');
  });
</script>

<svg
  id="splom-canvas-axes"
  {width}
  {height}
  style="background-color: rgba(255, 255, 255, 0); position: absolute; top: 0; right: 0; bottom: 0; left: 0; z-index: 3; user-select: none;"
/>
